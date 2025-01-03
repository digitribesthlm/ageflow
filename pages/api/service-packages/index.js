import { connectToDatabase } from '../../../utils/mongodb'

export default async function handler(req, res) {
    try {
        const { db } = await connectToDatabase()

        switch (req.method) {
            case 'GET':
                // Handle GET request for fetching packages
                const packages = await db.collection('agency_service_packages')
                    .find({ active: true })
                    .sort({ created_at: -1 })
                    .toArray()

                // Get all available services to populate service details
                const availableServices = await db.collection('agency_services')
                    .find({ active: true })
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
                    const packages = await db.collection('agency_service_packages')
                        .find({ active: true })
                        .sort({ created_at: -1 })
                        .toArray()

                    // Get all available services to populate service details
                    const availableServices = await db.collection('agency_services')
                        .find({ active: true })
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

                if (action === 'create') {
                    const { name, description, includedServices, basePrice, billing_frequency } = req.body
                    
                    if (!name || !includedServices || !basePrice || !billing_frequency) {
                        return res.status(400).json({ 
                            message: 'Name, included services, base price, and billing frequency are required' 
                        })
                    }

                    // Verify all services exist and are active
                    const serviceIds = includedServices.map(s => s.service_id)
                    const existingServices = await db.collection('agency_services')
                        .find({ 
                            service_id: { $in: serviceIds }, 
                            active: true
                        })
                        .toArray()

                    if (existingServices.length !== serviceIds.length) {
                        const foundIds = existingServices.map(s => s.service_id)
                        const missingIds = serviceIds.filter(id => !foundIds.includes(id))
                        return res.status(400).json({ 
                            message: 'One or more services do not exist or are inactive',
                            missingServices: missingIds
                        })
                    }

                    const servicePackage = {
                        package_id: `PKG${Date.now()}`,
                        name,
                        description,
                        includedServices: includedServices.map(service => ({
                            service_id: service.service_id,
                            quantity: parseInt(service.quantity) || 1
                        })),
                        basePrice: parseFloat(basePrice),
                        billing_frequency,
                        active: true,
                        created_at: new Date(),
                        updated_at: new Date()
                    }

                    await db.collection('agency_service_packages').insertOne(servicePackage)
                    return res.status(201).json(servicePackage)
                }

                return res.status(400).json({ message: 'Invalid action' })

            default:
                res.setHeader('Allow', ['GET', 'POST'])
                return res.status(405).json({ message: `Method ${req.method} Not Allowed` })
        }
    } catch (error) {
        console.error('Service Packages API error:', error)
        return res.status(500).json({ message: 'Internal server error' })
    }
}
