import { connectToDatabase } from '../../../utils/mongodb'

export default async function handler(req, res) {
  try {
    console.log('Contracts API Request:', {
      method: req.method,
      query: req.query,
      path: req.url
    })

    // Check auth token from cookie
    const authToken = req.cookies['auth-token']
    if (!authToken) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const { db } = await connectToDatabase()

    switch (req.method) {
      case 'GET':
        // First get all contracts
        const contracts = await db.collection('agency_contracts')
          .find({ active: { $ne: false } })
          .sort({ created_at: -1 })
          .toArray()

        // For contracts with packages, fetch the package details
        const contractsWithDetails = await Promise.all(contracts.map(async contract => {
          if (contract.packages) {
            // Get package IDs from the contract's packages
            const packageIds = contract.packages.map(p => p.package_id)
            
            // Fetch package details from service_packages collection
            const packageDetails = await db.collection('agency_service_packages')
              .find({ package_id: { $in: packageIds } })
              .toArray()

            // Replace each package with its full details
            contract.packages = contract.packages.map(pkg => {
              const details = packageDetails.find(p => p.package_id === pkg.package_id)
              return {
                ...pkg,
                ...details,
                quantity: pkg.quantity
              }
            })
          }
          // For old format contracts, fetch the single package
          else if (contract.package_id) {
            const packageDetail = await db.collection('agency_service_packages')
              .findOne({ package_id: contract.package_id })
            if (packageDetail) {
              contract.packages = [{
                package_id: contract.package_id,
                ...packageDetail,
                quantity: 1
              }]
            }
          }
          return contract
        }))

        console.log('Found contracts with details:', JSON.stringify(contractsWithDetails, null, 2))
        return res.status(200).json(contractsWithDetails)

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