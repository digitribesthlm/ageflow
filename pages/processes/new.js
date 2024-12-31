import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import PageHeader from '../../components/PageHeader'
import ContentContainer from '../../components/ContentContainer'

export default function NewProcessInstance() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    project_id: '',
    template_id: '',
    start_date: '',
    end_date: '',
    status: 'active'
  })
  const [projects, setProjects] = useState([])
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch projects
        const projResponse = await fetch('/api/projects')
        if (projResponse.ok) {
          const projData = await projResponse.json()
          setProjects(projData)
        }

        // Fetch process templates
        const templResponse = await fetch('/api/process-templates')
        if (templResponse.ok) {
          const templData = await templResponse.json()
          setTemplates(templData)
        }
      } catch (error) {
        setError('Error fetching data: ' + error.message)
      }
    }

    fetchData()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/process-instances', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        router.push('/processes')
      } else {
        const data = await response.json()
        setError(data.message || 'Failed to create process instance')
      }
    } catch (error) {
      setError('Error creating process instance: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  return (
    <DashboardLayout>
      <PageHeader title="Create New Process Instance" />
      <ContentContainer>
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-6 bg-base-100 p-6 rounded-lg shadow-lg">
            {error && (
              <div className="alert alert-error">
                <span>{error}</span>
              </div>
            )}

            <div className="form-control">
              <label className="label">
                <span className="label-text">Process Name</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="input input-bordered"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Project</span>
                </label>
                <select
                  name="project_id"
                  value={formData.project_id}
                  onChange={handleChange}
                  className="select select-bordered"
                  required
                >
                  <option value="">Select Project</option>
                  {projects.map(project => (
                    <option key={project.project_id} value={project.project_id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Process Template</span>
                </label>
                <select
                  name="template_id"
                  value={formData.template_id}
                  onChange={handleChange}
                  className="select select-bordered"
                  required
                >
                  <option value="">Select Template</option>
                  {templates.map(template => (
                    <option key={template._id} value={template._id}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Start Date</span>
                </label>
                <input
                  type="date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleChange}
                  className="input input-bordered"
                  required
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">End Date (Optional)</span>
                </label>
                <input
                  type="date"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleChange}
                  className="input input-bordered"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="btn btn-ghost"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Creating...
                  </>
                ) : (
                  'Create Process Instance'
                )}
              </button>
            </div>
          </form>
        </div>
      </ContentContainer>
    </DashboardLayout>
  )
}
