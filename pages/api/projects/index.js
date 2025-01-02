import { connectToDatabase } from '../../../utils/mongodb'

export default async function handler(req, res) {
    try {
        const { db } = await connectToDatabase()

        switch (req.method) {
            case 'POST':
                const { 
                    name, 
                    client_id, 
                    contract_id,
                    services, 
                    start_date, 
                    end_date,
                    employeeAssignments 
                } = req.body

                if (!name || !client_id || !contract_id || !services || !start_date || !end_date) {
                    return res.status(400).json({ message: 'Missing required fields' })
                }

                // Create project
                const project = {
                    project_id: `PRJ${Date.now()}`,
                    name,
                    client_id,
                    contract_id,
                    status: 'planning',
                    start_date: new Date(start_date),
                    end_date: new Date(end_date),
                    services: services.map(service => service.service_id),
                    active: true,
                    created_at: new Date(),
                    updated_at: new Date()
                }

                // Create process instances for each service
                const processInstances = services.map(service => {
                    const phases = service.deliverables.map((phase, phaseIndex) => {
                        const phaseLead = employeeAssignments[`phase_${service.service_id}_${phaseIndex}`]
                        const tasks = phase.tasks.map((task, taskIndex) => {
                            const assignedTo = employeeAssignments[`task_${service.service_id}_${phaseIndex}_${taskIndex}`]
                            return {
                                task_id: `TSK_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                                name: task.name,
                                description: task.description,
                                estimated_hours: task.estimated_hours,
                                assigned_to: assignedTo,
                                status: 'pending',
                                deliverables: task.deliverables || [],
                                instruction_doc: task.instruction_doc
                            }
                        })

                        return {
                            phase_id: phase.phase_id || `PHASE_${phaseIndex}`,
                            name: phase.phase,
                            status: 'pending',
                            assigned_to: phaseLead,
                            tasks
                        }
                    })

                    return {
                        instance_id: `${service.category.toUpperCase()}${Date.now()}-${client_id}`,
                        template_id: service.process_template_id,
                        project_id: project.project_id,
                        client_id,
                        contract_id,
                        status: 'pending',
                        start_date: new Date(start_date),
                        phases,
                        active: true,
                        created_at: new Date()
                    }
                })

                // Create tasks in agency_tasks collection
                const tasks = processInstances.flatMap(instance => 
                    instance.phases.flatMap(phase => 
                        phase.tasks.map(task => ({
                            ...task,
                            process_instance_id: instance.instance_id,
                            project_id: project.project_id,
                            phase_id: phase.phase_id,
                            contract_id,
                            service_id: instance.template_id,
                            active: true,
                            created_at: new Date(),
                            updated_at: new Date()
                        }))
                    )
                )

                // Save everything to database
                await Promise.all([
                    db.collection('agency_projects').insertOne(project),
                    db.collection('agency_process_instances').insertMany(processInstances),
                    db.collection('agency_tasks').insertMany(tasks)
                ])

                return res.status(201).json({ 
                    message: 'Project created successfully',
                    project,
                    processInstances,
                    tasks
                })

            default:
                res.setHeader('Allow', ['POST'])
                return res.status(405).json({ message: `Method ${req.method} Not Allowed` })
        }
    } catch (error) {
        console.error('Projects API error:', error)
        return res.status(500).json({ message: 'Internal server error' })
    }
} 