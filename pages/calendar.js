import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import PageHeader from '@/components/PageHeader'
import ContentContainer from '@/components/ContentContainer'

export default function Calendar() {
  const [tasks, setTasks] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedEmployee, setSelectedEmployee] = useState('all')
  const [selectedDate, setSelectedDate] = useState(new Date())

  useEffect(() => {
    fetchEmployees()
    fetchTasks()
  }, [])

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/employees')
      if (!response.ok) throw new Error('Failed to fetch employees')
      const data = await response.json()
      setEmployees(data)
    } catch (error) {
      console.error('Error fetching employees:', error)
    }
  }

  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/tasks')
      if (!response.ok) throw new Error('Failed to fetch tasks')
      const data = await response.json()
      
      // Sort tasks by due date
      const sortedTasks = data.sort((a, b) => {
        if (!a.due_date) return 1
        if (!b.due_date) return -1
        return new Date(a.due_date) - new Date(b.due_date)
      })
      
      setTasks(sortedTasks)
    } catch (error) {
      console.error('Error fetching tasks:', error)
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
      case 'blocked':
        return 'badge-error'
      default:
        return 'badge-ghost'
    }
  }

  // Filter tasks based on selected employee
  const filteredTasks = tasks.filter(task => {
    if (selectedEmployee === 'all') return true
    return task.assigned_to === selectedEmployee
  })

  // Group tasks by date
  const groupTasksByDate = () => {
    const groups = {}
    filteredTasks.forEach(task => {
      if (!task.due_date) {
        if (!groups['No Due Date']) {
          groups['No Due Date'] = []
        }
        groups['No Due Date'].push(task)
        return
      }

      const date = new Date(task.due_date).toLocaleDateString()
      if (!groups[date]) {
        groups[date] = []
      }
      groups[date].push(task)
    })
    return groups
  }

  const renderTaskCard = (task) => {
    const assignedEmployee = employees.find(emp => emp.employee_id === task.assigned_to)
    
    return (
      <div 
        key={task.task_id} 
        className="card bg-base-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => window.location.href = `/tasks/${task.task_id}`}
      >
        <div className="card-body p-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-medium">{task.name || task.title}</h3>
              <p className="text-sm text-base-content/70 line-clamp-2">
                {task.description || 'No description'}
              </p>
            </div>
            <div className={`badge ${getStatusColor(task.status)}`}>
              {task.status}
            </div>
          </div>
          <div className="text-sm text-base-content/70 mt-2 space-y-1">
            {task.project_name && (
              <div>Project: {task.project_name}</div>
            )}
            {assignedEmployee && (
              <div>Assigned to: {assignedEmployee.name}</div>
            )}
          </div>
        </div>
      </div>
    )
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

    const groupedTasks = groupTasksByDate()
    const dates = Object.keys(groupedTasks).sort((a, b) => {
      if (a === 'No Due Date') return 1
      if (b === 'No Due Date') return -1
      return new Date(a) - new Date(b)
    })

    return (
      <div className="space-y-8">
        {dates.map(date => (
          <div key={date} className="space-y-4">
            <div className="sticky top-0 bg-base-100 z-10 py-2">
              <h2 className="text-xl font-semibold">
                {date === 'No Due Date' ? date : new Date(date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </h2>
            </div>
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {groupedTasks[date].map(task => renderTaskCard(task))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <DashboardLayout>
      <PageHeader
        title="Task Calendar"
        breadcrumbs={[
          { label: 'Calendar', href: '/calendar' }
        ]}
      />
      <ContentContainer>
        <div className="mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            {/* Employee Filter */}
            <div className="form-control w-full md:w-72">
              <select 
                className="select select-bordered"
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
              >
                <option value="all">All Employees</option>
                {employees.map(employee => (
                  <option key={employee.employee_id} value={employee.employee_id}>
                    {employee.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Stats */}
            <div className="stats shadow">
              <div className="stat">
                <div className="stat-title">Total Tasks</div>
                <div className="stat-value">{filteredTasks.length}</div>
              </div>
              <div className="stat">
                <div className="stat-title">Due Today</div>
                <div className="stat-value">
                  {filteredTasks.filter(task => 
                    task.due_date && 
                    new Date(task.due_date).toLocaleDateString() === new Date().toLocaleDateString()
                  ).length}
                </div>
              </div>
            </div>
          </div>
        </div>
        {renderContent()}
      </ContentContainer>
    </DashboardLayout>
  )
} 