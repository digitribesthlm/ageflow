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
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    service_type: '',
    billing_type: '',
    description: '',
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
      const response = await fetch(`/api/services/${id}`)
      if (response.ok) {
        const data = await response.json()
        setFormData(data)
      } else {
        throw new Error('Failed to fetch service')
      }
    } catch (error) {
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
      const response = await fetch(`/api/services/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        router.push('/services')
      } else {
        const error = await response.json()
        throw new Error(error.message || 'Failed to update service')
      }
    } catch (error) {
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
          estimatedHours: ''
        }
      ]
    })
  }

  const updateDeliverable = (index, field, value) => {
    const newDeliverables = [...formData.deliverables]
    newDeliverables[index] = {
      ...newDeliverables[index],
      [field]: value
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-control w-full">
                    <label className="label">
                      <span className="label-text font-medium">Deliverable Name</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Enter deliverable name"
                      className="input input-bordered w-full"
                      value={deliverable.name}
                      onChange={(e) => updateDeliverable(index, 'name', e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-control w-full">
                    <label className="label">
                      <span className="label-text font-medium">Estimated Hours</span>
                    </label>
                    <input
                      type="number"
                      placeholder="Enter estimated hours"
                      className="input input-bordered w-full"
                      value={deliverable.estimatedHours}
                      onChange={(e) => updateDeliverable(index, 'estimatedHours', e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-control w-full mt-4">
                  <label className="label">
                    <span className="label-text font-medium">Description</span>
                  </label>
                  <textarea
                    className="textarea textarea-bordered"
                    placeholder="Enter deliverable description"
                    value={deliverable.description}
                    onChange={(e) => updateDeliverable(index, 'description', e.target.value)}
                    required
                  ></textarea>
                </div>
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
      </ContentContainer>
    </DashboardLayout>
  )
} 