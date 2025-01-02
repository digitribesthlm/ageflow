import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import DashboardLayout from '../../../components/DashboardLayout'
import PageHeader from '../../../components/PageHeader'
import ContentContainer from '../../../components/ContentContainer'

export default function ProjectTasks() {
  const router = useRouter()
  const { id } = router.query
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [project, setProject] = useState(null)
  const [tasks, setTasks] = useState([])
  const [employees, setEmployees] = useState([])
  const [showNewTaskForm, setShowNewTaskForm] = useState(false)
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    assigned_to: '',
    status: 'pending',
    priority: 'medium',
    due_date: '',
    estimated_hours: ''
  })

  useEffect(() => {
    const user = localStorage.getItem('user')
    if (!user) {
      router.push('/')
      return
    }
    if (id) {
      fetchProjectData()
      fetchTasks()
      fetchEmployees()
    }
  }, [id])

  const fetchProjectData = async () => {
    try {
      const response = await fetch(`/api/projects/${id}`)
      if (response.ok) {
        const data = await response.json()
        setProject(data)
      } else {
        throw new Error('Failed to fetch project')
      }
    } catch (error) {
      setError(error.message)
    }
  }

  const fetchTasks = async () => {
    try {
      const response = await fetch(`/api/tasks?project_id=${id}`)
      if (response.ok) {
        const data = await response.json()
        setTasks(data || [])
      } else {
        throw new Error('Failed to fetch tasks')
      }
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/employees')
      if (response.ok) {
        const data = await response.json()
        setEmployees(data || [])
      }
    } catch (error) {
      console.error('Failed to fetch employees:', error)
    }
  }

  const handleCreateTask = async (e) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newTask,
          project_id: id,
          estimated_hours: parseFloat(newTask.estimated_hours)
        }),
      })

      if (response.ok) {
        setShowNewTaskForm(false)
        setNewTask({
          title: '',
          description: '',
          assigned_to: '',
          status: 'pending',
          priority: 'medium',
          due_date: '',
          estimated_hours: ''
        })
        await fetchTasks()
      } else {
        const error = await response.json()
        throw new Error(error.message || 'Failed to create task')
      }
    } catch (error) {
      setError(error.message)
    } finally {
      setSaving(false)
    }
  }

  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        await fetchTasks()
      } else {
        throw new Error('Failed to update task status')
      }
    } catch (error) {
      setError(error.message)
    }
  }

  const updateTaskDetails = async (taskId, updateData) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })

      if (response.ok) {
        await fetchTasks()
      } else {
        throw new Error('Failed to update task')
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
        return 'badge-ghost'
      case 'blocked':
        return 'badge-error'
      default:
        return 'badge-ghost'
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'text-error'
      case 'medium':
        return 'text-warning'
      case 'low':
        return 'text-info'
      default:
        return ''
    }
  }

  const renderTasks = () => {
    if (tasks.length === 0) {
      return (
        <div className="text-center py-8">
          <h3 className="font-medium text-base-content/70">No tasks found</h3>
          <button
            className="btn btn-primary mt-4"
            onClick={() => setShowNewTaskForm(true)}
          >
            Create First Task
          </button>
        </div>
      )
    }

    return (
      <div className="overflow-x-auto">
        <table className="table table-zebra w-full">
          <thead>
            <tr>
              <th>Title</th>
              <th>Assigned To</th>
              <th>Due Date</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <tr key={task.task_id}>
                <td>
                  <div>
                    <div className="font-medium">{task.title || task.name}</div>
                    <div className="text-sm text-base-content/70">{task.description}</div>
                  </div>
                </td>
                <td>
                  <div className="dropdown dropdown-hover">
                    <label tabIndex={0} className="btn btn-ghost btn-sm">
                      {employees.find(e => e.employee_id === task.assigned_to)?.name || 'Unassigned'}
                    </label>
                    <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52 max-h-60 overflow-y-auto">
                      {employees.map((employee) => (
                        <li key={employee.employee_id}>
                          <button 
                            onClick={() => updateTaskDetails(task.task_id, { assigned_to: employee.employee_id })}
                            className={task.assigned_to === employee.employee_id ? 'active' : ''}
                          >
                            {employee.name}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </td>
                <td>
                  <input
                    type="date"
                    className="input input-bordered input-sm w-40"
                    value={task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : ''}
                    onChange={(e) => updateTaskDetails(task.task_id, { due_date: e.target.value })}
                  />
                </td>
                <td>
                  <div className="dropdown dropdown-hover">
                    <label tabIndex={0} className={`btn btn-ghost btn-sm ${getPriorityColor(task.priority)}`}>
                      {task.priority || 'Set Priority'}
                    </label>
                    <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-32">
                      <li>
                        <button 
                          onClick={() => updateTaskDetails(task.task_id, { priority: 'low' })}
                          className={task.priority === 'low' ? 'active' : ''}
                        >
                          Low
                        </button>
                      </li>
                      <li>
                        <button 
                          onClick={() => updateTaskDetails(task.task_id, { priority: 'medium' })}
                          className={task.priority === 'medium' ? 'active' : ''}
                        >
                          Medium
                        </button>
                      </li>
                      <li>
                        <button 
                          onClick={() => updateTaskDetails(task.task_id, { priority: 'high' })}
                          className={task.priority === 'high' ? 'active' : ''}
                        >
                          High
                        </button>
                      </li>
                    </ul>
                  </div>
                </td>
                <td>
                  <div className={`badge ${getStatusColor(task.status)}`}>
                    {task.status}
                  </div>
                </td>
                <td>
                  <div className="dropdown dropdown-end">
                    <label tabIndex={0} className="btn btn-ghost btn-sm">
                      Update Status
                    </label>
                    <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
                      <li>
                        <button onClick={() => updateTaskStatus(task.task_id, 'pending')}>
                          Set Pending
                        </button>
                      </li>
                      <li>
                        <button onClick={() => updateTaskStatus(task.task_id, 'in-progress')}>
                          Set In Progress
                        </button>
                      </li>
                      <li>
                        <button onClick={() => updateTaskStatus(task.task_id, 'completed')}>
                          Set Completed
                        </button>
                      </li>
                      <li>
                        <button onClick={() => updateTaskStatus(task.task_id, 'blocked')}>
                          Set Blocked
                        </button>
                      </li>
                    </ul>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  const renderNewTaskForm = () => {
    return (
      <div className="card bg-base-100 shadow-xl mb-6">
        <form onSubmit={handleCreateTask} className="card-body">
          <h3 className="card-title">New Task</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text font-medium">Title</span>
              </label>
              <input
                type="text"
                placeholder="Enter task title"
                className="input input-bordered w-full"
                value={newTask.title}
                onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                required
              />
            </div>

            <div className="form-control w-full">
              <label className="label">
                <span className="label-text font-medium">Assigned To</span>
              </label>
              <select
                className="select select-bordered w-full"
                value={newTask.assigned_to}
                onChange={(e) => setNewTask({...newTask, assigned_to: e.target.value})}
                required
              >
                <option value="">Select employee</option>
                {employees.map((employee) => (
                  <option key={employee.employee_id} value={employee.employee_id}>
                    {employee.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-control w-full">
            <label className="label">
              <span className="label-text font-medium">Description</span>
            </label>
            <textarea
              placeholder="Enter task description"
              className="textarea textarea-bordered w-full"
              value={newTask.description}
              onChange={(e) => setNewTask({...newTask, description: e.target.value})}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text font-medium">Priority</span>
              </label>
              <select
                className="select select-bordered w-full"
                value={newTask.priority}
                onChange={(e) => setNewTask({...newTask, priority: e.target.value})}
                required
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div className="form-control w-full">
              <label className="label">
                <span className="label-text font-medium">Due Date</span>
              </label>
              <input
                type="date"
                className="input input-bordered w-full"
                value={newTask.due_date}
                onChange={(e) => setNewTask({...newTask, due_date: e.target.value})}
                required
              />
            </div>

            <div className="form-control w-full">
              <label className="label">
                <span className="label-text font-medium">Estimated Hours</span>
              </label>
              <input
                type="number"
                step="0.5"
                placeholder="Enter estimated hours"
                className="input input-bordered w-full"
                value={newTask.estimated_hours}
                onChange={(e) => setNewTask({...newTask, estimated_hours: e.target.value})}
                required
              />
            </div>
          </div>

          <div className="card-actions justify-end mt-4">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setShowNewTaskForm(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving}
            >
              {saving ? (
                <span className="loading loading-spinner"></span>
              ) : (
                'Create Task'
              )}
            </button>
          </div>
        </form>
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

  return (
    <DashboardLayout>
      <PageHeader 
        title={`Tasks - ${project?.name || 'Loading...'}`}
        actions={
          <div className="flex gap-2">
            <button
              onClick={() => router.back()}
              className="btn btn-ghost"
            >
              Back
            </button>
            {!showNewTaskForm && (
              <button
                onClick={() => setShowNewTaskForm(true)}
                className="btn btn-primary"
              >
                New Task
              </button>
            )}
          </div>
        }
      />
      <ContentContainer>
        {error && (
          <div className="alert alert-error mb-4">
            <span>{error}</span>
          </div>
        )}

        {showNewTaskForm && renderNewTaskForm()}
        {renderTasks()}
      </ContentContainer>
    </DashboardLayout>
  )
} 