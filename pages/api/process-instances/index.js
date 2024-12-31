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
        const { project_id } = req.query
        
        // Build query based on filters
        const query = {
          active: { $ne: false }
        }
        if (project_id) {
          query.project_id = project_id
        }

        const instances = await db.collection('agency_process_instances')
          .find(query)
          .sort({ created_at: -1 })
          .toArray()

        // Ensure each instance has a consistent ID format
        const formattedInstances = instances.map(instance => ({
          ...instance,
          _id: instance._id || instance.process_id,
          process_id: instance._id || instance.process_id,
          phases: (instance.phases || []).map(phase => ({
            ...phase,
            _id: phase._id || phase.phase_id,
            phase_id: phase._id || phase.phase_id
          }))
        }))

        return res.status(200).json(formattedInstances || [])

      case 'POST':
        const {
          name,
          project_id: instanceProjectId,
          template_id,
          start_date,
          end_date,
          status = 'active'
        } = req.body

        if (!name || !template_id || !instanceProjectId) {
          return res.status(400).json({ 
            message: 'Name, template ID, and project ID are required' 
          })
        }

        // Get the template to copy phases
        const template = await db.collection('agency_process_templates')
          .findOne({ _id: template_id, active: true })

        if (!template) {
          return res.status(400).json({ message: 'Invalid process template' })
        }

        // Create phases from template with consistent IDs
        const phases = template.phases.map(phase => {
          const phaseId = uuidv4()
          return {
            ...phase,
            _id: phaseId,
            phase_id: phaseId,
            status: 'pending',
            start_date: null,
            end_date: null,
            completed_tasks: 0,
            total_tasks: 0
          }
        })

        const processId = uuidv4()
        const newInstance = {
          _id: processId,
          process_id: processId,
          name,
          project_id: instanceProjectId,
          template_id,
          phases,
          status,
          start_date: start_date ? new Date(start_date) : new Date(),
          end_date: end_date ? new Date(end_date) : null,
          active: true,
          created_at: new Date(),
          updated_at: new Date()
        }

        await db.collection('agency_process_instances').insertOne(newInstance)
        return res.status(201).json(newInstance)

      default:
        res.setHeader('Allow', ['GET', 'POST'])
        return res.status(405).json({ message: `Method ${req.method} Not Allowed` })
    }
  } catch (error) {
    console.error('Process Instances API error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}
