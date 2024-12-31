import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import PageHeader from '../../components/PageHeader'
import ContentContainer from '../../components/ContentContainer'

export default function EmployeeDetails() {
  const router = useRouter()
  const { id } = router.query
  const [employee, setEmployee] = useState(null)
  const [projects, setProjects] = useState([])
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const user = localStorage.getItem('user')
    if (!user) {
      router.push('/')
      return
    }
    if (id) {
      fetchEmployeeData()
    }
  }, [id])

  const fetchEmployeeData = async () => {
    try {
      // Fetch employee details
      const employeeRes = await fetch(`/api/employees/${id}`)
      if (!employeeRes.ok) {
        throw new Error('Failed to fetch employee')
      }
      const employeeData = await employeeRes.json()
      setEmployee(employeeData)

      // Fetch employee's projects
      if (employeeData.current_projects?.length > 0) {
        const projectPromises = employeeData.current_projects.map(projectId =>
          fetch(`/api/projects/${projectId}`).then(res => res.json())
        )
        const projectsData = await Promise.all(projectPromises)
        setProjects(projectsData)
      }

      // Fetch employee's tasks
      const tasksRes = await fetch(`/api/tasks?assigned_to=${id}`)
      if (tasksRes.ok) {
        const tasksData = await tasksRes.json()
        setTasks(tasksData)
      }
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'badge-success'
      case 'in-progress':
        return 'badge-warning'
      case 'pending':
        return 'badge-info'
      default:
        return 'badge-ghost'
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

    if (!employee) {
      return (
        <div className="alert alert-error">
          <span>Employee not found</span>
        </div>
      )
    }

    return (
      <div className="space-y-6">
        {/* Employee Overview Card */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="card-title text-2xl">{employee.name}</h2>
                <div className="badge badge-outline mt-2">{employee.role}</div>
                <div className="badge badge-outline ml-2">{employee.department}</div>
              </div>
              <div className="stats shadow">
                <div className="stat">
                  <div className="stat-title">Availability</div>
                  <div className="stat-value text-primary">{employee.availability_hours}h</div>
                  <div className="stat-desc">per week</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div>
                <h3 className="font-medium mb-2">Contact Information</h3>
                <div className="bg-base-200 p-4 rounded-lg">
                  <p><span className="font-medium">Email:</span> {employee.email}</p>
                  <p><span className="font-medium">Phone:</span> {employee.contact_info?.phone || 'N/A'}</p>
                  <p><span className="font-medium">Address:</span> {employee.contact_info?.address || 'N/A'}</p>
                  <p><span className="font-medium">Emergency Contact:</span> {employee.contact_info?.emergency_contact || 'N/A'}</p>
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-2">Skills & Expertise</h3>
                <div className="bg-base-200 p-4 rounded-lg">
                  <div className="flex flex-wrap gap-2">
                    {employee.skills?.map((skill, index) => (
                      <div key={index} className="badge badge-primary">{skill}</div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="divider"></div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="stat bg-base-200 rounded-box">
                <div className="stat-title">Hourly Rate</div>
                <div className="stat-value text-primary">${employee.hourly_rate}</div>
              </div>
              <div className="stat bg-base-200 rounded-box">
                <div className="stat-title">Start Date</div>
                <div className="stat-value text-lg">{new Date(employee.start_date).toLocaleDateString()}</div>
              </div>
              <div className="stat bg-base-200 rounded-box">
                <div className="stat-title">Active Projects</div>
                <div className="stat-value text-lg">{employee.current_projects?.length || 0}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Current Projects */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Current Projects</h2>
            
            {projects.length === 0 ? (
              <div className="text-center py-4 text-base-content/70">
                No active projects
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Project Name</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>Timeline</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projects.map((project) => (
                      <tr key={project.project_id} className="hover">
                        <td>{project.name}</td>
                        <td>
                          <div className="badge badge-outline">{project.project_type}</div>
                        </td>
                        <td>
                          <div className={`badge ${getStatusColor(project.status)}`}>
                            {project.status}
                          </div>
                        </td>
                        <td>
                          <div className="text-sm">
                            {new Date(project.start_date).toLocaleDateString()} - {new Date(project.end_date).toLocaleDateString()}
                          </div>
                        </td>
                        <td>
                          <button
                            onClick={() => router.push(`/projects/${project.project_id}`)}
                            className="btn btn-sm btn-ghost"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Assigned Tasks */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Assigned Tasks</h2>
            
            {tasks.length === 0 ? (
              <div className="text-center py-4 text-base-content/70">
                No assigned tasks
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Task</th>
                      <th>Project</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th>Due Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.map((task) => (
                      <tr key={task.task_id} className="hover">
                        <td>
                          <div>
                            <div className="font-medium">{task.title}</div>
                            <div className="text-sm opacity-60">{task.description}</div>
                          </div>
                        </td>
                        <td>{projects.find(p => p.project_id === task.project_id)?.name || task.project_id}</td>
                        <td>
                          <div className={`badge ${
                            task.priority === 'high' ? 'badge-error' :
                            task.priority === 'medium' ? 'badge-warning' :
                            'badge-info'
                          }`}>
                            {task.priority}
                          </div>
                        </td>
                        <td>
                          <div className={`badge ${getStatusColor(task.status)}`}>
                            {task.status}
                          </div>
                        </td>
                        <td>{new Date(task.due_date).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-2">
          <button
            onClick={() => router.push(`/employees/${id}/edit`)}
            className="btn btn-primary"
          >
            Edit Employee
          </button>
        </div>
      </div>
    )
  }

  return (
    <DashboardLayout>
      <PageHeader 
        title="Employee Details"
        actions={
          <button
            onClick={() => router.back()}
            className="btn btn-ghost"
          >
            Back
          </button>
        }
      />
      <ContentContainer>
        {renderContent()}
      </ContentContainer>
    </DashboardLayout>
  )
} 