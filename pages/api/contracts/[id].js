import { connectToDatabase } from '../../../utils/mongodb'

export default async function handler(req, res) {
    try {
        // Check auth token from cookie
        const authToken = req.cookies['auth-token']
        if (!authToken) {
            console.log('Auth token missing')
            return res.status(401).json({ message: 'Unauthorized' })
        }

        const { db } = await connectToDatabase()
        const { id } = req.query

        console.log('Contract API Request:', {
            method: req.method,
            id: id,
            path: req.url
        })

        if (!id) {
            console.log('No contract ID provided')
            return res.status(400).json({ message: 'Contract ID is required' })
        }

        switch (req.method) {
            case 'GET':
                console.log('Fetching contract:', id)
                const contract = await db.collection('agency_contracts')
                    .findOne({ contract_id: id })

                console.log('Found contract:', contract)

                if (!contract) {
                    console.log('Contract not found:', id)
                    return res.status(404).json({ message: 'Contract not found' })
                }

                // Get package details first
                const packageIds = contract.packages?.map(pkg => pkg.package_id) || []
                console.log('Looking up packages:', packageIds)

                const packageDetails = await db.collection('agency_service_packages')
                    .find({ package_id: { $in: packageIds } })
                    .toArray()

                console.log('Found packages:', packageDetails)

                // Get all service IDs from the packages
                const serviceIds = packageDetails
                    .flatMap(pkg => pkg.includedServices?.map(s => s.service_id) || [])

                console.log('Looking up services:', serviceIds)

                const services = await db.collection('agency_services')
                    .find({ service_id: { $in: serviceIds } })
                    .toArray()

                console.log('Found services:', services)

                // Enhance the contract packages with full package and service details
                contract.packages = (contract.packages || []).map(contractPkg => {
                    const fullPackage = packageDetails.find(p => p.package_id === contractPkg.package_id)
                    return {
                        ...contractPkg,
                        name: fullPackage?.name,
                        description: fullPackage?.description,
                        includedServices: fullPackage?.includedServices?.map(service => {
                            const fullService = services.find(s => s.service_id === service.service_id)
                            return {
                                ...service,
                                name: fullService?.name,
                                description: fullService?.description,
                                process_template_id: fullService?.process_template_id,
                                selected_steps: fullService?.selected_steps
                            }
                        }) || []
                    }
                })

                console.log('Returning enhanced contract:', contract)
                return res.status(200).json(contract)

            default:
                res.setHeader('Allow', ['GET'])
                return res.status(405).json({ message: `Method ${req.method} Not Allowed` })
        }
    } catch (error) {
        console.error('Contract API error:', error)
        console.error('Error stack:', error.stack)
        return res.status(500).json({ message: 'Internal server error' })
    }
} 