import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import PageHeader from '../../components/PageHeader'
import ContentContainer from '../../components/ContentContainer'

export default function NewProject() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [clients, setClients] = useState([])
  const [services, setServices] = useState([])
  const [formData, setFormData] = useState({
    name: '',
    client_id: '',
    service_id: '',
    project_type: '',
    start_date: '',
    end_date: '',
    total_budget: '',
    phases: [
      {
        name: '',
        status: 'pending',
        start_date: '',
        end_date: '',
        deliverables: []
      }
    ]
  })

  useEffect(() => {
    const user = localStorage.getItem('user')
    if (!user) {
      router.push('/')
      return
    }
    fetchClients()
    fetchServices()
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        router.push('/projects')
      } else {
        const error = await response.json()
        console.error('Failed to create project:', error)
      }
    } catch (error) {
      console.error('Failed to create project:', error)
    } finally {
      setLoading(false)
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <input
                      key={deliverableIndex}
                      type="text"
                      placeholder="Enter deliverable"
                      className="input input-bordered w-full mt-2"
                      value={deliverable}
                      onChange={(e) => updateDeliverable(phaseIndex, deliverableIndex, e.target.value)}
                      required
                    />
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