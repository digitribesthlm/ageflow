import { connectToDatabase } from '../../../utils/mongodb'

export default async function handler(req, res) {
    try {
        const authToken = req.cookies['auth-token']
        if (!authToken) {
            return res.status(401).json({ message: 'Unauthorized' })
        }

        const { db } = await connectToDatabase()
        const { id } = req.query

        switch (req.method) {
            case 'GET':
                const servicePackage = await db.collection('agency_service_packages')
                    .findOne({ package_id: id, active: { $ne: false } })

                if (!servicePackage) {
                    return res.status(404).json({ message: 'Service package not found' })
                }

                // Get service details
                const serviceIds = servicePackage.services.map(s => s.service_id)
                const services = await db.collection('agency_services')
                    .find({ service_id: { $in: serviceIds }, active: true })
                    .toArray()

                // Populate service details
                const servicePackageWithServices = {
                    ...servicePackage,
                    services: servicePackage.services.map(serviceRef => {
                        const serviceDetails = services.find(s => s.service_id === serviceRef.service_id)
                        return {
                            ...serviceRef,
                            name: serviceDetails?.name || 'Unknown Service',
                            category: serviceDetails?.category,
                            description: serviceDetails?.description,
                            deliverables: serviceDetails?.deliverables
                        }
                    })
                }

                return res.status(200).json(servicePackageWithServices)

            case 'PUT':
                const {
                    name,
                    description,
                    services,
                    price,
                    billing_frequency,
                    tier
                } = req.body

                if (!name || !services || !Array.isArray(services) || services.length === 0 || !price || !billing_frequency) {
                    return res.status(400).json({
                        message: 'Name, services (as array), price, and billing frequency are required'
                    })
                }

                // Verify all services exist
                const updateServiceIds = services.map(s => s.service_id)
                const existingServices = await db.collection('agency_services')
                    .find({ service_id: { $in: updateServiceIds }, active: true })
                    .toArray()

                if (existingServices.length !== updateServiceIds.length) {
                    return res.status(400).json({ message: 'One or more services do not exist' })
                }

                const updatedServicePackage = {
                    name,
                    description,
                    tier: tier || 'standard',
                    services: services.map(service => ({
                        service_id: service.service_id,
                        quantity: parseInt(service.quantity) || 1,
                        customizations: service.customizations || {}
                    })),
                    price: parseFloat(price),
                    billing_frequency,
                    updated_at: new Date()
                }

                const result = await db.collection('agency_service_packages')
                    .updateOne(
                        { package_id: id },
                        { $set: updatedServicePackage }
                    )

                if (result.matchedCount === 0) {
                    return res.status(404).json({ message: 'Service package not found' })
                }

                return res.status(200).json({ ...updatedServicePackage, package_id: id })

            case 'DELETE':
                const deleteResult = await db.collection('agency_service_packages')
                    .updateOne(
                        { package_id: id },
                        { $set: { active: false, deleted_at: new Date() } }
                    )

                if (deleteResult.matchedCount === 0) {
                    return res.status(404).json({ message: 'Service package not found' })
                }

                return res.status(200).json({ message: 'Service package deleted successfully' })

            default:
                res.setHeader('Allow', ['GET', 'PUT', 'DELETE'])
                return res.status(405).json({ message: `Method ${req.method} Not Allowed` })
        }
    } catch (error) {
        console.error('Service Package API error:', error)
        res.status(500).json({ message: 'Internal server error' })
    }
}
