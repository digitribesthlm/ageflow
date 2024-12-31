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
      return res.status(400).json({ message: 'Project ID is required' })
    }

    switch (req.method) {
      case 'GET':
        const project = await db.collection('agency_projects')
          .findOne({ project_id: id })

        if (!project) {
          return res.status(404).json({ message: 'Project not found' })
        }

        return res.status(200).json(project)

      case 'PUT':
        const { 
          name,
          client_id,
          service_id,
          project_type,
          status,
          start_date,
          end_date,
          total_budget,
          phases
        } = req.body

        const updateData = {
          name,
          client_id,
          service_id,
          project_type,
          status,
          start_date: new Date(start_date),
          end_date: new Date(end_date),
          total_budget: parseFloat(total_budget),
          phases: phases.map(phase => ({
            ...phase,
            start_date: new Date(phase.start_date),
            end_date: new Date(phase.end_date)
          })),
          updated_at: new Date()
        }

        const result = await db.collection('agency_projects').updateOne(
          { project_id: id },
          { $set: updateData }
        )

        if (result.matchedCount === 0) {
          return res.status(404).json({ message: 'Project not found' })
        }

        return res.status(200).json({ message: 'Project updated successfully' })

      case 'DELETE':
        // Soft delete by setting active to false
        const deleteResult = await db.collection('agency_projects').updateOne(
          { project_id: id },
          { 
            $set: {
              active: false,
              updated_at: new Date()
            }
          }
        )

        if (deleteResult.matchedCount === 0) {
          return res.status(404).json({ message: 'Project not found' })
        }

        return res.status(200).json({ message: 'Project deleted successfully' })

      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE'])
        return res.status(405).json({ message: `Method ${req.method} Not Allowed` })
    }
  } catch (error) {
    console.error('Project API error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
} 