import { connectToDatabase } from '../../../utils/mongodb'

export default async function handler(req, res) {
    try {
        const authToken = req.cookies['auth-token']
        if (!authToken) {
            return res.status(401).json({ message: 'Unauthorized' })
        }

        const { db } = await connectToDatabase()
        const { id } = req.query

        if (!id) {
            return res.status(400).json({ message: 'Package ID is required' })
        }

        switch (req.method) {
            case 'GET':
                const servicePackage = await db.collection('agency_service_packages')
                    .findOne({ package_id: id })

                if (!servicePackage) {
                    return res.status(404).json({ message: 'Service package not found' })
                }

                // Get service details
                const serviceIds = servicePackage.includedServices.map(s => s.service_id)
                const serviceDetails = await db.collection('agency_services')
                    .find({ service_id: { $in: serviceIds }, active: true })
                    .toArray()

                // Populate service details
                const packageWithServices = {
                    ...servicePackage,
                    includedServices: servicePackage.includedServices.map(serviceRef => {
                        const details = serviceDetails.find(s => s.service_id === serviceRef.service_id)
                        return {
                            ...serviceRef,
                            name: details?.name || 'Unknown Service',
                            category: details?.category,
                            description: details?.description,
                            deliverables: details?.deliverables
                        }
                    })
                }

                return res.status(200).json(packageWithServices)

            case 'PUT':
                const {
                    name,
                    description,
                    includedServices,
                    basePrice,
                    billing_frequency,
                    package_type,
                    tier,
                    minimum_contract_months
                } = req.body

                const updateData = {
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
                    updated_at: new Date()
                }

                const result = await db.collection('agency_service_packages').updateOne(
                    { package_id: id },
                    { $set: updateData }
                )

                if (result.matchedCount === 0) {
                    return res.status(404).json({ message: 'Service package not found' })
                }

                return res.status(200).json({ message: 'Service package updated successfully' })

            case 'DELETE':
                const deleteResult = await db.collection('agency_service_packages').updateOne(
                    { package_id: id },
                    { 
                        $set: {
                            active: false,
                            updated_at: new Date()
                        }
                    }
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
        console.error('Service Packages API error:', error)
        res.status(500).json({ message: 'Internal server error' })
    }
}
