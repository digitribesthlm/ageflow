import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import DashboardLayout from '../../../components/DashboardLayout'
import PageHeader from '../../../components/PageHeader'
import ContentContainer from '../../../components/ContentContainer'

export default function EditEmployee() {
  const router = useRouter()
  const { id } = router.query
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
    department: '',
    skills: [],
    hourly_rate: 0,
    availability_hours: 40,
    start_date: '',
    contact_info: {
      phone: '',
      address: '',
      emergency_contact: ''
    }
  })

  useEffect(() => {
    const user = localStorage.getItem('user')
    if (!user) {
      router.push('/')
      return
    }
    if (id) {
      fetchEmployeeData()
    }
  }, [id])

  const fetchEmployeeData = async () => {
    try {
      const res = await fetch(`/api/employees/${id}`)
      if (!res.ok) {
        throw new Error('Failed to fetch employee')
      }
      const data = await res.json()
      setFormData({
        ...data,
        start_date: new Date(data.start_date).toISOString().split('T')[0],
        contact_info: {
          phone: data.contact_info?.phone || '',
          address: data.contact_info?.address || '',
          emergency_contact: data.contact_info?.emergency_contact || ''
        }
      })
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    if (name.startsWith('contact_info.')) {
      const field = name.split('.')[1]
      setFormData(prev => ({
        ...prev,
        contact_info: {
          ...prev.contact_info,
          [field]: value
        }
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  const handleSkillsChange = (e) => {
    const skills = e.target.value.split(',').map(skill => skill.trim())
    setFormData(prev => ({
      ...prev,
      skills
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const res = await fetch(`/api/employees/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      if (!res.ok) {
        throw new Error('Failed to update employee')
      }

      router.push(`/employees/${id}`)
    } catch (error) {
      setError(error.message)
      setSaving(false)
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
        title="Edit Employee"
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
          <div className="card-body">
            {error && (
              <div className="alert alert-error mb-4">
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Name</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="input input-bordered"
                    required
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Email</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="input input-bordered"
                    required
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Role</span>
                  </label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    className="select select-bordered"
                    required
                  >
                    <option value="">Select a role</option>
                    <option value="Project Manager">Project Manager</option>
                    <option value="Developer">Developer</option>
                    <option value="Designer">Designer</option>
                    <option value="Content Writer">Content Writer</option>
                    <option value="SEO Specialist">SEO Specialist</option>
                    <option value="Digital Marketer">Digital Marketer</option>
                  </select>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Department</span>
                  </label>
                  <select
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    className="select select-bordered"
                    required
                  >
                    <option value="">Select a department</option>
                    <option value="Development">Development</option>
                    <option value="Design">Design</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Content">Content</option>
                    <option value="Management">Management</option>
                  </select>
                </div>
              </div>

              {/* Skills and Rates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Skills (comma-separated)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.skills.join(', ')}
                    onChange={handleSkillsChange}
                    className="input input-bordered"
                    placeholder="HTML, CSS, JavaScript"
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Hourly Rate ($)</span>
                  </label>
                  <input
                    type="number"
                    name="hourly_rate"
                    value={formData.hourly_rate}
                    onChange={handleInputChange}
                    className="input input-bordered"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Weekly Availability (hours)</span>
                  </label>
                  <input
                    type="number"
                    name="availability_hours"
                    value={formData.availability_hours}
                    onChange={handleInputChange}
                    className="input input-bordered"
                    min="0"
                    max="168"
                    required
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Start Date</span>
                  </label>
                  <input
                    type="date"
                    name="start_date"
                    value={formData.start_date}
                    onChange={handleInputChange}
                    className="input input-bordered"
                    required
                  />
                </div>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Phone</span>
                  </label>
                  <input
                    type="tel"
                    name="contact_info.phone"
                    value={formData.contact_info.phone}
                    onChange={handleInputChange}
                    className="input input-bordered"
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Emergency Contact</span>
                  </label>
                  <input
                    type="text"
                    name="contact_info.emergency_contact"
                    value={formData.contact_info.emergency_contact}
                    onChange={handleInputChange}
                    className="input input-bordered"
                  />
                </div>

                <div className="form-control md:col-span-2">
                  <label className="label">
                    <span className="label-text">Address</span>
                  </label>
                  <textarea
                    name="contact_info.address"
                    value={formData.contact_info.address}
                    onChange={handleInputChange}
                    className="textarea textarea-bordered h-24"
                  ></textarea>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-2">
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
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </ContentContainer>
    </DashboardLayout>
  )
} 