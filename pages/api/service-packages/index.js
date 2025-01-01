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
        // Get packages with service details
        const packages = await db.collection('agency_service_packages')
          .find({ active: { $ne: false } })
          .sort({ name: 1 })
          .toArray()

        // Get all available services to populate service details
        const availableServices = await db.collection('agency_services')
          .find({ active: { $ne: false } })
          .toArray()

        // Populate service details in each package
        const packagesWithServices = packages.map(pkg => ({
          ...pkg,
          includedServices: Array.isArray(pkg.includedServices) ? pkg.includedServices.map(serviceRef => {
            const serviceDetails = availableServices.find(s => s.service_id === serviceRef.service_id)
            return {
              ...serviceRef,
              name: serviceDetails?.name || 'Unknown Service',
              category: serviceDetails?.category,
              description: serviceDetails?.description,
              deliverables: serviceDetails?.deliverables
            }
          }) : []
        }))

        return res.status(200).json(packagesWithServices)

      case 'POST':
        const {
          name,
          description,
          includedServices,  // Array of { service_id, quantity }
          basePrice,
          billing_frequency,
          package_type,
          tier,
          minimum_contract_months
        } = req.body

        if (!name || !includedServices || !Array.isArray(includedServices) || includedServices.length === 0 || !basePrice || !billing_frequency) {
          return res.status(400).json({ 
            message: 'Name, included services, base price, and billing frequency are required' 
          })
        }

        // Verify all services exist
        const serviceIds = includedServices.map(s => s.service_id)
        const existingServices = await db.collection('agency_services')
          .find({ service_id: { $in: serviceIds }, active: true })
          .toArray()

        if (existingServices.length !== serviceIds.length) {
          return res.status(400).json({ message: 'One or more services do not exist' })
        }

        const newPackage = {
          package_id: `PKG${Date.now()}`,
          name,
          description,
          tier: tier || 'small',
          package_type: package_type || 'retainer',
          includedServices: includedServices.map(service => ({
            service_id: service.service_id,
            quantity: parseInt(service.quantity) || 1
          })),
          basePrice: parseInt(basePrice),
          billing_frequency,
          minimum_contract_months: parseInt(minimum_contract_months) || 6,
          active: true,
          created_at: new Date(),
          updated_at: new Date()
        }

        await db.collection('agency_service_packages').insertOne(newPackage)
        return res.status(201).json(newPackage)

      default:
        res.setHeader('Allow', ['GET', 'POST'])
        return res.status(405).json({ message: `Method ${req.method} Not Allowed` })
    }
  } catch (error) {
    console.error('Service Packages API error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}