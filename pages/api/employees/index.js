import { connectToDatabase } from '../../../utils/mongodb'

export default async function handler(req, res) {
    try {
        const { db } = await connectToDatabase()

        switch (req.method) {
            case 'GET':
                // Fetch active employees
                const employees = await db.collection('agency_employees')
                    .find({ active: true })
                    .project({
                        employee_id: 1,
                        name: 1,
                        role: 1,
                        skills: 1,
                        availability_hours: 1,
                        department: 1
                    })
                    .sort({ name: 1 })
                    .toArray()
                
                console.log('Fetched employees:', employees.length)
                return res.status(200).json(employees)

            default:
                res.setHeader('Allow', ['GET'])
                return res.status(405).json({ message: `Method ${req.method} Not Allowed` })
        }
    } catch (error) {
        console.error('Error in employees API:', error)
        return res.status(500).json({ message: 'Internal Server Error' })
    }
} 