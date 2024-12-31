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

    // Try to find by either _id or process_id
    const instance = await db.collection('agency_process_instances')
      .findOne({
        $or: [{ _id: id }, { process_id: id }],
        active: { $ne: false }
      })

    if (!instance) {
      return res.status(404).json({ message: 'Process instance not found' })
    }

    // Ensure consistent ID format for phases
    const phases = (instance.phases || []).map(phase => ({
      ...phase,
      _id: phase._id || phase.phase_id,
      phase_id: phase._id || phase.phase_id
    }))

    return res.status(200).json(phases)
  } catch (error) {
    console.error('Process Instance Phases API error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}
