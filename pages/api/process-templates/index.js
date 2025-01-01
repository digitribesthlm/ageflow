import { connectToDatabase } from '../../../utils/mongodb'

export default async function handler(req, res) {
    try {
        console.log('Process Templates API Request:', {
            method: req.method,
            query: req.query,
            path: req.url
        })

        // Check auth token from cookie
        const authToken = req.cookies['auth-token']
        if (!authToken) {
            return res.status(401).json({ message: 'Unauthorized' })
        }

        const { db } = await connectToDatabase()
        const collection = db.collection('agency_process_templates')

        if (req.method === 'GET') {
            const templates = await collection.find({ active: true }).toArray()
            console.log('Found templates:', JSON.stringify(templates, null, 2))

            // If templates don't have service_id, let's update them
            if (templates.some(t => !t.service_id)) {
                // Map categories to service IDs
                const categoryToServiceMap = {
                    'SEO': 'SRV001',
                    'Content Marketing': 'SRV002',
                    'Social Media': 'SRV003'
                }

                // Update templates with service_id based on category
                const updatedTemplates = templates.map(template => {
                    if (!template.service_id) {
                        const service_id = categoryToServiceMap[template.category]
                        if (service_id) {
                            // Update in database
                            collection.updateOne(
                                { template_id: template.template_id },
                                { $set: { service_id } }
                            )
                            return { ...template, service_id }
                        }
                    }
                    return template
                })

                console.log('Updated templates:', JSON.stringify(updatedTemplates, null, 2))
                return res.status(200).json(updatedTemplates)
            }

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