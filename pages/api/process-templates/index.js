import { connectToDatabase } from '../../../utils/mongodb'

export default async function handler(req, res) {
    try {
        const { db } = await connectToDatabase()

        switch (req.method) {
            case 'POST':
                const { action } = req.body

                if (action === 'fetch') {
                    const templates = await db.collection('agency_process_templates')
                        .find({ active: true })
                        .sort({ created_at: -1 })
                        .toArray()
                    
                    return res.status(200).json(templates)
                }

                return res.status(400).json({ message: 'Invalid action' })

            default:
                res.setHeader('Allow', ['POST'])
                return res.status(405).json({ message: `Method ${req.method} Not Allowed` })
        }
    } catch (error) {
        console.error('Process Templates API error:', error)
        return res.status(500).json({ message: 'Internal server error' })
    }
} 