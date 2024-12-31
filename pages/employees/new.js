import { useRouter } from 'next/router'
import { useState } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import PageHeader from '../../components/PageHeader'
import ContentContainer from '../../components/ContentContainer'

export default function NewEmployee() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
    skills: [],
    hourly_rate: '',
    availability_hours: '40',
    start_date: '',
    department: 'general',
    contact_info: {
      phone: '',
      address: '',
      emergency_contact: ''
    }
  })
  const [newSkill, setNewSkill] = useState('')

  const departments = [
    'general',
    'development',
    'design',
    'marketing',
    'management',
    'sales'
  ]

  const roles = [
    'Developer',
    'Designer',
    'Project Manager',
    'Account Manager',
    'Marketing Specialist',
    'Sales Representative',
    'Team Lead',
    'QA Engineer'
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/employees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        router.push('/employees')
      } else {
        const error = await response.json()
        throw new Error(error.message || 'Failed to create employee')
      }
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const addSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData({
        ...formData,
        skills: [...formData.skills, newSkill.trim()]
      })
      setNewSkill('')
    }
  }

  const removeSkill = (skillToRemove) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter(skill => skill !== skillToRemove)
    })
  }

  const updateContactInfo = (field, value) => {
    setFormData({
      ...formData,
      contact_info: {
        ...formData.contact_info,
        [field]: value
      }
    })
  }

  return (
    <DashboardLayout>
      <PageHeader 
        title="Add Employee"
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-medium">Full Name</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter full name"
                  className="input input-bordered w-full"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>

              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-medium">Email</span>
                </label>
                <input
                  type="email"
                  placeholder="Enter email address"
                  className="input input-bordered w-full"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-medium">Role</span>
                </label>
                <select
                  className="select select-bordered w-full"
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  required
                >
                  <option value="">Select a role</option>
                  {roles.map((role) => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>

              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-medium">Department</span>
                </label>
                <select
                  className="select select-bordered w-full"
                  value={formData.department}
                  onChange={(e) => setFormData({...formData, department: e.target.value})}
                  required
                >
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept.charAt(0).toUpperCase() + dept.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-medium">Hourly Rate</span>
                </label>
                <input
                  type="number"
                  placeholder="Enter hourly rate"
                  className="input input-bordered w-full"
                  value={formData.hourly_rate}
                  onChange={(e) => setFormData({...formData, hourly_rate: e.target.value})}
                  required
                />
              </div>

              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-medium">Weekly Availability (hours)</span>
                </label>
                <input
                  type="number"
                  placeholder="Enter weekly hours"
                  className="input input-bordered w-full"
                  value={formData.availability_hours}
                  onChange={(e) => setFormData({...formData, availability_hours: e.target.value})}
                  min="0"
                  max="168"
                  required
                />
              </div>
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

            <div className="divider text-lg font-semibold">Skills</div>

            <div className="form-control">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add a skill"
                  className="input input-bordered flex-1"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                />
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={addSkill}
                >
                  Add
                </button>
              </div>

              <div className="flex flex-wrap gap-2 mt-4">
                {formData.skills.map((skill, index) => (
                  <div key={index} className="badge badge-lg gap-2">
                    {skill}
                    <button
                      type="button"
                      className="btn btn-ghost btn-xs"
                      onClick={() => removeSkill(skill)}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="divider text-lg font-semibold">Contact Information</div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-medium">Phone Number</span>
                </label>
                <input
                  type="tel"
                  placeholder="Enter phone number"
                  className="input input-bordered w-full"
                  value={formData.contact_info.phone}
                  onChange={(e) => updateContactInfo('phone', e.target.value)}
                />
              </div>

              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-medium">Emergency Contact</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter emergency contact"
                  className="input input-bordered w-full"
                  value={formData.contact_info.emergency_contact}
                  onChange={(e) => updateContactInfo('emergency_contact', e.target.value)}
                />
              </div>
            </div>

            <div className="form-control w-full">
              <label className="label">
                <span className="label-text font-medium">Address</span>
              </label>
              <textarea
                className="textarea textarea-bordered h-24"
                placeholder="Enter address"
                value={formData.contact_info.address}
                onChange={(e) => updateContactInfo('address', e.target.value)}
              ></textarea>
            </div>

            <div className="card-actions justify-end mt-6">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? (
                  <span className="loading loading-spinner"></span>
                ) : (
                  'Add Employee'
                )}
              </button>
            </div>
          </form>
        </div>
      </ContentContainer>
    </DashboardLayout>
  )
} 