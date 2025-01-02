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
  const [currentMonth, setCurrentMonth] = useState(new Date())

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
      setTasks(data)
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

  const getDaysInMonth = (date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const firstDayOfMonth = new Date(year, month, 1).getDay()
    
    const days = []
    // Add empty days for padding at start of month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null)
    }
    // Add all days in month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i))
    }
    // Add empty days for padding at end to complete the grid
    while (days.length % 7 !== 0) {
      days.push(null)
    }
    return days
  }

  const getTasksForDate = (date) => {
    if (!date) return []
    return filteredTasks.filter(task => {
      if (!task.due_date) return false
      const taskDate = new Date(task.due_date)
      return taskDate.toDateString() === date.toDateString()
    })
  }

  const renderTaskCard = (task) => {
    const assignedEmployee = employees.find(emp => emp.employee_id === task.assigned_to)
    
    return (
      <div 
        key={task.task_id} 
        className="p-2 bg-base-100 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer text-sm"
        onClick={() => window.location.href = `/tasks/${task.task_id}`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{task.name || task.title}</p>
            {assignedEmployee && (
              <p className="text-xs text-base-content/70 truncate">
                {assignedEmployee.name}
              </p>
            )}
          </div>
          <div className={`badge badge-sm ${getStatusColor(task.status)}`}>
            {task.status}
          </div>
        </div>
      </div>
    )
  }

  const navigateMonth = (direction) => {
    const newDate = new Date(currentMonth)
    newDate.setMonth(newDate.getMonth() + direction)
    setCurrentMonth(newDate)
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

    const days = getDaysInMonth(currentMonth)
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

    return (
      <div className="space-y-6">
        {/* Month Navigation */}
        <div className="flex justify-between items-center">
          <button 
            className="btn btn-ghost btn-sm"
            onClick={() => navigateMonth(-1)}
          >
            ←
          </button>
          <h2 className="text-xl font-semibold">
            {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h2>
          <button 
            className="btn btn-ghost btn-sm"
            onClick={() => navigateMonth(1)}
          >
            →
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="rounded-lg border border-base-300 overflow-hidden">
          {/* Week days header */}
          <div className="grid grid-cols-7 bg-base-200">
            {weekDays.map(day => (
              <div key={day} className="p-2 text-center font-medium">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 divide-x divide-y divide-base-300">
            {days.map((date, index) => {
              const tasksForDay = date ? getTasksForDate(date) : []
              const isToday = date && date.toDateString() === new Date().toDateString()
              
              return (
                <div 
                  key={index}
                  className={`min-h-[120px] p-2 ${
                    !date ? 'bg-base-200/50' : 
                    isToday ? 'bg-primary/5' : 'bg-base-100'
                  }`}
                >
                  {date && (
                    <>
                      <div className={`text-right mb-2 ${
                        isToday ? 'font-bold text-primary' : ''
                      }`}>
                        {date.getDate()}
                      </div>
                      <div className="space-y-1">
                        {tasksForDay.slice(0, 3).map(task => renderTaskCard(task))}
                        {tasksForDay.length > 3 && (
                          <div className="text-xs text-base-content/70 text-center">
                            +{tasksForDay.length - 3} more
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>
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