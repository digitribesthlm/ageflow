import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import DashboardLayout from '../../../components/DashboardLayout'
import PageHeader from '../../../components/PageHeader'
import ContentContainer from '../../../components/ContentContainer'

export default function EditClient() {
  const router = useRouter()
  const { id } = router.query
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [client, setClient] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    domain: '',
    address: '',
    notes: ''
  })

  useEffect(() => {
    if (id) {
      fetchClient()
    }
  }, [id])

  const fetchClient = async () => {
    try {
      const response = await fetch(`/api/clients/${id}`)
      if (response.ok) {
        const data = await response.json()
        setClient(data)
      } else {
        throw new Error('Failed to fetch client')
      }
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    try {
      const response = await fetch(`/api/clients/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(client),
      })

      if (response.ok) {
        router.push(`/clients/${id}`)
      } else {
        throw new Error('Failed to update client')
      }
    } catch (error) {
      setError(error.message)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setClient(prev => ({
      ...prev,
      [name]: value
    }))
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
        title="Edit Client"
        breadcrumbs={[
          { label: 'Clients', href: '/clients' },
          { label: client.name || 'Edit Client', href: `/clients/${id}` },
          { label: 'Edit', href: `/clients/${id}/edit` }
        ]}
      />
      <ContentContainer>
        {error && (
          <div className="alert alert-error mb-4">
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="max-w-2xl">
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text">Company Name</span>
                </label>
                <input
                  type="text"
                  name="company"
                  value={client.company}
                  onChange={handleChange}
                  className="input input-bordered"
                  required
                />
              </div>

              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text">Contact Name</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={client.name}
                  onChange={handleChange}
                  className="input input-bordered"
                  required
                />
              </div>

              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text">Domain</span>
                </label>
                <input
                  type="text"
                  name="domain"
                  value={client.domain}
                  onChange={handleChange}
                  className="input input-bordered"
                  placeholder="e.g., example.com"
                  required
                />
              </div>

              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text">Email</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={client.email}
                  onChange={handleChange}
                  className="input input-bordered"
                  required
                />
              </div>

              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text">Phone</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={client.phone}
                  onChange={handleChange}
                  className="input input-bordered"
                />
              </div>

              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text">Address</span>
                </label>
                <textarea
                  name="address"
                  value={client.address}
                  onChange={handleChange}
                  className="textarea textarea-bordered"
                  rows={3}
                />
              </div>

              <div className="form-control mb-6">
                <label className="label">
                  <span className="label-text">Notes</span>
                </label>
                <textarea
                  name="notes"
                  value={client.notes}
                  onChange={handleChange}
                  className="textarea textarea-bordered"
                  rows={4}
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="btn btn-ghost"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </form>
      </ContentContainer>
    </DashboardLayout>
  )
} 