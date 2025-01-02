import { connectToDatabase } from '../../../utils/mongodb'

export default async function handler(req, res) {
    try {
        const { db } = await connectToDatabase()

        switch (req.method) {
            case 'POST':
                const { action, contract_id } = req.body

                if (action === 'fetch') {
                    if (contract_id) {
                        // Fetch specific contract
                        const contract = await db.collection('agency_contracts')
                            .findOne({ contract_id, active: true })

                        if (!contract) {
                            return res.status(404).json({ message: 'Contract not found' })
                        }

                        console.log('Found contract:', contract)

                        // Fetch package details
                        const packageIds = contract.packages.map(pkg => pkg.package_id)
                        console.log('Looking up packages:', packageIds)
                        
                        const packageDetails = await db.collection('agency_service_packages')
                            .find({ 
                                package_id: { $in: packageIds },
                                $or: [
                                    { active: true },
                                    { active: { $exists: false } },
                                    { status: 'active' }
                                ]
                            })
                            .toArray()

                        console.log('Found packages:', packageDetails)

                        // Get all service IDs from packages
                        const serviceIds = packageDetails.flatMap(pkg => 
                            pkg.includedServices?.map(service => service.service_id) || []
                        )
                        console.log('Looking up services:', serviceIds)

                        // Fetch service details
                        const services = await db.collection('agency_services')
                            .find({ 
                                service_id: { $in: serviceIds },
                                $or: [
                                    { active: true },
                                    { active: { $exists: false } },
                                    { status: 'active' }
                                ]
                            })
                            .toArray()

                        console.log('Found services:', services)

                        // Enhance contract with full package and service details
                        contract.packages = contract.packages.map(contractPkg => {
                            const fullPackage = packageDetails.find(p => p.package_id === contractPkg.package_id)
                            console.log('Processing package:', contractPkg.package_id, 'Found details:', fullPackage)
                            
                            const enhancedPackage = {
                                ...contractPkg,
                                name: fullPackage?.name,
                                description: fullPackage?.description,
                                includedServices: fullPackage?.includedServices?.map(service => {
                                    const fullService = services.find(s => s.service_id === service.service_id)
                                    if (!fullService) {
                                        console.log('Service not found:', service.service_id)
                                        return null
                                    }
                                    console.log('Processing service:', service.service_id, 'Found details:', fullService)
                                    return {
                                        ...service,
                                        name: fullService.name,
                                        description: fullService.description,
                                        process_template_id: fullService.process_template_id,
                                        selected_steps: fullService.selected_steps || [],
                                        category: fullService.category,
                                        deliverables: fullService.deliverables || [],
                                        estimated_hours: fullService.estimated_hours,
                                        minimum_hours: fullService.minimum_hours,
                                        included_hours: fullService.included_hours,
                                        service_type: fullService.service_type,
                                        billing_type: fullService.billing_type,
                                        base_price: fullService.base_price
                                    }
                                }).filter(Boolean) || []
                            }
                            console.log('Enhanced package:', enhancedPackage)
                            return enhancedPackage
                        })

                        console.log('Returning enhanced contract:', JSON.stringify(contract, null, 2))
                        return res.status(200).json(contract)
                    } else {
                        // Fetch all contracts
                        const contracts = await db.collection('agency_contracts')
                            .find({ active: true })
                            .sort({ created_at: -1 })
                            .toArray()
                        
                        return res.status(200).json(contracts)
                    }
                }

                return res.status(400).json({ message: 'Invalid action' })

            default:
                res.setHeader('Allow', ['POST'])
                return res.status(405).json({ message: `Method ${req.method} Not Allowed` })
        }
    } catch (error) {
        console.error('Contracts API error:', error)
        return res.status(500).json({ message: 'Internal server error' })
    }
} 