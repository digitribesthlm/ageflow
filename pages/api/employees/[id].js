import { connectToDatabase } from '../../../utils/mongodb'

export default async function handler(req, res) {
  try {
    // Check auth token from cookie
    const authToken = req.cookies['auth-token']
    if (!authToken) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const { db } = await connectToDatabase()
    const { id } = req.query

    if (!id) {
      return res.status(400).json({ message: 'Employee ID is required' })
    }

    switch (req.method) {
      case 'POST':
        const { action } = req.body

        if (action === 'fetch_details') {
          const employee = await db.collection('agency_employees')
            .findOne({ employee_id: id })

          if (!employee) {
            return res.status(404).json({ message: 'Employee not found' })
          }

          // Find all process instances where employee is assigned
          const processInstances = await db.collection('agency_process_instances')
            .find({
              active: true,
              $or: [
                { 'phases.assigned_to': id },
                { 'phases.tasks.assigned_to': id }
              ]
            })
            .toArray()

          // Get unique project IDs
          const projectIds = [...new Set(processInstances.map(instance => instance.project_id))]

          // Fetch project details
          const projects = await db.collection('agency_projects')
            .find({
              project_id: { $in: projectIds },
              active: true
            })
            .toArray()

          // Add current projects to employee data
          employee.current_projects = projects

          // Fetch employee's tasks
          const tasks = await db.collection('agency_tasks')
            .find({
              assigned_to: id,
              active: true
            })
            .toArray()

          employee.assigned_tasks = tasks

          console.log('Found employee:', employee)
          console.log('Active projects:', projects.length)
          console.log('Assigned tasks:', tasks.length)

          return res.status(200).json(employee)
        }

        if (action === 'update') {
          const { 
            name,
            email,
            role,
            skills,
            hourly_rate,
            availability_hours,
            start_date,
            department,
            contact_info
          } = req.body

          const updateData = {
            name,
            email,
            role,
            skills: skills || [],
            hourly_rate: parseFloat(hourly_rate) || 0,
            availability_hours: parseInt(availability_hours) || 40,
            start_date: start_date ? new Date(start_date) : new Date(),
            department: department || 'general',
            contact_info: contact_info || {},
            updated_at: new Date()
          }

          const result = await db.collection('agency_employees').updateOne(
            { employee_id: id },
            { $set: updateData }
          )

          if (result.matchedCount === 0) {
            return res.status(404).json({ message: 'Employee not found' })
          }

          return res.status(200).json({ message: 'Employee updated successfully' })
        }

        if (action === 'delete') {
          // Soft delete by setting active to false
          const deleteResult = await db.collection('agency_employees').updateOne(
            { employee_id: id },
            { 
              $set: {
                active: false,
                updated_at: new Date()
              }
            }
          )

          if (deleteResult.matchedCount === 0) {
            return res.status(404).json({ message: 'Employee not found' })
          }

          return res.status(200).json({ message: 'Employee deleted successfully' })
        }

        return res.status(400).json({ message: 'Invalid action' })

      default:
        res.setHeader('Allow', ['POST'])
        return res.status(405).json({ message: `Method ${req.method} Not Allowed` })
    }
  } catch (error) {
    console.error('Employee API error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
} 