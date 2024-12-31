import { connectToDatabase } from '../../../utils/mongodb'

export default async function handler(req, res) {
    try {
        // Check auth token from cookie
        const authToken = req.cookies['auth-token']
        if (!authToken) {
            return res.status(401).json({ message: 'Unauthorized' })
        }

        const { db } = await connectToDatabase()
        const collection = db.collection('agency_process_templates')

        if (req.method === 'GET') {
            const templates = await collection.find({ active: true }).toArray()
            return res.status(200).json(templates)
        }

        if (req.method === 'POST') {
            const { name, category, version, steps, service_id } = req.body

            if (!name || !category || !steps || !service_id) {
                return res.status(400).json({ message: 'Missing required fields' })
            }

            const template = {
                template_id: `PROC${Date.now()}`,
                name,
                category,
                service_id,
                version: version || '1.0',
                steps,
                active: true,
                created_at: new Date(),
                updated_at: new Date()
            }

            await collection.insertOne(template)
            return res.status(201).json(template)
        }

        return res.status(405).json({ message: 'Method not allowed' })
    } catch (error) {
        console.error('Process templates API error:', error)
        return res.status(500).json({ message: 'Internal server error' })
    }
} 