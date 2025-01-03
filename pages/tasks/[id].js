import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import DashboardLayout from '../../components/DashboardLayout'
import PageHeader from '../../components/PageHeader'
import ContentContainer from '../../components/ContentContainer'

export default function TaskDetails() {
  const router = useRouter()
  const { id } = router.query
  const [task, setTask] = useState(null)
  const [client, setClient] = useState(null)
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editingDescription, setEditingDescription] = useState(false)
  const [description, setDescription] = useState('')
  const [editingDueDate, setEditingDueDate] = useState(false)
  const [dueDate, setDueDate] = useState('')

  useEffect(() => {
    if (id) {
      fetchTaskDetails()
    }
  }, [id])

  useEffect(() => {
    if (task?.due_date) {
      // Format the date to YYYY-MM-DD for the input
      const formattedDate = new Date(task.due_date).toISOString().split('T')[0]
      setDueDate(formattedDate)
    }
  }, [task])

  const fetchTaskDetails = async () => {
    try {
      const taskRes = await fetch(`/api/tasks/${id}`)
      if (!taskRes.ok) throw new Error('Failed to fetch task')
      const taskData = await taskRes.json()
      setTask(taskData)
      setDescription(taskData.description || '')

      // Fetch client details if project_id exists
      if (taskData.project_id) {
        const projectRes = await fetch(`/api/projects/${taskData.project_id}`)
        if (!projectRes.ok) throw new Error('Failed to fetch project')
        const projectData = await projectRes.json()
        setProject(projectData)

        if (projectData.client_id) {
          const clientRes = await fetch(`/api/clients/${projectData.client_id}`)
          if (clientRes.ok) {
            const clientData = await clientRes.json()
            setClient(clientData)
          }
        }
      }
    } catch (error) {
      console.error('Error fetching task details:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = (e) => {
    updateTaskStatus(e.target.value)
  }

  const updateTaskStatus = async (newStatus) => {
    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        await fetchTaskDetails()
      } else {
        throw new Error('Failed to update task status')
      }
    } catch (error) {
      setError(error.message)
    }
  }

  const updateTaskDescription = async () => {
    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ description }),
      })

      if (response.ok) {
        setEditingDescription(false)
        await fetchTaskDetails()
      } else {
        throw new Error('Failed to update task description')
      }
    } catch (error) {
      setError(error.message)
    }
  }

  const updateTaskDueDate = async () => {
    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ due_date: dueDate }),
      })

      if (response.ok) {
        setEditingDueDate(false)
        await fetchTaskDetails()
      } else {
        throw new Error('Failed to update task due date')
      }
    } catch (error) {
      setError(error.message)
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
      case 'blocked':
        return 'badge-error'
      default:
        return 'badge-ghost'
    }
  }

  const renderContent = () => {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Task Information */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="card-title text-2xl">{task.name || task.title}</h2>
                  <div className="mt-2 space-x-2">
                    <div className={`badge ${getStatusColor(task.status)}`}>
                      {task.status}
                    </div>
                    <div className={`badge ${
                      task.priority === 'high' ? 'badge-error' :
                      task.priority === 'medium' ? 'badge-warning' :
                      'badge-info'
                    }`}>
                      {task.priority} priority
                    </div>
                  </div>
                </div>
                <select
                  value={task.status}
                  onChange={handleStatusChange}
                  className="select select-bordered"
                >
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="blocked">Blocked</option>
                </select>
              </div>

              <div className="divider"></div>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium">Description</h3>
                    <button 
                      className="btn btn-ghost btn-sm"
                      onClick={() => setEditingDescription(!editingDescription)}
                    >
                      {editingDescription ? 'Cancel' : 'Edit'}
                    </button>
                  </div>
                  {editingDescription ? (
                    <div className="space-y-2">
                      <textarea
                        className="textarea textarea-bordered w-full h-32"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Enter task description..."
                      />
                      <div className="flex justify-end">
                        <button 
                          className="btn btn-primary btn-sm"
                          onClick={updateTaskDescription}
                        >
                          Save Description
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-base-content/70">{task.description || 'No description provided'}</p>
                  )}
                </div>

                {task.instruction_doc && (
                  <div>
                    <h3 className="font-medium mb-2">Instructions Document</h3>
                    <a 
                      href={task.instruction_doc.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="link link-primary flex items-center gap-2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      {task.instruction_doc.title}
                    </a>
                  </div>
                )}

                {task.required_tools && task.required_tools.length > 0 && (
                  <div>
                    <h3 className="font-medium mb-2">Required Tools</h3>
                    <div className="flex flex-wrap gap-2">
                      {task.required_tools.map((tool, index) => (
                        <div key={index} className="badge badge-outline">{tool}</div>
                      ))}
                    </div>
                  </div>
                )}

                {task.deliverables && task.deliverables.length > 0 && (
                  <div>
                    <h3 className="font-medium mb-2">Deliverables</h3>
                    <ul className="list-disc list-inside space-y-1 text-base-content/70">
                      {task.deliverables.map((deliverable, index) => (
                        <li key={index}>{deliverable}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {task.template_info && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium mb-2">Process Information</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium">Process Name</p>
                          <p className="text-base-content/70">{task.template_info.process_name}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Category</p>
                          <p className="text-base-content/70">{task.template_info.process_category}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Version</p>
                          <p className="text-base-content/70">{task.template_info.process_version}</p>
                        </div>
                      </div>
                    </div>

                    {task.template_info.required_tools?.length > 0 && (
                      <div>
                        <h3 className="font-medium mb-2">Required Tools</h3>
                        <div className="flex flex-wrap gap-2">
                          {task.template_info.required_tools.map((tool, index) => (
                            <div key={index} className="badge badge-outline">{tool}</div>
                          ))}
                        </div>
                      </div>
                    )}

                    {task.template_info.deliverables?.length > 0 && (
                      <div>
                        <h3 className="font-medium mb-2">Deliverables</h3>
                        <ul className="list-disc list-inside space-y-1 text-base-content/70">
                          {task.template_info.deliverables.map((deliverable, index) => (
                            <li key={index}>{deliverable}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {task.template_info.instruction_doc && (
                      <div>
                        <h3 className="font-medium mb-2">Instructions Document</h3>
                        <a 
                          href={task.template_info.instruction_doc.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="link link-primary flex items-center gap-2"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          {task.template_info.instruction_doc.title}
                        </a>
                      </div>
                    )}

                    {task.template_info.sub_tasks?.length > 0 && (
                      <div>
                        <h3 className="font-medium mb-2">Sub-Tasks</h3>
                        <ul className="list-disc list-inside space-y-1 text-base-content/70">
                          {task.template_info.sub_tasks.map((subTask, index) => (
                            <li key={index}>{subTask.name}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Project and Client Context */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h3 className="card-title">Project & Client Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {project && (
                  <div>
                    <h4 className="font-medium mb-2">Project</h4>
                    <p>{project.name}</p>
                    <button
                      onClick={() => router.push(`/projects/${project.project_id}`)}
                      className="btn btn-outline btn-sm mt-2"
                    >
                      View Project Details
                    </button>
                  </div>
                )}
                {client && (
                  <div>
                    <h4 className="font-medium mb-2">Client</h4>
                    <p>{client.name}</p>
                    <p className="text-sm text-base-content/70">{client.company}</p>
                    <p className="text-sm text-base-content/70">Domain: {client.domain || 'Not set'}</p>
                    <p className="text-sm text-base-content/70">Email: {client.contactInfo?.email}</p>
                    <p className="text-sm text-base-content/70">Phone: {client.contactInfo?.phone}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Task Details Sidebar */}
        <div className="space-y-6">
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h3 className="card-title">Task Details</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-1">Task ID</h4>
                  <p className="text-base-content/70">{task.task_id}</p>
                </div>

                <div>
                  <h4 className="font-medium mb-1">Process Instance</h4>
                  <p className="text-base-content/70">{task.process_instance_id}</p>
                </div>

                <div>
                  <h4 className="font-medium mb-1">Step ID</h4>
                  <p className="text-base-content/70">{task.step_id}</p>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <h4 className="font-medium">Due Date</h4>
                    <button 
                      className="btn btn-ghost btn-xs"
                      onClick={() => setEditingDueDate(!editingDueDate)}
                    >
                      {editingDueDate ? 'Cancel' : 'Edit'}
                    </button>
                  </div>
                  {editingDueDate ? (
                    <div className="space-y-2">
                      <input
                        type="date"
                        className="input input-bordered w-full"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                      />
                      <div className="flex justify-end">
                        <button 
                          className="btn btn-primary btn-sm"
                          onClick={updateTaskDueDate}
                        >
                          Save Due Date
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-base-content/70">
                      {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'Not set'}
                    </p>
                  )}
                </div>

                <div>
                  <h4 className="font-medium mb-1">Estimated Hours</h4>
                  <p className="text-base-content/70">{task.estimated_hours || 'Not set'}</p>
                </div>

                <div>
                  <h4 className="font-medium mb-1">Created</h4>
                  <p className="text-base-content/70">
                    {new Date(task.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h3 className="card-title">Quick Actions</h3>
              <div className="space-y-2">
                <button 
                  className="btn btn-primary w-full"
                  onClick={() => updateTaskStatus('in-progress')}
                >
                  Start Working
                </button>
                <button 
                  className="btn btn-success w-full"
                  onClick={() => updateTaskStatus('completed')}
                >
                  Mark as Complete
                </button>
                {task.instruction_doc && (
                  <a 
                    href={task.instruction_doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline w-full"
                  >
                    Open Instructions
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center min-h-screen">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      </DashboardLayout>
    )
  }

  if (error || !task) {
    return (
      <DashboardLayout>
        <div className="p-4">
          <div className="alert alert-error">
            {error || 'Task not found'}
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <PageHeader
        title={task?.title || 'Task Details'}
        breadcrumbs={[
          { label: 'Tasks', href: '/tasks' },
          { label: task?.title || 'Task Details', href: `/tasks/${id}` }
        ]}
      />
      <ContentContainer>
        {renderContent()}
      </ContentContainer>
    </DashboardLayout>
  )
} 