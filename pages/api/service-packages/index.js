import { connectToDatabase } from '../../../utils/mongodb'

export default async function handler(req, res) {
    try {
        const { db } = await connectToDatabase()

        switch (req.method) {
            case 'POST':
                const { action } = req.body

                if (action === 'fetch') {
                    const packages = await db.collection('agency_service_packages')
                        .find({ active: true })
                        .sort({ created_at: -1 })
                        .toArray()

                    return res.status(200).json(packages)
                }

                if (action === 'create') {
                    const { name, description, includedServices, price } = req.body
                    
                    if (!name || !includedServices || !price) {
                        return res.status(400).json({ message: 'Name, included services, and price are required' })
                    }

                    const servicePackage = {
                        package_id: `PKG${Date.now()}`,
                        name,
                        description,
                        includedServices,
                        price: parseFloat(price),
                        active: true,
                        created_at: new Date(),
                        updated_at: new Date()
                    }

                    await db.collection('agency_service_packages').insertOne(servicePackage)
                    return res.status(201).json(servicePackage)
                }

                return res.status(400).json({ message: 'Invalid action' })

            default:
                res.setHeader('Allow', ['POST'])
                return res.status(405).json({ message: `Method ${req.method} Not Allowed` })
        }
    } catch (error) {
        console.error('Service Packages API error:', error)
        return res.status(500).json({ message: 'Internal server error' })
    }
}
