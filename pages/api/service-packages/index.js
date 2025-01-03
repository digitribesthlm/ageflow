import { connectToDatabase } from '../../../utils/mongodb'

export default async function handler(req, res) {
  try {
    // Check auth token from cookie
    const authToken = req.cookies['auth-token']
    if (!authToken) {
      console.error('No auth token found in cookies')
      return res.status(401).json({ message: 'Unauthorized - No token' })
    }

    try {
      // Verify token format
      const userData = JSON.parse(Buffer.from(authToken, 'base64').toString())
      if (!userData.userId) {
        console.error('Invalid token format:', userData)
        return res.status(401).json({ message: 'Unauthorized - Invalid token' })
      }
    } catch (tokenError) {
      console.error('Token parsing error:', tokenError)
      return res.status(401).json({ message: 'Unauthorized - Invalid token format' })
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
        const { action } = req.body

        if (action === 'fetch') {
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
        }

        // Handle package creation
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

        // Verify all services exist and are active
        const serviceIds = includedServices.map(s => s.service_id)
        const existingServices = await db.collection('agency_services')
            .find({ 
                service_id: { $in: serviceIds }, 
                active: { $ne: false }  // Check that services are active
            })
            .toArray()

        console.log('Found services:', existingServices)
        console.log('Looking for service IDs:', serviceIds)

        if (existingServices.length !== serviceIds.length) {
            const foundIds = existingServices.map(s => s.service_id)
            const missingIds = serviceIds.filter(id => !foundIds.includes(id))
            console.log('Missing or inactive services:', missingIds)
            return res.status(400).json({ 
                message: 'One or more services do not exist or are inactive',
                missingServices: missingIds
            })
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
