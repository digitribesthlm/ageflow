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
        const { status, assigned_to, priority, due_date } = req.body
        const updateFields = {}

        // Add fields to update only if they are provided
        if (status) updateFields.status = status
        if (assigned_to) updateFields.assigned_to = assigned_to
        if (priority) updateFields.priority = priority
        if (due_date) updateFields.due_date = new Date(due_date)

        // Always update the updated_at timestamp
        updateFields.updated_at = new Date()

        const result = await db.collection('agency_tasks').updateOne(
          { task_id: id },
          { $set: updateFields }
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