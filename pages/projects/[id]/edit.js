import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import DashboardLayout from '../../../components/DashboardLayout'
import PageHeader from '../../../components/PageHeader'
import ContentContainer from '../../../components/ContentContainer'

export default function EditProject() {
  const router = useRouter()
  const { id } = router.query
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [clients, setClients] = useState([])
  const [services, setServices] = useState([])
  const [formData, setFormData] = useState({
    name: '',
    client_id: '',
    service_id: '',
    project_type: '',
    status: '',
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
    if (id) {
      fetchProjectData()
      fetchClients()
      fetchServices()
    }
  }, [id])

  const fetchProjectData = async () => {
    try {
      const response = await fetch(`/api/projects/${id}`)
      if (response.ok) {
        const data = await response.json()
        setFormData({
          ...data,
          start_date: new Date(data.start_date).toISOString().split('T')[0],
          end_date: new Date(data.end_date).toISOString().split('T')[0],
          phases: data.phases.map(phase => ({
            ...phase,
            start_date: new Date(phase.start_date).toISOString().split('T')[0],
            end_date: new Date(phase.end_date).toISOString().split('T')[0]
          }))
        })
      } else {
        throw new Error('Failed to fetch project')
      }
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

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

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch(`/api/projects/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        router.push(`/projects/${id}`)
      } else {
        const error = await response.json()
        setError(error.message || 'Failed to update project')
      }
    } catch (error) {
      setError('Failed to update project: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const addPhase = () => {
    setFormData({
      ...formData,
      phases: [
        ...formData.phases,
        {
          name: '',
          status: 'pending',
          start_date: '',
          end_date: '',
          deliverables: []
        }
      ]
    })
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

  const removePhase = (index) => {
    const newPhases = [...formData.phases]
    newPhases.splice(index, 1)
    setFormData({
      ...formData,
      phases: newPhases
    })
  }

  const addDeliverable = (phaseIndex) => {
    const newPhases = [...formData.phases]
    newPhases[phaseIndex].deliverables.push('')
    setFormData({
      ...formData,
      phases: newPhases
    })
  }

  const updateDeliverable = (phaseIndex, deliverableIndex, value) => {
    const newPhases = [...formData.phases]
    newPhases[phaseIndex].deliverables[deliverableIndex] = value
    setFormData({
      ...formData,
      phases: newPhases
    })
  }

  const removeDeliverable = (phaseIndex, deliverableIndex) => {
    const newPhases = [...formData.phases]
    newPhases[phaseIndex].deliverables.splice(deliverableIndex, 1)
    setFormData({
      ...formData,
      phases: newPhases
    })
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
        title="Edit Project"
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
                  <span className="label-text font-medium">Status</span>
                </label>
                <select
                  className="select select-bordered w-full"
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  required
                >
                  <option value="">Select status</option>
                  <option value="planning">Planning</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
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
              <div key={phaseIndex} className="card bg-base-200 shadow-md p-4 mb-4">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-medium">Phase {phaseIndex + 1}</h3>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm text-error"
                    onClick={() => removePhase(phaseIndex)}
                  >
                    Remove Phase
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-control w-full">
                    <label className="label">
                      <span className="label-text font-medium">Phase Name</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Enter phase name"
                      className="input input-bordered w-full"
                      value={phase.name}
                      onChange={(e) => updatePhase(phaseIndex, 'name', e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-control w-full">
                    <label className="label">
                      <span className="label-text font-medium">Status</span>
                    </label>
                    <select
                      className="select select-bordered w-full"
                      value={phase.status}
                      onChange={(e) => updatePhase(phaseIndex, 'status', e.target.value)}
                      required
                    >
                      <option value="pending">Pending</option>
                      <option value="in-progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
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

                <div className="mt-4">
                  <label className="label">
                    <span className="label-text font-medium">Deliverables</span>
                  </label>
                  {phase.deliverables.map((deliverable, deliverableIndex) => (
                    <div key={deliverableIndex} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        placeholder="Enter deliverable"
                        className="input input-bordered w-full"
                        value={deliverable}
                        onChange={(e) => updateDeliverable(phaseIndex, deliverableIndex, e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm text-error"
                        onClick={() => removeDeliverable(phaseIndex, deliverableIndex)}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm mt-2"
                    onClick={() => addDeliverable(phaseIndex)}
                  >
                    Add Deliverable
                  </button>
                </div>
              </div>
            ))}

            <button
              type="button"
              className="btn btn-outline mt-4"
              onClick={addPhase}
            >
              Add Phase
            </button>

            <div className="card-actions justify-end mt-6">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
              >
                {saving ? (
                  <span className="loading loading-spinner"></span>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </form>
        </div>
      </ContentContainer>
    </DashboardLayout>
  )
} 