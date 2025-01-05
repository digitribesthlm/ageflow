import { connectToDatabase } from '../../../utils/mongodb'

export default async function handler(req, res) {
    try {
        const { db } = await connectToDatabase()

        switch (req.method) {
            case 'POST':
                const { action } = req.body

                if (action === 'fetch') {
                    const clients = await db.collection('agency_clients')
                        .find({ 
                            active: true,
                            name: { $exists: true, $ne: '' }  // Only get clients with valid names
                        })
                        .sort({ created_at: -1 })
                        .toArray()

                    // Filter out any invalid entries and format the response
                    const validClients = clients
                        .filter(client => client.name && client.name.trim())  // Ensure name exists and isn't just whitespace
                        .map(client => ({
                            client_id: client.client_id,
                            name: client.name.trim(),
                            company: client.company?.trim() || null,
                            email: client.email?.trim() || null,
                            phone: client.phone?.trim() || null,
                            address: client.address?.trim() || null,
                            created_at: client.created_at,
                            updated_at: client.updated_at
                        }))

                    return res.status(200).json(validClients)
                }

                if (action === 'create') {
                    const { name, company, industry, domain, contactInfo } = req.body
                    
                    if (!name || !company) {
                        return res.status(400).json({ message: 'Name and company are required' })
                    }

                    const client = {
                        client_id: `CLT${Date.now()}`,
                        name,
                        company,
                        industry,
                        domain,
                        contactInfo,
                        active: true,
                        created_at: new Date(),
                        updated_at: new Date()
                    }

                    await db.collection('agency_clients').insertOne(client)
                    return res.status(201).json(client)
                }

                return res.status(400).json({ message: 'Invalid action' })

            default:
                res.setHeader('Allow', ['POST'])
                return res.status(405).json({ message: `Method ${req.method} Not Allowed` })
        }
    } catch (error) {
        console.error('Clients API error:', error)
        return res.status(500).json({ message: 'Internal server error' })
    }
} 