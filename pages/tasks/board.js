import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import PageHeader from '../../components/PageHeader'
import ContentContainer from '../../components/ContentContainer'

export default function TaskBoard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [tasks, setTasks] = useState([])
  const [employees, setEmployees] = useState([])
  const [draggedTask, setDraggedTask] = useState(null)

  useEffect(() => {
    const user = localStorage.getItem('user')
    if (!user) {
      router.push('/')
      return
    }
    fetchTasks()
    fetchEmployees()
  }, [])

  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/tasks')
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

  const getTasksByStatus = (status) => {
    return tasks.filter(task => task.status === status)
  }

  const handleDragStart = (e, taskId) => {
    setDraggedTask(taskId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = async (e, status) => {
    e.preventDefault()
    if (!draggedTask) return

    try {
      const response = await fetch(`/api/tasks/${draggedTask}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      })

      if (response.ok) {
        await fetchTasks()
      } else {
        throw new Error('Failed to update task status')
      }
    } catch (error) {
      setError(error.message)
    }

    setDraggedTask(null)
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'border-l-4 border-error'
      case 'medium':
        return 'border-l-4 border-warning'
      case 'low':
        return 'border-l-4 border-info'
      default:
        return ''
    }
  }

  const renderTaskColumn = (title, status, bgColor = 'bg-base-200') => {
    const columnTasks = getTasksByStatus(status)
    
    return (
      <div 
        className={`flex flex-col w-full md:w-72 ${bgColor} rounded-lg p-4`}
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, status)}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-medium">{title}</h3>
          <span className="badge">{columnTasks.length}</span>
        </div>

        <div className="space-y-3">
          {columnTasks.map((task) => (
            <div
              key={task.task_id}
              className={`card bg-base-100 shadow-sm cursor-move ${getPriorityColor(task.priority)}`}
              draggable
              onDragStart={(e) => handleDragStart(e, task.task_id)}
            >
              <div className="card-body p-4">
                <h4 className="card-title text-sm">{task.title}</h4>
                <p className="text-xs text-base-content/70">{task.description}</p>
                
                <div className="flex justify-between items-center mt-2">
                  <div className="flex items-center gap-2">
                    <div className="avatar placeholder">
                      <div className="bg-neutral text-neutral-content rounded-full w-6">
                        <span className="text-xs">
                          {employees.find(e => e.employee_id === task.assigned_to)?.name?.charAt(0) || '?'}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs">
                      Due: {new Date(task.due_date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="badge badge-sm">
                    {task.estimated_hours}h
                  </div>
                </div>
              </div>
            </div>
          ))}
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

  return (
    <DashboardLayout>
      <PageHeader 
        title="Task Board"
        actions={
          <button
            onClick={() => router.push('/tasks/new')}
            className="btn btn-primary"
          >
            New Task
          </button>
        }
      />
      <ContentContainer>
        {error && (
          <div className="alert alert-error mb-4">
            <span>{error}</span>
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-6 overflow-x-auto pb-6">
          {renderTaskColumn('Pending', 'pending')}
          {renderTaskColumn('In Progress', 'in-progress', 'bg-warning/10')}
          {renderTaskColumn('Completed', 'completed', 'bg-success/10')}
          {renderTaskColumn('Blocked', 'blocked', 'bg-error/10')}
        </div>
      </ContentContainer>
    </DashboardLayout>
  )
} 