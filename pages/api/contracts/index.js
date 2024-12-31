import { connectToDatabase } from '../../../utils/mongodb'

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
        const contracts = await db.collection('agency_contracts')
          .find({ active: { $ne: false } })
          .sort({ created_at: -1 })
          .toArray()
        return res.status(200).json(contracts)

      case 'POST':
        const {
          client_id,
          package_id,
          start_date,
          end_date,
          monthly_fee,
          billing_frequency,
          payment_terms
        } = req.body

        const newContract = {
          contract_id: `CNT${Date.now()}`,
          client_id,
          package_id,
          status: 'active',
          start_date: new Date(start_date),
          end_date: new Date(end_date),
          monthly_fee: parseFloat(monthly_fee),
          billing: {
            frequency: billing_frequency,
            next_billing_date: new Date(start_date),
            payment_terms: payment_terms
          },
          active: true,
          created_at: new Date()
        }

        await db.collection('agency_contracts').insertOne(newContract)
        return res.status(201).json(newContract)

      default:
        res.setHeader('Allow', ['GET', 'POST'])
        return res.status(405).json({ message: `Method ${req.method} Not Allowed` })
    }
  } catch (error) {
    console.error('Contracts API error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
} 