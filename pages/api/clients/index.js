import { connectToDatabase } from '../../../utils/mongodb'

export default async function handler(req, res) {
  try {
    // Check auth token from cookie
    const authToken = req.cookies['auth-token']
    if (!authToken) {
      console.error('No auth token found in cookies')
      return res.status(401).json({ message: 'Unauthorized - No token' })
    }

    try {
      // Verify token format
      const userData = JSON.parse(Buffer.from(authToken, 'base64').toString())
      if (!userData.userId) {
        console.error('Invalid token format:', userData)
        return res.status(401).json({ message: 'Unauthorized - Invalid token' })
      }
    } catch (tokenError) {
      console.error('Token parsing error:', tokenError)
      return res.status(401).json({ message: 'Unauthorized - Invalid token format' })
    }

    const { db } = await connectToDatabase()

    switch (req.method) {
      case 'POST':
        const { action } = req.body

        if (action === 'fetch') {
          // Get all clients that are:
          // 1. Active
          // 2. Have required fields (name, company)
          // 3. Have a valid client_id
          const clients = await db.collection('agency_clients')
            .find({ 
              active: true,
              name: { $exists: true, $ne: '' },
              company: { $exists: true, $ne: '' },
              client_id: { $exists: true, $ne: '' }
            })
            .project({
              client_id: 1,
              name: 1,
              company: 1,
              industry: 1,
              status: 1,
              contactInfo: 1,
              created_at: 1
            })
            .sort({ company: 1, name: 1 })
            .toArray()

          // Additional validation and formatting
          const validClients = clients
            .filter(client => 
              client.client_id && 
              client.name && 
              client.name.trim() && 
              client.company && 
              client.company.trim()
            )
            .map(client => ({
              ...client,
              displayName: `${client.company} (${client.name})`
            }))

          console.log('Fetched valid clients:', validClients.length)
          return res.status(200).json(validClients)
        }

        // Handle client creation
        const { name, company, industry, contactInfo } = req.body
        
        if (!name?.trim() || !company?.trim()) {
          return res.status(400).json({ message: 'Name and company are required' })
        }

        const newClient = {
          client_id: `CLT${Date.now()}`,
          name: name.trim(),
          company: company.trim(),
          industry,
          contactInfo,
          status: 'active',
          active: true,
          created_at: new Date()
        }
        await db.collection('agency_clients').insertOne(newClient)
        return res.status(201).json(newClient)

      default:
        res.setHeader('Allow', ['POST'])
        return res.status(405).json({ message: `Method ${req.method} Not Allowed` })
    }
  } catch (error) {
    console.error('Clients API error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
} 