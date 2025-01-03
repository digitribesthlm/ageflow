import { connectToDatabase } from '../../../utils/mongodb'

export default async function handler(req, res) {
    try {
        const { db } = await connectToDatabase()

        switch (req.method) {
            case 'POST':
                const { action } = req.body

                // Handle fetch action
                if (action === 'fetch') {
                    const projects = await db.collection('agency_projects')
                        .find({ active: true })
                        .sort({ created_at: -1 })
                        .toArray()
                    
                    console.log('Fetched projects:', projects.length)
                    return res.status(200).json(projects)
                }

                if (action === 'fetch_details') {
                    const { project_id } = req.body
                    if (!project_id) {
                        return res.status(400).json({ message: 'Project ID is required' })
                    }

                    // Fetch project
                    const project = await db.collection('agency_projects')
                        .findOne({ project_id, active: true })

                    if (!project) {
                        return res.status(404).json({ message: 'Project not found' })
                    }

                    // Fetch process instances
                    const processInstances = await db.collection('agency_process_instances')
                        .find({ 
                            project_id,
                            active: true
                        })
                        .toArray()

                    // Get all employee IDs from process instances
                    const employeeIds = new Set()
                    processInstances.forEach(instance => {
                        instance.phases.forEach(phase => {
                            if (phase.assigned_to) employeeIds.add(phase.assigned_to)
                            phase.tasks.forEach(task => {
                                if (task.assigned_to) employeeIds.add(task.assigned_to)
                            })
                        })
                    })

                    // Fetch employee details
                    const employees = await db.collection('agency_employees')
                        .find({ 
                            employee_id: { $in: Array.from(employeeIds) }
                        })
                        .project({
                            employee_id: 1,
                            name: 1,
                            role: 1
                        })
                        .toArray()

                    // Create employee lookup map
                    const employeeMap = employees.reduce((acc, emp) => {
                        acc[emp.employee_id] = emp
                        return acc
                    }, {})

                    // Enhance process instances with employee details
                    const enhancedInstances = processInstances.map(instance => ({
                        ...instance,
                        phases: instance.phases.map(phase => ({
                            ...phase,
                            assigned_to: phase.assigned_to ? {
                                id: phase.assigned_to,
                                ...employeeMap[phase.assigned_to]
                            } : null,
                            tasks: phase.tasks.map(task => ({
                                ...task,
                                assigned_to: task.assigned_to ? {
                                    id: task.assigned_to,
                                    ...employeeMap[task.assigned_to]
                                } : null
                            }))
                        }))
                    }))

                    console.log('Found project:', project)
                    console.log('Found process instances with employee details:', enhancedInstances)

                    return res.status(200).json({
                        project,
                        processInstances: enhancedInstances
                    })
                }

                // Handle create action
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