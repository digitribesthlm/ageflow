import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import PageHeader from '../../components/PageHeader'
import ContentContainer from '../../components/ContentContainer'

export default function NewProject() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [clients, setClients] = useState([])
  const [services, setServices] = useState([])
  const [processTemplates, setProcessTemplates] = useState([])
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    client_id: '',
    service_id: '',
    project_type: '',
    status: 'planning',
    start_date: '',
    end_date: '',
    total_budget: '',
    phases: []
  })

  useEffect(() => {
    const user = localStorage.getItem('user')
    if (!user) {
      router.push('/')
      return
    }
    fetchClients()
    fetchServices()
    fetchProcessTemplates()
  }, [])

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/clients')
      if (response.ok) {
        const data = await response.json()
        setClients(data || [])
      }
    } catch (error) {
      console.error('Failed to fetch clients:', error)
    }
  }

  const fetchServices = async () => {
    try {
      const response = await fetch('/api/services')
      if (response.ok) {
        const data = await response.json()
        setServices(data || [])
      }
    } catch (error) {
      console.error('Failed to fetch services:', error)
    }
  }

  const fetchProcessTemplates = async () => {
    try {
      const response = await fetch('/api/process-templates')
      if (response.ok) {
        const data = await response.json()
        setProcessTemplates(data || [])
      }
    } catch (error) {
      console.error('Failed to fetch process templates:', error)
    }
  }

  const handleTemplateSelect = (templateId) => {
    const template = processTemplates.find(t => t.template_id === templateId)
    setSelectedTemplate(template)
    
    if (template) {
      // Convert template steps to project phases
      const phases = template.steps.map(step => ({
        name: step.name,
        status: 'pending',
        start_date: '',
        end_date: '',
        estimated_hours: step.estimated_hours,
        description: step.description,
        deliverables: step.deliverables || [],
        required_tools: step.required_tools || [],
        step_id: step.step_id,
        order: step.order
      }))

      setFormData(prev => ({
        ...prev,
        phases
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        phases: []
      }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          template_id: selectedTemplate?.template_id
        }),
      })

      if (response.ok) {
        router.push('/projects')
      } else {
        const error = await response.json()
        throw new Error(error.message || 'Failed to create project')
      }
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const updatePhase = (index, field, value) => {
    const newPhases = [...formData.phases]
    newPhases[index] = {
      ...newPhases[index],
      [field]: value
    }
    setFormData({
      ...formData,
      phases: newPhases
    })
  }

  return (
    <DashboardLayout>
      <PageHeader 
        title="New Project"
        actions={
          <button
            onClick={() => router.back()}
            className="btn btn-ghost"
          >
            Cancel
          </button>
        }
      />
      <ContentContainer>
        <div className="card bg-base-100 shadow-xl">
          <form onSubmit={handleSubmit} className="card-body">
            {error && (
              <div className="alert alert-error mb-4">
                <span>{error}</span>
              </div>
            )}

            <div className="divider text-lg font-semibold">Basic Information</div>
            
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text font-medium">Project Name</span>
              </label>
              <input
                type="text"
                placeholder="Enter project name"
                className="input input-bordered w-full"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-medium">Client</span>
                </label>
                <select
                  className="select select-bordered w-full"
                  value={formData.client_id}
                  onChange={(e) => setFormData({...formData, client_id: e.target.value})}
                  required
                >
                  <option value="">Select a client</option>
                  {clients.map((client) => (
                    <option key={client.client_id} value={client.client_id}>
                      {client.company}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-medium">Service</span>
                </label>
                <select
                  className="select select-bordered w-full"
                  value={formData.service_id}
                  onChange={(e) => setFormData({...formData, service_id: e.target.value})}
                  required
                >
                  <option value="">Select a service</option>
                  {services.map((service) => (
                    <option key={service.service_id} value={service.service_id}>
                      {service.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-medium">Project Type</span>
                </label>
                <select
                  className="select select-bordered w-full"
                  value={formData.project_type}
                  onChange={(e) => setFormData({...formData, project_type: e.target.value})}
                  required
                >
                  <option value="">Select project type</option>
                  <option value="website">Website</option>
                  <option value="branding">Branding</option>
                  <option value="marketing">Marketing</option>
                  <option value="development">Development</option>
                </select>
              </div>

              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-medium">Process Template</span>
                </label>
                <select
                  className="select select-bordered w-full"
                  value={selectedTemplate?.template_id || ''}
                  onChange={(e) => handleTemplateSelect(e.target.value)}
                >
                  <option value="">Select a template</option>
                  {processTemplates.map((template) => (
                    <option key={template.template_id} value={template.template_id}>
                      {template.name} (v{template.version})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-medium">Total Budget</span>
                </label>
                <input
                  type="number"
                  placeholder="Enter total budget"
                  className="input input-bordered w-full"
                  value={formData.total_budget}
                  onChange={(e) => setFormData({...formData, total_budget: e.target.value})}
                  required
                />
              </div>

              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-medium">Start Date</span>
                </label>
                <input
                  type="date"
                  className="input input-bordered w-full"
                  value={formData.start_date}
                  onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                  required
                />
              </div>

              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-medium">End Date</span>
                </label>
                <input
                  type="date"
                  className="input input-bordered w-full"
                  value={formData.end_date}
                  onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="divider text-lg font-semibold">Project Phases</div>

            {formData.phases.map((phase, phaseIndex) => (
              <div key={phase.step_id || phaseIndex} className="card bg-base-200 shadow-md p-4 mb-4">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-medium">Phase {phaseIndex + 1}: {phase.name}</h3>
                    <p className="text-sm text-base-content/70">{phase.description}</p>
                  </div>
                  <div className="badge badge-neutral">{phase.estimated_hours}h</div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="form-control w-full">
                    <label className="label">
                      <span className="label-text font-medium">Start Date</span>
                    </label>
                    <input
                      type="date"
                      className="input input-bordered w-full"
                      value={phase.start_date}
                      onChange={(e) => updatePhase(phaseIndex, 'start_date', e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-control w-full">
                    <label className="label">
                      <span className="label-text font-medium">End Date</span>
                    </label>
                    <input
                      type="date"
                      className="input input-bordered w-full"
                      value={phase.end_date}
                      onChange={(e) => updatePhase(phaseIndex, 'end_date', e.target.value)}
                      required
                    />
                  </div>
                </div>

                {phase.deliverables?.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Deliverables</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {phase.deliverables.map((deliverable, index) => (
                        <li key={index} className="text-sm">{deliverable}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {phase.required_tools?.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Required Tools</h4>
                    <div className="flex flex-wrap gap-2">
                      {phase.required_tools.map((tool, index) => (
                        <div key={index} className="badge badge-outline">{tool}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}

            <div className="card-actions justify-end mt-6">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? (
                  <span className="loading loading-spinner"></span>
                ) : (
                  'Create Project'
                )}
              </button>
            </div>
          </form>
        </div>
      </ContentContainer>
    </DashboardLayout>
  )
} 