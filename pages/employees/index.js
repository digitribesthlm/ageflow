import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import PageHeader from '../../components/PageHeader'
import ContentContainer from '../../components/ContentContainer'

export default function Employees() {
  const router = useRouter()
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const user = localStorage.getItem('user')
    if (!user) {
      router.push('/')
      return
    }
    fetchEmployees()
  }, [])

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/employees')
      if (response.ok) {
        const data = await response.json()
        setEmployees(data || [])
      } else {
        const errorData = await response.json()
        setError(errorData.message || 'Failed to fetch employees')
      }
    } catch (error) {
      setError('Error fetching employees: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center min-h-[200px]">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      )
    }

    if (error) {
      return (
        <div className="alert alert-error">
          <span>{error}</span>
        </div>
      )
    }

    if (employees.length === 0) {
      return (
        <div className="text-center p-8">
          <h3 className="text-xl font-semibold mb-4">No Employees Yet</h3>
          <p className="mb-6">Start by adding your first employee</p>
          <button
            onClick={() => router.push('/employees/new')}
            className="btn btn-primary"
          >
            Add Employee
          </button>
        </div>
      )
    }

    return (
      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Role</th>
              <th>Department</th>
              <th>Skills</th>
              <th>Availability</th>
              <th>Current Projects</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((employee) => (
              <tr key={employee.employee_id} className="hover">
                <td>
                  <div>
                    <div className="font-bold">{employee.name}</div>
                    <div className="text-sm opacity-50">{employee.email}</div>
                  </div>
                </td>
                <td>
                  <div className="badge badge-outline">{employee.role}</div>
                </td>
                <td>{employee.department}</td>
                <td>
                  <div className="flex flex-wrap gap-1">
                    {employee.skills?.map((skill, index) => (
                      <div key={index} className="badge badge-sm">{skill}</div>
                    ))}
                  </div>
                </td>
                <td>
                  <div className="flex items-center gap-2">
                    <div className="radial-progress text-primary" style={{ "--value": (employee.current_projects?.length || 0) / (employee.availability_hours / 40) * 100 }}>
                      {employee.availability_hours}h
                    </div>
                  </div>
                </td>
                <td>
                  {employee.current_projects?.length || 0} projects
                </td>
                <td>
                  <div className="flex gap-2">
                    <button
                      onClick={() => router.push(`/employees/${employee.employee_id}`)}
                      className="btn btn-sm btn-ghost"
                    >
                      View
                    </button>
                    <button
                      onClick={() => router.push(`/employees/${employee.employee_id}/edit`)}
                      className="btn btn-sm btn-ghost"
                    >
                      Edit
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <DashboardLayout>
      <PageHeader 
        title="Employees"
        actions={
          <button
            onClick={() => router.push('/employees/new')}
            className="btn btn-primary"
          >
            Add Employee
          </button>
        }
      />
      <ContentContainer>
        {renderContent()}
      </ContentContainer>
    </DashboardLayout>
  )
} 