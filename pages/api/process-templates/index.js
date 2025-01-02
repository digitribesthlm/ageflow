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
            console.log('Process templates from DB:', JSON.stringify(templates, null, 2))

            // If no templates exist or if SEO template is missing, create default templates
            if (templates.length === 0 || !templates.some(t => t.template_id === 'PROC_SEO_MAIN')) {
                const defaultSEOTemplate = {
                    template_id: 'PROC_SEO_MAIN',
                    name: 'SEO Process Template',
                    category: 'SEO',
                    service_id: 'SRV1735839347240', // Match the service ID from your data
                    version: '1.0',
                    steps: [
                        {
                            step_id: 'TASK_1',
                            name: 'Initial Setup',
                            order: 1,
                            tasks: [
                                {
                                    task_template_id: 'TASK_1_1',
                                    name: 'Keyword Research',
                                    description: 'Conduct comprehensive keyword research',
                                    estimated_hours: 4
                                },
                                {
                                    task_template_id: 'TASK_1_2',
                                    name: 'Competitor Analysis',
                                    description: 'Analyze top competitors',
                                    estimated_hours: 3
                                },
                                {
                                    task_template_id: 'TASK_1_3',
                                    name: 'Technical Audit',
                                    description: 'Perform technical SEO audit',
                                    estimated_hours: 4
                                },
                                {
                                    task_template_id: 'TASK_1_4',
                                    name: 'Content Audit',
                                    description: 'Audit existing content',
                                    estimated_hours: 4
                                }
                            ]
                        },
                        {
                            step_id: 'TASK_2',
                            name: 'Implementation',
                            order: 2,
                            tasks: [
                                {
                                    task_template_id: 'TASK_2_1',
                                    name: 'On-Page Optimization',
                                    description: 'Implement on-page SEO improvements',
                                    estimated_hours: 8,
                                    sub_tasks: [
                                        {
                                            sub_task_template_id: 'TASK_2_1_1',
                                            name: 'Meta Tags Optimization',
                                            description: 'Optimize title tags and meta descriptions',
                                            estimated_hours: 2
                                        },
                                        {
                                            sub_task_template_id: 'TASK_2_1_2',
                                            name: 'Content Optimization',
                                            description: 'Optimize existing content',
                                            estimated_hours: 2
                                        },
                                        {
                                            sub_task_template_id: 'TASK_2_1_3',
                                            name: 'Internal Linking',
                                            description: 'Improve internal linking structure',
                                            estimated_hours: 2
                                        },
                                        {
                                            sub_task_template_id: 'TASK_2_1_4',
                                            name: 'URL Structure',
                                            description: 'Optimize URL structure',
                                            estimated_hours: 2
                                        }
                                    ]
                                }
                            ]
                        }
                    ],
                    active: true,
                    created_at: new Date(),
                    updated_at: new Date()
                }

                // Insert or update the SEO template
                await collection.updateOne(
                    { template_id: 'PROC_SEO_MAIN' },
                    { $set: defaultSEOTemplate },
                    { upsert: true }
                )

                // Fetch updated templates
                const updatedTemplates = await collection.find({ active: true }).toArray()
                console.log('Templates after initialization:', JSON.stringify(updatedTemplates, null, 2))
                return res.status(200).json(updatedTemplates)
            }

            return res.status(200).json(templates)
        }

        if (req.method === 'POST') {
            const { name, category, version, steps, service_id, template_id } = req.body

            if (!name || !category || !steps || !service_id) {
                return res.status(400).json({ message: 'Missing required fields' })
            }

            const template = {
                template_id: template_id || `PROC${Date.now()}`,
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