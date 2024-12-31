import { connectToDatabase } from '../../../utils/mongodb'
import { v4 as uuidv4 } from 'uuid'

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
        const { project_id } = req.query
        
        // Build query based on whether project_id is provided
        const query = {
          active: { $ne: false }
        }
        if (project_id) {
          query.project_id = project_id
        }

        const tasks = await db.collection('agency_tasks')
          .find(query)
          .sort({ created_at: -1 })
          .toArray()

        return res.status(200).json(tasks || [])

      case 'POST':
        const {
          title,
          description,
          project_id: taskProjectId,
          assigned_to,
          status,
          priority,
          due_date,
          estimated_hours
        } = req.body

        if (!title || !taskProjectId) {
          return res.status(400).json({ message: 'Title and project ID are required' })
        }

        const newTask = {
          task_id: uuidv4(),
          title,
          description,
          project_id: taskProjectId,
          assigned_to,
          status: status || 'pending',
          priority: priority || 'medium',
          due_date: new Date(due_date),
          estimated_hours: parseFloat(estimated_hours) || 0,
          active: true,
          created_at: new Date(),
          updated_at: new Date()
        }

        await db.collection('agency_tasks').insertOne(newTask)
        return res.status(201).json(newTask)

      default:
        res.setHeader('Allow', ['GET', 'POST'])
        return res.status(405).json({ message: `Method ${req.method} Not Allowed` })
    }
  } catch (error) {
    console.error('Tasks API error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
} 