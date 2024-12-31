import { connectToDatabase } from '../../../../utils/mongodb'

export default async function handler(req, res) {
  try {
    // Check auth token from cookie
    const authToken = req.cookies['auth-token']
    if (!authToken) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const { db } = await connectToDatabase()
    const { id } = req.query

    if (req.method !== 'GET') {
      res.setHeader('Allow', ['GET'])
      return res.status(405).json({ message: `Method ${req.method} Not Allowed` })
    }

    // Try to find by process_instance_id
    const instance = await db.collection('agency_process_instances')
      .findOne({
        process_instance_id: id,
        active: { $ne: false }
      })

    if (!instance) {
      return res.status(404).json({ message: 'Process instance not found' })
    }

    // Get the template to access steps
    const template = await db.collection('agency_process_templates')
      .findOne({
        template_id: instance.template_id,
        active: true
      })

    if (!template) {
      return res.status(404).json({ message: 'Process template not found' })
    }

    return res.status(200).json(template.steps || [])
  } catch (error) {
    console.error('Process Instance Steps API error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}
