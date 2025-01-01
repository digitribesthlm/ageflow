import { connectToDatabase } from '../../../utils/mongodb'

export default async function handler(req, res) {
  try {
    // Check auth token from cookie
    const authToken = req.cookies['auth-token']
    if (!authToken) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const { db } = await connectToDatabase()

    if (req.method === 'GET') {
      // Support fetching multiple services by IDs
      if (req.query.ids) {
        const serviceIds = req.query.ids.split(',')
        const services = await db.collection('agency_services')
          .find({ 
            service_id: { $in: serviceIds },
            active: { $ne: false }
          })
          .toArray()
        return res.status(200).json(services)
      }

      // Regular fetch all services
      const services = await db.collection('agency_services')
        .find({ active: { $ne: false } })
        .sort({ created_at: -1 })
        .toArray()
      return res.status(200).json(services)
    }

    if (req.method === 'POST') {
      const {
        name,
        category,
        service_type,
        billing_type,
        description,
        deliverables
      } = req.body

      if (!name || !category || !service_type || !billing_type) {
        return res.status(400).json({ message: 'Missing required fields' })
      }

      const newService = {
        service_id: `SRV${Date.now()}`,
        name,
        category,
        service_type,
        billing_type,
        description,
        deliverables: deliverables || [],
        active: true,
        created_at: new Date()
      }

      await db.collection('agency_services').insertOne(newService)
      return res.status(201).json(newService)
    }

    return res.status(405).json({ message: 'Method not allowed' })
  } catch (error) {
    console.error('Services API error:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
} 