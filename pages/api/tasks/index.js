import { connectToDatabase } from '../../../utils/mongodb'
import { v4 as uuidv4 } from 'uuid'

export default async function handler(req, res) {
  try {
    // Check auth token from cookie
    const authToken = req.cookies['auth-token']
    if (!authToken) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const { db } = await connectToDatabase()

    switch (req.method) {
      case 'GET':
        const { project_id, contract_id: queryContractId, process_instance_id, step_id } = req.query
        
        // Build query based on filters
        const query = {
          active: { $ne: false }
        }
        if (project_id) {
          query.project_id = project_id
        }
        if (queryContractId) {
          query.contract_id = queryContractId
        }
        if (process_instance_id) {
          query.process_instance_id = process_instance_id
        }
        if (step_id) {
          query.step_id = step_id
        }

        const tasks = await db.collection('agency_tasks')
          .find(query)
          .sort({ created_at: -1 })
          .toArray()

        return res.status(200).json(tasks || [])

      case 'POST':
        const {
          name,
          status,
          assigned_to,
          deadline,
          contract_id,
          project_id: taskProjectId,
          service_id,
          process_id: taskProcessId,
          step_id: taskStepId,
          description
        } = req.body

        if (!name || !assigned_to || !service_id || !taskProcessId || !taskStepId) {
          return res.status(400).json({ 
            message: 'Name, assigned employee, service, process, and step are required' 
          })
        }

        // Verify process exists and contains the step
        const process = await db.collection('agency_process_templates')
          .findOne({
            template_id: taskProcessId,
            active: true
          })

        if (!process) {
          return res.status(400).json({ message: 'Invalid process' })
        }

        // Verify step exists in the process
        const step = process.steps.find(s => s.step_id === taskStepId)
        if (!step) {
          return res.status(400).json({ message: 'Invalid step for the selected process' })
        }

        const newTask = {
          task_id: uuidv4(),
          name,
          status: status || 'pending',
          assigned_to,
          deadline: new Date(deadline),
          contract_id: contract_id || null,
          project_id: taskProjectId || null,
          service_id,
          process_id: taskProcessId,
          step_id: taskStepId,
          description,
          active: true,
          created_at: new Date(),
          updated_at: new Date()
        }

        await db.collection('agency_tasks').insertOne(newTask)
        return res.status(201).json(newTask)

      default:
        res.setHeader('Allow', ['GET', 'POST'])
        return res.status(405).json({ message: `Method ${req.method} Not Allowed` })
    }
  } catch (error) {
    console.error('Tasks API error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}