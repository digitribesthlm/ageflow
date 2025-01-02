import { connectToDatabase } from '../../../utils/mongodb'

export default async function handler(req, res) {
  try {
    const { db } = await connectToDatabase()

    switch (req.method) {
      case 'POST':
        const { action } = req.body

        if (action === 'fetch') {
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
            .toArray()
          
          return res.status(200).json(employees)
        }

        return res.status(400).json({ message: 'Invalid action' })

      default:
        res.setHeader('Allow', ['POST'])
        return res.status(405).json({ message: `Method ${req.method} Not Allowed` })
    }
  } catch (error) {
    console.error('Employees API error:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
} 