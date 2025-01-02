import { connectToDatabase } from '../../../utils/mongodb'

export default async function handler(req, res) {
  try {
    // Check auth token from cookie
    const authToken = req.cookies['auth-token']
    if (!authToken) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const { db } = await connectToDatabase()
    const collection = db.collection('agency_services')

    if (req.method === 'GET') {
      const services = await collection.find({}).toArray()
      return res.status(200).json(services)
    }

    if (req.method === 'POST') {
      console.log('Creating new service with data:', req.body)
      const {
        name,
        description,
        category,
        service_type,
        billing_type,
        base_price,
        minimum_hours,
        included_hours,
        deliverables,
        process_template_id,
        selected_steps
      } = req.body

      // Log validation data
      console.log('Validating required fields:', {
        name,
        description,
        category,
        service_type,
        billing_type,
        process_template_id,
        selected_steps
      })

      // Remove deliverables from required fields check
      if (!name || !description || !category || !service_type || !billing_type || !process_template_id || !selected_steps?.length) {
        const missingFields = []
        if (!name) missingFields.push('name')
        if (!description) missingFields.push('description')
        if (!category) missingFields.push('category')
        if (!service_type) missingFields.push('service_type')
        if (!billing_type) missingFields.push('billing_type')
        if (!process_template_id) missingFields.push('process_template_id')
        if (!selected_steps?.length) missingFields.push('selected_steps')
        
        console.log('Missing required fields:', missingFields)
        return res.status(400).json({ message: `Missing required fields: ${missingFields.join(', ')}` })
      }

      // Get the process template to validate steps
      const templateCollection = db.collection('agency_process_templates')
      const template = await templateCollection.findOne({ template_id: process_template_id })
      
      console.log('Found template:', template)
      
      if (!template) {
        console.log('Process template not found:', process_template_id)
        return res.status(400).json({ message: 'Invalid process template' })
      }

      // Validate that all selected steps exist in the template
      const allTemplateSteps = template.steps?.flatMap(s => [
        ...s.tasks.map(t => t.task_template_id),
        ...s.tasks.flatMap(t => (t.sub_tasks || []).map(st => st.sub_task_template_id))
      ]) || []
      
      console.log('All template steps:', allTemplateSteps)
      console.log('Selected steps:', selected_steps)
      
      const invalidSteps = selected_steps.filter(id => !allTemplateSteps.includes(id))
      
      if (invalidSteps.length > 0) {
        console.log('Invalid steps found:', invalidSteps)
        return res.status(400).json({ message: 'Invalid steps selected' })
      }

      // Extract deliverables from selected steps
      const selectedDeliverables = []
      let totalEstimatedHours = 0

      template.steps.forEach(step => {
        // Add phase header
        const selectedTasksInPhase = step.tasks.filter(task => 
          selected_steps.includes(task.task_template_id) ||
          (task.sub_tasks || []).some(subTask => selected_steps.includes(subTask.sub_task_template_id))
        )

        if (selectedTasksInPhase.length > 0) {
          const phaseDeliverables = {
            phase: step.name,
            tasks: []
          }
          
          selectedTasksInPhase.forEach(task => {
            if (selected_steps.includes(task.task_template_id)) {
              const taskDeliverable = {
                name: task.name,
                description: task.description,
                estimated_hours: task.estimated_hours,
                sub_tasks: []
              }
              totalEstimatedHours += task.estimated_hours || 0
              phaseDeliverables.tasks.push(taskDeliverable)
            }

            // Add selected sub-tasks
            const selectedSubTasks = (task.sub_tasks || []).filter(subTask => 
              selected_steps.includes(subTask.sub_task_template_id)
            )

            selectedSubTasks.forEach(subTask => {
              const subTaskDeliverable = {
                name: subTask.name,
                description: subTask.description,
                estimated_hours: subTask.estimated_hours
              }
              totalEstimatedHours += subTask.estimated_hours || 0
              
              // Find parent task or create it if it doesn't exist
              let parentTask = phaseDeliverables.tasks.find(t => t.name === task.name)
              if (!parentTask) {
                parentTask = {
                  name: task.name,
                  description: task.description,
                  sub_tasks: []
                }
                phaseDeliverables.tasks.push(parentTask)
              }
              parentTask.sub_tasks.push(subTaskDeliverable)
            })
          })
          
          selectedDeliverables.push(phaseDeliverables)
        }
      })

      // Add manual deliverables if provided
      const manualDeliverables = deliverables ? {
        phase: 'Additional Deliverables',
        tasks: deliverables.split('\n')
          .filter(d => d.trim())
          .map(d => ({ name: d.trim() }))
      } : null

      // Only add manual deliverables if there are any
      const allDeliverables = manualDeliverables?.tasks.length > 0
        ? [...selectedDeliverables, manualDeliverables]
        : selectedDeliverables

      const service = {
        service_id: `SRV${Date.now()}`,
        name,
        description,
        category,
        service_type,
        billing_type,
        base_price: parseFloat(base_price),
        minimum_hours: parseInt(minimum_hours) || totalEstimatedHours,
        included_hours: parseInt(included_hours) || totalEstimatedHours,
        deliverables: allDeliverables,
        process_template_id,
        selected_steps,
        estimated_hours: totalEstimatedHours,
        created_at: new Date(),
        updated_at: new Date(),
        status: 'active'
      }

      console.log('Creating service:', service)
      await collection.insertOne(service)
      return res.status(201).json(service)
    }

    return res.status(405).json({ message: 'Method not allowed' })
  } catch (error) {
    console.error('Error in services API:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
} 