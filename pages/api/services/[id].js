import { connectToDatabase } from '../../../utils/mongodb'

export default async function handler(req, res) {
  try {
    console.log('API Request:', {
      method: req.method,
      query: req.query,
      path: req.url
    })

    // Check auth token from cookie
    const authToken = req.cookies['auth-token']
    if (!authToken) {
      console.log('Auth token missing')
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const { db } = await connectToDatabase()
    const { id } = req.query

    console.log('Looking for service with ID:', id)

    if (!id) {
      console.log('No service ID provided')
      return res.status(400).json({ message: 'Service ID is required' })
    }

    switch (req.method) {
      case 'GET':
        console.log('Executing GET request for service:', id)
        const service = await db.collection('agency_services')
          .findOne({ service_id: id })

        console.log('Service found:', service)

        if (!service) {
          console.log('No service found with ID:', id)
          return res.status(404).json({ message: 'Service not found' })
        }

        return res.status(200).json(service)

      case 'PUT':
        console.log('Executing PUT request for service:', id)
        console.log('Update data received:', req.body)
        
        const {
          name,
          category,
          service_type,
          billing_type,
          description,
          deliverables
        } = req.body

        const updateData = {
          name,
          category,
          service_type,
          billing_type,
          description,
          deliverables: deliverables.map(d => ({
            name: d.name,
            description: d.description,
            estimatedHours: parseFloat(d.estimatedHours)
          })),
          updated_at: new Date()
        }

        console.log('Processed update data:', updateData)

        const result = await db.collection('agency_services').updateOne(
          { service_id: id },
          { $set: updateData }
        )

        console.log('Update result:', result)

        if (result.matchedCount === 0) {
          console.log('No service found to update with ID:', id)
          return res.status(404).json({ message: 'Service not found' })
        }

        return res.status(200).json({ message: 'Service updated successfully' })

      case 'DELETE':
        console.log('Executing DELETE request for service:', id)
        
        const deleteResult = await db.collection('agency_services')
          .updateOne(
            { service_id: id },
            { $set: { active: false, deleted_at: new Date() } }
          )

        if (deleteResult.matchedCount === 0) {
          console.log('No service found to delete with ID:', id)
          return res.status(404).json({ message: 'Service not found' })
        }

        console.log('Service soft deleted:', id)
        return res.status(200).json({ message: 'Service deleted successfully' })

      default:
        console.log('Invalid method:', req.method)
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE'])
        return res.status(405).json({ message: `Method ${req.method} Not Allowed` })
    }
  } catch (error) {
    console.error('Service API error:', error)
    console.error('Error stack:', error.stack)
    res.status(500).json({ message: 'Internal server error' })
  }
} 