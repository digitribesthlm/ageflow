import { connectToDatabase } from '../../../lib/mongodb'

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' })
    }

    try {
        // Check auth token from cookie
        const authToken = req.cookies['auth-token']
        if (!authToken) {
            return res.status(401).json({ message: 'Unauthorized' })
        }

        const { db } = await connectToDatabase()
        const tasks = req.body

        if (!Array.isArray(tasks) || tasks.length === 0) {
            return res.status(400).json({ message: 'Invalid tasks data' })
        }

        console.log('Creating tasks:', JSON.stringify(tasks, null, 2))

        // Insert all tasks in one operation
        const result = await db.collection('agency_tasks').insertMany(tasks)

        console.log('Tasks created:', result.insertedCount)

        return res.status(200).json({
            message: `Successfully created ${result.insertedCount} tasks`,
            insertedIds: result.insertedIds
        })
    } catch (error) {
        console.error('Error creating tasks:', error)
        return res.status(500).json({ message: 'Failed to create tasks', error: error.message })
    }
} 