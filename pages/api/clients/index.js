import { connectToDatabase } from '../../../utils/mongodb'

export default async function handler(req, res) {
    try {
        const { db } = await connectToDatabase()

        switch (req.method) {
            case 'POST':
                const { action } = req.body

                if (action === 'fetch') {
                    const clients = await db.collection('agency_clients')
                        .find({ active: true })
                        .sort({ created_at: -1 })
                        .toArray()

                    return res.status(200).json(clients)
                }

                if (action === 'create') {
                    const { name, email, phone, address } = req.body
                    
                    if (!name) {
                        return res.status(400).json({ message: 'Client name is required' })
                    }

                    const client = {
                        client_id: `CLT${Date.now()}`,
                        name,
                        email,
                        phone,
                        address,
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