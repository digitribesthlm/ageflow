import { connectToDatabase } from '../../../utils/mongodb'

export default async function handler(req, res) {
  try {
    // Check auth token from cookie
    const authToken = req.cookies['auth-token']
    if (!authToken) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const { db } = await connectToDatabase()
    const { id } = req.query

    if (!id) {
      return res.status(400).json({ message: 'Task ID is required' })
    }

    switch (req.method) {
      case 'PUT':
        const { status } = req.body

        if (!status) {
          return res.status(400).json({ message: 'Status is required' })
        }

        const result = await db.collection('agency_tasks').updateOne(
          { task_id: id },
          { 
            $set: {
              status,
              updated_at: new Date()
            }
          }
        )

        if (result.matchedCount === 0) {
          return res.status(404).json({ message: 'Task not found' })
        }

        return res.status(200).json({ message: 'Task updated successfully' })

      default:
        res.setHeader('Allow', ['PUT'])
        return res.status(405).json({ message: `Method ${req.method} Not Allowed` })
    }
  } catch (error) {
    console.error('Task API error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
} 