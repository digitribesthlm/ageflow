import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import DashboardLayout from '../../../components/DashboardLayout'
import PageHeader from '../../../components/PageHeader'
import ContentContainer from '../../../components/ContentContainer'

export default function EditService() {
  const router = useRouter()
  const { id } = router.query
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    service_type: '',
    billing_type: '',
    description: '',
    base_price: '',
    minimum_hours: '',
    included_hours: '',
    process_template_id: '',
    selected_steps: [],
    deliverables: []
  })

  useEffect(() => {
    const user = localStorage.getItem('user')
    if (!user) {
      router.push('/')
      return
    }
    if (id) {
      fetchServiceData()
    }
  }, [id])

  const fetchServiceData = async () => {
    try {
      const response = await fetch(`/api/services/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to fetch service')
      }

      const data = await response.json()
      console.log('Fetched service data:', data)

      // Transform deliverables data to match the form structure
      const transformedData = {
        name: data.name || '',
        category: data.category || '',
        service_type: data.service_type || '',
        billing_type: data.billing_type || '',
        description: data.description || '',
        base_price: data.base_price || 0,
        minimum_hours: data.minimum_hours || 0,
        included_hours: data.included_hours || 0,
        process_template_id: data.process_template_id || '',
        selected_steps: data.selected_steps || [],
        deliverables: data.deliverables?.map(phase => ({
          name: phase.phase,
          description: phase.description || '',
          estimatedHours: phase.tasks?.[0]?.estimated_hours || 0,
          tasks: phase.tasks || []
        })) || []
      }

      console.log('Transformed data:', transformedData)
      setFormData(transformedData)
    } catch (error) {
      console.error('Error fetching service:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      // Transform form data back to API format
      const apiData = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        service_type: formData.service_type,
        billing_type: formData.billing_type,
        base_price: parseFloat(formData.base_price) || 0,
        minimum_hours: parseInt(formData.minimum_hours) || 0,
        included_hours: parseInt(formData.included_hours) || 0,
        process_template_id: formData.process_template_id,
        selected_steps: formData.selected_steps || [],
        deliverables: formData.deliverables.map(deliverable => ({
          phase: deliverable.name,
          description: deliverable.description,
          tasks: deliverable.tasks || [{
            name: deliverable.name,
            description: deliverable.description,
            estimated_hours: parseInt(deliverable.estimatedHours) || 0
          }]
        }))
      }

      console.log('Sending update data:', apiData)

      const response = await fetch(`/api/services/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to update service')
      }

      router.push('/services')
    } catch (error) {
      console.error('Error updating service:', error)
      setError(error.message)
      setSaving(false)
    }
  }

  const addDeliverable = () => {
    setFormData({
      ...formData,
      deliverables: [
        ...formData.deliverables,
        {
          name: '',
          description: '',
          estimatedHours: 0,
          tasks: []
        }
      ]
    })
  }

  const updateDeliverable = (index, field, value) => {
    const newDeliverables = [...formData.deliverables]
    newDeliverables[index] = {
      ...newDeliverables[index],
      [field]: value,
      tasks: newDeliverables[index].tasks || []
    }
    setFormData({
      ...formData,
      deliverables: newDeliverables
    })
  }

  const removeDeliverable = (index) => {
    const newDeliverables = [...formData.deliverables]
    newDeliverables.splice(index, 1)
    setFormData({
      ...formData,
      deliverables: newDeliverables
    })
  }

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/services/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to delete service')
      }

      router.push('/services')
    } catch (error) {
      console.error('Error deleting service:', error)
      setError(error.message)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center min-h-[200px]">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <PageHeader
        title="Edit Service"
        breadcrumbs={[
          { label: 'Services', href: '/services' },
          { label: 'Edit Service', href: `/services/${id}/edit` }
        ]}
        actions={
          <button
            onClick={() => setShowDeleteModal(true)}
            className="btn btn-error"
          >
            Delete Service
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
                <span className="label-text font-medium">Service Name</span>
              </label>
              <input
                type="text"
                placeholder="Enter service name"
                className="input input-bordered w-full"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-medium">Category</span>
                </label>
                <select
                  className="select select-bordered w-full"
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  required
                >
                  <option value="">Select category</option>
                  <option value="digital-marketing">Digital Marketing</option>
                  <option value="development">Development</option>
                  <option value="design">Design</option>
                  <option value="consulting">Consulting</option>
                </select>
              </div>

              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-medium">Service Type</span>
                </label>
                <select
                  className="select select-bordered w-full"
                  value={formData.service_type}
                  onChange={(e) => setFormData({...formData, service_type: e.target.value})}
                  required
                >
                  <option value="">Select type</option>
                  <option value="retainer">Retainer</option>
                  <option value="project">Project</option>
                </select>
              </div>
            </div>

            <div className="form-control w-full">
              <label className="label">
                <span className="label-text font-medium">Billing Type</span>
              </label>
              <select
                className="select select-bordered w-full"
                value={formData.billing_type}
                onChange={(e) => setFormData({...formData, billing_type: e.target.value})}
                required
              >
                <option value="">Select billing type</option>
                <option value="monthly">Monthly</option>
                <option value="hourly">Hourly</option>
                <option value="project">Project</option>
              </select>
            </div>

            <div className="form-control w-full">
              <label className="label">
                <span className="label-text font-medium">Description</span>
              </label>
              <textarea
                className="textarea textarea-bordered h-24"
                placeholder="Enter service description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                required
              ></textarea>
            </div>

            <div className="divider text-lg font-semibold">Deliverables</div>

            {formData.deliverables.map((deliverable, index) => (
              <div key={index} className="card bg-base-200 shadow-md p-4 mb-4">
                <div className="flex justify-end mb-2">
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm text-error"
                    onClick={() => removeDeliverable(index)}
                  >
                    Remove
                  </button>
                </div>

                <div className="form-control w-full mb-4">
                  <label className="label">
                    <span className="label-text font-medium">Phase Name</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter phase name"
                    className="input input-bordered w-full"
                    value={deliverable.name}
                    onChange={(e) => updateDeliverable(index, 'name', e.target.value)}
                    required
                  />
                </div>

                <div className="form-control w-full mb-4">
                  <label className="label">
                    <span className="label-text font-medium">Phase Description</span>
                  </label>
                  <textarea
                    className="textarea textarea-bordered"
                    placeholder="Enter phase description"
                    value={deliverable.description}
                    onChange={(e) => updateDeliverable(index, 'description', e.target.value)}
                    required
                  ></textarea>
                </div>

                <div className="divider text-md">Tasks</div>

                {deliverable.tasks.map((task, taskIndex) => (
                  <div key={taskIndex} className="card bg-base-300 shadow-sm p-4 mb-4">
                    <div className="form-control w-full mb-4">
                      <label className="label">
                        <span className="label-text font-medium">Task Name</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Enter task name"
                        className="input input-bordered w-full"
                        value={task.name}
                        onChange={(e) => {
                          const newTasks = [...deliverable.tasks]
                          newTasks[taskIndex] = { ...task, name: e.target.value }
                          updateDeliverable(index, 'tasks', newTasks)
                        }}
                        required
                      />
                    </div>

                    <div className="form-control w-full mb-4">
                      <label className="label">
                        <span className="label-text font-medium">Task Description</span>
                      </label>
                      <textarea
                        className="textarea textarea-bordered"
                        placeholder="Enter task description"
                        value={task.description}
                        onChange={(e) => {
                          const newTasks = [...deliverable.tasks]
                          newTasks[taskIndex] = { ...task, description: e.target.value }
                          updateDeliverable(index, 'tasks', newTasks)
                        }}
                        required
                      ></textarea>
                    </div>

                    <div className="form-control w-full">
                      <label className="label">
                        <span className="label-text font-medium">Estimated Hours</span>
                      </label>
                      <input
                        type="number"
                        placeholder="Enter estimated hours"
                        className="input input-bordered w-full"
                        value={task.estimated_hours}
                        onChange={(e) => {
                          const newTasks = [...deliverable.tasks]
                          newTasks[taskIndex] = { ...task, estimated_hours: parseInt(e.target.value) || 0 }
                          updateDeliverable(index, 'tasks', newTasks)
                        }}
                        required
                      />
                    </div>

                    <div className="flex justify-end mt-4">
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm text-error"
                        onClick={() => {
                          const newTasks = [...deliverable.tasks]
                          newTasks.splice(taskIndex, 1)
                          updateDeliverable(index, 'tasks', newTasks)
                        }}
                      >
                        Remove Task
                      </button>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  className="btn btn-outline btn-sm mt-2"
                  onClick={() => {
                    const newTasks = [...deliverable.tasks, {
                      name: '',
                      description: '',
                      estimated_hours: 0
                    }]
                    updateDeliverable(index, 'tasks', newTasks)
                  }}
                >
                  Add Task
                </button>
              </div>
            ))}

            <button
              type="button"
              className="btn btn-outline mt-4"
              onClick={addDeliverable}
            >
              Add Deliverable
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

        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-bold mb-4">Delete Service</h3>
              <p className="mb-4">Are you sure you want to delete this service? This action cannot be undone.</p>
              <div className="flex justify-end gap-4">
                <button
                  className="btn btn-ghost"
                  onClick={() => setShowDeleteModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-error"
                  onClick={handleDelete}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </ContentContainer>
    </DashboardLayout>
  )
} 