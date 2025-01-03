import { connectToDatabase } from '../../../utils/mongodb'

export default async function handler(req, res) {
    try {
        const { db } = await connectToDatabase()

        switch (req.method) {
            case 'POST':
                const { action } = req.body

                if (action === 'fetch') {
                    // Fetch active employees
                    const employees = await db.collection('agency_employees')
                        .find({ active: true })
                        .project({
                            employee_id: 1,
                            name: 1,
                            role: 1,
                            skills: 1,
                            availability_hours: 1,
                            department: 1
                        })
                        .sort({ name: 1 })
                        .toArray()

                    // Get all process instances
                    const processInstances = await db.collection('agency_process_instances')
                        .find({ active: true })
                        .toArray()

                    // Count projects for each employee
                    const employeeProjectCounts = {}
                    processInstances.forEach(instance => {
                        if (!instance.phases) return
                        
                        instance.phases.forEach(phase => {
                            if (phase.assigned_to) {
                                employeeProjectCounts[phase.assigned_to] = employeeProjectCounts[phase.assigned_to] || new Set()
                                employeeProjectCounts[phase.assigned_to].add(instance.project_id)
                            }
                            if (phase.tasks) {
                                phase.tasks.forEach(task => {
                                    if (task.assigned_to) {
                                        employeeProjectCounts[task.assigned_to] = employeeProjectCounts[task.assigned_to] || new Set()
                                        employeeProjectCounts[task.assigned_to].add(instance.project_id)
                                    }
                                })
                            }
                        })
                    })

                    // Add project counts to employees
                    const enhancedEmployees = employees.map(emp => ({
                        ...emp,
                        project_count: employeeProjectCounts[emp.employee_id]?.size || 0
                    }))
                    
                    console.log('Fetched employees:', enhancedEmployees.length)
                    return res.status(200).json(enhancedEmployees)
                }

                return res.status(400).json({ message: 'Invalid action' })

            default:
                res.setHeader('Allow', ['POST'])
                return res.status(405).json({ message: `Method ${req.method} Not Allowed` })
        }
    } catch (error) {
        console.error('Error in employees API:', error)
        return res.status(500).json({ message: 'Internal Server Error' })
    }
} 