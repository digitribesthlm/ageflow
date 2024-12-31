import { connectToDatabase } from '../../../utils/mongodb'

export default async function handler(req, res) {
  try {
    // Check auth token from cookie
    const authToken = req.cookies['auth-token']
    if (!authToken) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const { db } = await connectToDatabase()

    switch (req.method) {
      case 'GET':
        const services = await db.collection('agency_services')
          .find({ active: { $ne: false } })
          .sort({ name: 1 })
          .toArray()
        return res.status(200).json(services)

      case 'POST':
        const {
          name,
          category,
          service_type,
          billing_type,
          description,
          deliverables
        } = req.body

        const newService = {
          service_id: `SRV${Date.now()}`,
          name,
          category,
          service_type,
          billing_type,
          description,
          deliverables: deliverables.map(d => ({
            name: d.name,
            description: d.description,
            estimatedHours: parseFloat(d.estimatedHours)
          })),
          active: true,
          created_at: new Date()
        }

        await db.collection('agency_services').insertOne(newService)
        return res.status(201).json(newService)

      default:
        res.setHeader('Allow', ['GET', 'POST'])
        return res.status(405).json({ message: `Method ${req.method} Not Allowed` })
    }
  } catch (error) {
    console.error('Services API error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
} 