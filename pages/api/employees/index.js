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
        const employees = await db.collection('agency_employees')
          .find({ active: { $ne: false } })
          .sort({ name: 1 })
          .toArray()
        return res.status(200).json(employees)

      case 'POST':
        const { 
          name,
          email,
          role,
          skills,
          hourly_rate,
          availability_hours,
          start_date,
          department,
          contact_info
        } = req.body

        if (!name || !email || !role) {
          return res.status(400).json({ message: 'Name, email and role are required' })
        }

        const newEmployee = {
          employee_id: `EMP${Date.now()}`,
          name,
          email,
          role,
          skills: skills || [],
          hourly_rate: parseFloat(hourly_rate) || 0,
          availability_hours: parseInt(availability_hours) || 40,
          start_date: start_date ? new Date(start_date) : new Date(),
          department: department || 'general',
          contact_info: contact_info || {},
          active: true,
          current_projects: [],
          created_at: new Date(),
          updated_at: new Date()
        }

        await db.collection('agency_employees').insertOne(newEmployee)
        return res.status(201).json(newEmployee)

      default:
        res.setHeader('Allow', ['GET', 'POST'])
        return res.status(405).json({ message: `Method ${req.method} Not Allowed` })
    }
  } catch (error) {
    console.error('Employees API error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
} 