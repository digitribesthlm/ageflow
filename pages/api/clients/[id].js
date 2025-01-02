import { connectToDatabase } from '../../../utils/mongodb'
import { ObjectId } from 'mongodb'
import { withAuth } from '../../../middleware/auth.js'

async function handler(req, res) {
  const { id } = req.query
  console.log('Looking up client with ID:', id)
  
  try {
    const { db } = await connectToDatabase()

    if (req.method === 'GET') {
      try {
        // Try to find by client_id first
        console.log('Attempting to find by client_id:', id)
        let client = await db.collection('agency_clients').findOne({ client_id: id })
        
        if (!client) {
          console.log('Client not found by client_id, trying ObjectId')
          try {
            client = await db.collection('agency_clients').findOne({ _id: new ObjectId(id) })
            console.log('ObjectId lookup result:', client ? 'found' : 'not found')
          } catch (error) {
            console.log('Not a valid ObjectId, skipping ObjectId lookup')
          }
        } else {
          console.log('Found client by client_id')
        }

        if (!client) {
          console.log('Client not found by any method')
          return res.status(404).json({ error: 'Client not found' })
        }

        res.status(200).json(client)
      } catch (error) {
        console.error('Error fetching client:', error)
        res.status(500).json({ error: 'Failed to fetch client' })
      }
    } 
    else if (req.method === 'PUT') {
      try {
        const updates = {
          ...req.body,
          updated_at: new Date()
        }
        delete updates._id // Remove _id if it exists in the request body

        // Try to update by client_id first
        let result = await db.collection('agency_clients').updateOne(
          { client_id: id },
          { $set: updates }
        )

        if (result.matchedCount === 0) {
          try {
            result = await db.collection('agency_clients').updateOne(
              { _id: new ObjectId(id) },
              { $set: updates }
            )
          } catch (error) {
            console.log('Not a valid ObjectId, skipping ObjectId update')
          }
        }

        if (result.matchedCount === 0) {
          return res.status(404).json({ error: 'Client not found' })
        }

        res.status(200).json({ message: 'Client updated successfully' })
      } catch (error) {
        console.error('Error updating client:', error)
        res.status(500).json({ error: 'Failed to update client' })
      }
    }
    else {
      res.setHeader('Allow', ['GET', 'PUT'])
      res.status(405).end(`Method ${req.method} Not Allowed`)
    }
  } catch (error) {
    console.error('Database connection error:', error)
    res.status(500).json({ error: 'Database connection failed' })
  }
}

export default withAuth(handler) 