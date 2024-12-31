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
        const templates = await db.collection('agency_process_templates')
          .find({ active: { $ne: false } })
          .toArray()
        
        return res.status(200).json(templates || [])

      default:
        res.setHeader('Allow', ['GET'])
        return res.status(405).json({ message: `Method ${req.method} Not Allowed` })
    }
  } catch (error) {
    console.error('Process Templates API error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
} 