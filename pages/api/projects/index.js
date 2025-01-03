import { connectToDatabase } from '../../../utils/mongodb'

export default async function handler(req, res) {
    try {
        const { db } = await connectToDatabase()

        switch (req.method) {
            case 'POST':
                const { action } = req.body

                // Handle fetch action
                if (action === 'fetch') {
                    // First get all projects
                    const projects = await db.collection('agency_projects')
                        .find({ active: true })
                        .sort({ created_at: -1 })
                        .toArray()

                    // Get all project IDs
                    const projectIds = projects.map(p => p.project_id)

                    // Fetch all tasks for these projects
                    const tasks = await db.collection('agency_tasks')
                        .find({ 
                            project_id: { $in: projectIds },
                            active: true 
                        })
                        .toArray()

                    // Create a map of project tasks
                    const projectTasksMap = tasks.reduce((acc, task) => {
                        if (!acc[task.project_id]) {
                            acc[task.project_id] = []
                        }
                        acc[task.project_id].push(task)
                        return acc
                    }, {})

                    // Update project statuses based on their tasks
                    const updatedProjects = await Promise.all(projects.map(async project => {
                        const projectTasks = projectTasksMap[project.project_id] || []
                        let newStatus = 'planning'

                        if (projectTasks.length > 0) {
                            if (projectTasks.every(task => task.status === 'completed')) {
                                newStatus = 'completed'
                            } else if (projectTasks.some(task => task.status === 'completed' || task.status === 'in-progress')) {
                                newStatus = 'in-progress'
                            }
                        }

                        // Update project status in database if it's different
                        if (project.status !== newStatus) {
                            await db.collection('agency_projects').updateOne(
                                { project_id: project.project_id },
                                { 
                                    $set: { 
                                        status: newStatus,
                                        updated_at: new Date()
                                    }
                                }
                            )
                            return { ...project, status: newStatus }
                        }
                        return project
                    }))
                    
                    console.log('Fetched projects:', updatedProjects.length)
                    return res.status(200).json(updatedProjects)
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

                    // Fetch all tasks for this project to get their current status
                    const tasks = await db.collection('agency_tasks')
                        .find({ 
                            project_id,
                            active: true
                        })
                        .toArray()

                    // Create a map of task statuses
                    const taskStatusMap = tasks.reduce((acc, task) => {
                        acc[task.task_id] = task.status
                        return acc
                    }, {})

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

                    // Enhance process instances with employee details and sync task statuses
                    const enhancedInstances = processInstances.map(instance => ({
                        ...instance,
                        phases: instance.phases.map(phase => {
                            // Update tasks with their current status from tasks collection
                            const updatedTasks = phase.tasks.map(task => ({
                                ...task,
                                status: taskStatusMap[task.task_id] || task.status,
                                assigned_to: task.assigned_to ? {
                                    id: task.assigned_to,
                                    ...employeeMap[task.assigned_to]
                                } : null
                            }))

                            // Calculate phase status based on updated task statuses
                            const phaseStatus = calculatePhaseStatus(updatedTasks)

                            return {
                                ...phase,
                                status: phaseStatus,
                                assigned_to: phase.assigned_to ? {
                                    id: phase.assigned_to,
                                    ...employeeMap[phase.assigned_to]
                                } : null,
                                tasks: updatedTasks
                            }
                        })
                    }))

                    // Calculate and update project status
                    const projectStatus = calculateProjectStatus(enhancedInstances)
                    if (project.status !== projectStatus) {
                        await db.collection('agency_projects').updateOne(
                            { project_id },
                            { 
                                $set: { 
                                    status: projectStatus,
                                    updated_at: new Date()
                                }
                            }
                        )
                        project.status = projectStatus
                    }

                    return res.status(200).json({
                        project,
                        processInstances: enhancedInstances
                    })
                }

                if (action === 'update_task_status') {
                    const { project_id, instance_id, phase_id, task_id, status } = req.body
                    
                    if (!project_id || !instance_id || !phase_id || !task_id || !status) {
                        return res.status(400).json({ message: 'Missing required fields for task update' })
                    }

                    // Update task status in process instance
                    await db.collection('agency_process_instances').updateOne(
                        { 
                            instance_id,
                            'phases.phase_id': phase_id,
                            'phases.tasks.task_id': task_id
                        },
                        {
                            $set: {
                                'phases.$[phase].tasks.$[task].status': status,
                                updated_at: new Date()
                            }
                        },
                        {
                            arrayFilters: [
                                { 'phase.phase_id': phase_id },
                                { 'task.task_id': task_id }
                            ]
                        }
                    )

                    // Update task status in tasks collection
                    await db.collection('agency_tasks').updateOne(
                        { task_id },
                        {
                            $set: {
                                status,
                                updated_at: new Date()
                            }
                        }
                    )

                    // Update phase status based on tasks
                    const instance = await db.collection('agency_process_instances').findOne({ instance_id })
                    const phase = instance.phases.find(p => p.phase_id === phase_id)
                    const phaseStatus = calculatePhaseStatus(phase.tasks)
                    
                    await db.collection('agency_process_instances').updateOne(
                        { 
                            instance_id,
                            'phases.phase_id': phase_id
                        },
                        {
                            $set: {
                                'phases.$[phase].status': phaseStatus,
                                updated_at: new Date()
                            }
                        },
                        {
                            arrayFilters: [
                                { 'phase.phase_id': phase_id }
                            ]
                        }
                    )

                    // Update instance status based on phases
                    const instanceStatus = calculateInstanceStatus(instance.phases)
                    await db.collection('agency_process_instances').updateOne(
                        { instance_id },
                        {
                            $set: {
                                status: instanceStatus,
                                updated_at: new Date()
                            }
                        }
                    )

                    // Update project status based on instances
                    const allInstances = await db.collection('agency_process_instances')
                        .find({ project_id })
                        .toArray()
                    
                    const projectStatus = calculateProjectStatus(allInstances)
                    await db.collection('agency_projects').updateOne(
                        { project_id },
                        {
                            $set: {
                                status: projectStatus,
                                updated_at: new Date()
                            }
                        }
                    )

                    return res.status(200).json({ 
                        message: 'Task status updated successfully',
                        status,
                        phaseStatus,
                        instanceStatus,
                        projectStatus
                    })
                }

                // Helper functions for status calculation
                function calculatePhaseStatus(tasks) {
                    if (tasks.every(task => task.status === 'completed')) return 'completed'
                    if (tasks.some(task => task.status === 'completed' || task.status === 'in-progress')) return 'in-progress'
                    return 'pending'
                }

                function calculateInstanceStatus(phases) {
                    if (phases.every(phase => phase.status === 'completed')) return 'completed'
                    if (phases.some(phase => phase.status === 'completed' || phase.status === 'in-progress')) return 'in-progress'
                    return 'pending'
                }

                function calculateProjectStatus(instances) {
                    if (instances.every(instance => instance.status === 'completed')) return 'completed'
                    if (instances.some(instance => instance.status === 'completed' || instance.status === 'in-progress')) return 'in-progress'
                    return 'planning'
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
                const processInstances = services
                    .filter(service => service.deliverables && service.deliverables.length > 0)
                    .map(service => {
                        const phases = service.deliverables.map((deliverable, phaseIndex) => {
                            // Map tasks with their assignments
                            const tasks = deliverable.tasks.map((task, taskIndex) => ({
                                task_id: `TSK_${Date.now()}_${phaseIndex}_${taskIndex}`,
                                name: task.name,
                                description: task.description,
                                project_name: name,
                                service_name: service.name,
                                phase_name: deliverable.phase,
                                estimated_hours: task.estimated_hours || 0,
                                assigned_to: task.assigned_to,
                                status: 'pending',
                                priority: 'medium',
                                due_date: new Date(end_date),
                                created_at: new Date(),
                                updated_at: new Date()
                            }))

                            return {
                                phase_id: `PHASE_${Date.now()}_${phaseIndex}`,
                                name: deliverable.phase,
                                description: deliverable.description,
                                estimated_hours: tasks.reduce((sum, task) => sum + (task.estimated_hours || 0), 0),
                                status: 'pending',
                                assigned_to: deliverable.assigned_to,
                                tasks
                            }
                        })

                        return {
                            instance_id: `${service.category?.toUpperCase() || 'PROC'}${Date.now()}-${client_id}`,
                            template_id: service.process_template_id,
                            project_id: project.project_id,
                            project_name: name,
                            client_id,
                            contract_id,
                            service_id: service.service_id,
                            service_name: service.name,
                            category: service.category,
                            status: 'pending',
                            start_date: new Date(start_date),
                            end_date: new Date(end_date),
                            phases,
                            active: true,
                            created_at: new Date(),
                            updated_at: new Date()
                        }
                    })

                // Create tasks in agency_tasks collection
                const tasks = processInstances.flatMap(instance => 
                    instance.phases.flatMap(phase => 
                        phase.tasks.map(task => ({
                            ...task,
                            process_instance_id: instance.instance_id,
                            project_id: project.project_id,
                            project_name: name,
                            phase_id: phase.phase_id,
                            phase_name: phase.name,
                            contract_id,
                            service_id: instance.service_id,
                            service_name: instance.service_name,
                            category: instance.category,
                            active: true
                        }))
                    )
                )

                // Only proceed with database operations if we have valid data
                if (processInstances.length === 0) {
                    return res.status(400).json({ 
                        message: 'No valid process instances could be created. Please ensure services have deliverables.'
                    })
                }

                // Save everything to database
                await Promise.all([
                    db.collection('agency_projects').insertOne(project),
                    processInstances.length > 0 ? db.collection('agency_process_instances').insertMany(processInstances) : Promise.resolve(),
                    tasks.length > 0 ? db.collection('agency_tasks').insertMany(tasks) : Promise.resolve()
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