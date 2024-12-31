import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import PageHeader from '../../components/PageHeader'
import ContentContainer from '../../components/ContentContainer'

export default function TimeTracking() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [timeEntries, setTimeEntries] = useState([])
  const [projects, setProjects] = useState([])
  const [tasks, setTasks] = useState([])
  const [showNewEntryForm, setShowNewEntryForm] = useState(false)
  const [newEntry, setNewEntry] = useState({
    project_id: '',
    task_id: '',
    hours: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  })

  useEffect(() => {
    const user = localStorage.getItem('user')
    if (!user) {
      router.push('/')
      return
    }
    fetchTimeEntries()
    fetchProjects()
  }, [])

  useEffect(() => {
    if (newEntry.project_id) {
      fetchTasks(newEntry.project_id)
    } else {
      setTasks([])
    }
  }, [newEntry.project_id])

  const fetchTimeEntries = async () => {
    try {
      const response = await fetch('/api/time')
      if (response.ok) {
        const data = await response.json()
        setTimeEntries(data || [])
      } else {
        throw new Error('Failed to fetch time entries')
      }
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects')
      if (response.ok) {
        const data = await response.json()
        setProjects(data || [])
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error)
    }
  }

  const fetchTasks = async (projectId) => {
    try {
      const response = await fetch(`/api/tasks?project_id=${projectId}`)
      if (response.ok) {
        const data = await response.json()
        setTasks(data || [])
      }
    } catch (error) {
      console.error('Failed to fetch tasks:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch('/api/time', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newEntry),
      })

      if (response.ok) {
        setShowNewEntryForm(false)
        setNewEntry({
          project_id: '',
          task_id: '',
          hours: '',
          description: '',
          date: new Date().toISOString().split('T')[0]
        })
        await fetchTimeEntries()
      } else {
        const error = await response.json()
        throw new Error(error.message || 'Failed to create time entry')
      }
    } catch (error) {
      setError(error.message)
    } finally {
      setSaving(false)
    }
  }

  const renderNewEntryForm = () => {
    return (
      <div className="card bg-base-100 shadow-xl mb-6">
        <form onSubmit={handleSubmit} className="card-body">
          <h3 className="card-title">New Time Entry</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text font-medium">Project</span>
              </label>
              <select
                className="select select-bordered w-full"
                value={newEntry.project_id}
                onChange={(e) => setNewEntry({
                  ...newEntry,
                  project_id: e.target.value,
                  task_id: '' // Reset task when project changes
                })}
                required
              >
                <option value="">Select Project</option>
                {projects.map((project) => (
                  <option key={project.project_id} value={project.project_id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-control w-full">
              <label className="label">
                <span className="label-text font-medium">Task</span>
              </label>
              <select
                className="select select-bordered w-full"
                value={newEntry.task_id}
                onChange={(e) => setNewEntry({...newEntry, task_id: e.target.value})}
                required
                disabled={!newEntry.project_id}
              >
                <option value="">Select Task</option>
                {tasks.map((task) => (
                  <option key={task.task_id} value={task.task_id}>
                    {task.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text font-medium">Hours</span>
              </label>
              <input
                type="number"
                step="0.5"
                placeholder="Enter hours"
                className="input input-bordered w-full"
                value={newEntry.hours}
                onChange={(e) => setNewEntry({...newEntry, hours: e.target.value})}
                required
              />
            </div>

            <div className="form-control w-full">
              <label className="label">
                <span className="label-text font-medium">Date</span>
              </label>
              <input
                type="date"
                className="input input-bordered w-full"
                value={newEntry.date}
                onChange={(e) => setNewEntry({...newEntry, date: e.target.value})}
                required
              />
            </div>
          </div>

          <div className="form-control w-full">
            <label className="label">
              <span className="label-text font-medium">Description</span>
            </label>
            <textarea
              placeholder="Enter description"
              className="textarea textarea-bordered w-full"
              value={newEntry.description}
              onChange={(e) => setNewEntry({...newEntry, description: e.target.value})}
              required
            />
          </div>

          <div className="card-actions justify-end mt-4">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setShowNewEntryForm(false)}
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
                'Save Entry'
              )}
            </button>
          </div>
        </form>
      </div>
    )
  }

  const renderTimeEntries = () => {
    if (timeEntries.length === 0) {
      return (
        <div className="text-center py-8">
          <h3 className="font-medium text-base-content/70">No time entries found</h3>
          <button
            className="btn btn-primary mt-4"
            onClick={() => setShowNewEntryForm(true)}
          >
            Create First Entry
          </button>
        </div>
      )
    }

    return (
      <div className="overflow-x-auto">
        <table className="table table-zebra w-full">
          <thead>
            <tr>
              <th>Date</th>
              <th>Project</th>
              <th>Task</th>
              <th>Hours</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {timeEntries.map((entry) => (
              <tr key={entry.entry_id}>
                <td>{new Date(entry.date).toLocaleDateString()}</td>
                <td>
                  {projects.find(p => p.project_id === entry.project_id)?.name || 'Unknown Project'}
                </td>
                <td>
                  {tasks.find(t => t.task_id === entry.task_id)?.title || 'Unknown Task'}
                </td>
                <td>{entry.hours}</td>
                <td>{entry.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
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
        title="Time Tracking"
        actions={
          <div className="flex gap-2">
            <button
              onClick={() => router.push('/time/reports')}
              className="btn btn-ghost"
            >
              View Reports
            </button>
            {!showNewEntryForm && (
              <button
                onClick={() => setShowNewEntryForm(true)}
                className="btn btn-primary"
              >
                New Entry
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

        {showNewEntryForm && renderNewEntryForm()}
        {renderTimeEntries()}
      </ContentContainer>
    </DashboardLayout>
  )
} 