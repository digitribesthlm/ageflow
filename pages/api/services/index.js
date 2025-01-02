import { connectToDatabase } from '../../../utils/mongodb'

export default async function handler(req, res) {
  try {
    // Check auth token from cookie
    const authToken = req.cookies['auth-token']
    if (!authToken) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const { db } = await connectToDatabase()
    const collection = db.collection('agency_services')

    if (req.method === 'GET') {
      const services = await collection.find({}).toArray()
      return res.status(200).json(services)
    }

    if (req.method === 'POST') {
      const {
        name,
        description,
        category,
        service_type,
        billing_type,
        base_price,
        minimum_hours,
        included_hours,
        deliverables,
        process_template_id
      } = req.body

      if (!name || !description || !category || !service_type || !billing_type || !process_template_id) {
        return res.status(400).json({ message: 'Missing required fields' })
      }

      const service = {
        service_id: `SRV${Date.now()}`,
        name,
        description,
        category,
        service_type,
        billing_type,
        base_price: parseFloat(base_price),
        minimum_hours: parseInt(minimum_hours) || 0,
        included_hours: parseInt(included_hours) || 0,
        deliverables: deliverables.split('\n').filter(d => d.trim()),
        process_template_id,
        created_at: new Date(),
        updated_at: new Date(),
        status: 'active'
      }

      await collection.insertOne(service)
      return res.status(201).json(service)
    }

    return res.status(405).json({ message: 'Method not allowed' })
  } catch (error) {
    console.error('Error in services API:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
} 