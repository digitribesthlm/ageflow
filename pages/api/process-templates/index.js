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

                if (action === 'fetch_details') {
                    const { template_id } = req.body
                    
                    if (!template_id) {
                        return res.status(400).json({ message: 'Template ID is required' })
                    }

                    const template = await db.collection('agency_process_templates')
                        .findOne({ template_id, active: true })

                    if (!template) {
                        return res.status(404).json({ message: 'Template not found' })
                    }

                    return res.status(200).json(template)
                }

                if (action === 'create') {
                    const { template } = req.body
                    
                    if (!template || !template.name || !template.steps) {
                        return res.status(400).json({ message: 'Invalid template data' })
                    }

                    const result = await db.collection('agency_process_templates')
                        .insertOne(template)

                    if (!result.acknowledged) {
                        throw new Error('Failed to create template')
                    }

                    return res.status(201).json({ message: 'Template created successfully' })
                }

                if (action === 'update') {
                    const { template } = req.body
                    
                    if (!template || !template.template_id) {
                        return res.status(400).json({ message: 'Invalid template data' })
                    }

                    const { _id, ...templateWithoutId } = template

                    const result = await db.collection('agency_process_templates').updateOne(
                        { template_id: template.template_id },
                        { 
                            $set: {
                                ...templateWithoutId,
                                updated_at: new Date()
                            }
                        }
                    )

                    if (result.matchedCount === 0) {
                        return res.status(404).json({ message: 'Template not found' })
                    }

                    return res.status(200).json({ message: 'Template updated successfully' })
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