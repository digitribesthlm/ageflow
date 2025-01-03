import { connectToDatabase } from '../../../utils/mongodb'

export default async function handler(req, res) {
  try {
    const { db } = await connectToDatabase()
    const { id } = req.query

    if (req.method === 'GET') {
      // Fetch task
      const task = await db.collection('agency_tasks')
        .findOne({ task_id: id })

      if (!task) {
        return res.status(404).json({ message: 'Task not found' })
      }

      // Fetch process instance to get template_id
      const processInstance = await db.collection('agency_process_instances')
        .findOne({ instance_id: task.process_instance_id })

      if (processInstance?.template_id) {
        // Fetch process template
        const processTemplate = await db.collection('agency_process_templates')
          .findOne({ template_id: processInstance.template_id })

        if (processTemplate) {
          // Find the specific task template from the process template
          const step = processTemplate.steps.find(s => s.name === task.phase_name)
          const taskTemplate = step?.tasks.find(t => t.name === task.name)

          // Enhance task with template information
          const enhancedTask = {
            ...task,
            template_info: {
              process_name: processTemplate.name,
              process_category: processTemplate.category,
              process_version: processTemplate.version,
              required_tools: taskTemplate?.required_tools || [],
              deliverables: taskTemplate?.deliverables || [],
              instruction_doc: taskTemplate?.instruction_doc,
              sub_tasks: taskTemplate?.sub_tasks || []
            }
          }

          return res.status(200).json(enhancedTask)
        }
      }

      // Return task without template info if not found
      return res.status(200).json(task)
    }

    // Handle PUT request for updating task
    if (req.method === 'PUT') {
      const updates = req.body
      delete updates._id // Remove MongoDB _id if present

      const result = await db.collection('agency_tasks').updateOne(
        { task_id: id },
        { $set: { ...updates, updated_at: new Date() } }
      )

      if (result.matchedCount === 0) {
        return res.status(404).json({ message: 'Task not found' })
      }

      return res.status(200).json({ message: 'Task updated successfully' })
    }

    res.setHeader('Allow', ['GET', 'PUT'])
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` })

  } catch (error) {
    console.error('Task API error:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
} 