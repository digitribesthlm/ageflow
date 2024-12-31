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
          packages,  // Now an array of {package_id, quantity}
          start_date,
          end_date,
          monthly_fee,
          billing_frequency,
          payment_terms,
          contract_type
        } = req.body

        // Validate packages
        if (!packages || packages.length === 0) {
          return res.status(400).json({ message: 'At least one package is required' })
        }

        // Get package details from database
        const packageIds = packages.map(p => p.package_id)
        const packageDetails = await db.collection('agency_service_packages')
          .find({ package_id: { $in: packageIds }, active: true })
          .toArray()

        // Create package entries with quantities and details
        const contractPackages = packages.map(pkg => {
          const details = packageDetails.find(p => p.package_id === pkg.package_id)
          return {
            package_id: pkg.package_id,
            name: details.name,
            quantity: pkg.quantity,
            price: details.price,
            services: details.services,
            billing_frequency: details.billing_frequency
          }
        })

        const newContract = {
          contract_id: `CNT${Date.now()}`,
          client_id,
          packages: contractPackages,
          contract_type,
          status: 'active',
          start_date: new Date(start_date),
          end_date: contract_type === 'one-time' ? new Date(end_date) : null,
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