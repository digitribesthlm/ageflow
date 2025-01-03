import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import PageHeader from '../../components/PageHeader'
import ContentContainer from '../../components/ContentContainer'

export default function Clients() {
  const router = useRouter()
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const user = localStorage.getItem('user')
    if (!user) {
      router.push('/')
      return
    }
    fetchClients()
  }, [])

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'fetch' })
      })

      if (response.ok) {
        const data = await response.json()
        setClients(data || [])
      } else {
        const error = await response.json()
        throw new Error(error.message || 'Failed to fetch clients')
      }
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center min-h-[200px]">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      )
    }

    if (error) {
      return (
        <div className="alert alert-error">
          <span>{error}</span>
        </div>
      )
    }

    if (clients.length === 0) {
      return (
        <div className="text-center p-8">
          <h3 className="text-xl font-semibold mb-4">No Clients Yet</h3>
          <p className="mb-6">Start by adding your first client</p>
          <button
            onClick={() => router.push('/clients/new')}
            className="btn btn-primary"
          >
            Add New Client
          </button>
        </div>
      )
    }

    return (
      <div className="overflow-x-auto bg-base-100 rounded-lg shadow-lg">
        <table className="table table-zebra w-full">
          <thead>
            <tr>
              <th className="bg-base-200 text-base font-semibold">Name</th>
              <th className="bg-base-200 text-base font-semibold">Company</th>
              <th className="bg-base-200 text-base font-semibold">Email</th>
              <th className="bg-base-200 text-base font-semibold">Phone</th>
              <th className="bg-base-200 text-base font-semibold">Address</th>
              <th className="bg-base-200 text-base font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {clients
              .filter(client => client && client.name)
              .map((client) => (
                <tr key={client.client_id} className="hover:bg-base-200">
                  <td className="font-medium">{client.name}</td>
                  <td>{client.company || '-'}</td>
                  <td>{client.email || '-'}</td>
                  <td>{client.phone || '-'}</td>
                  <td>{client.address || '-'}</td>
                  <td className="text-right">
                    <button
                      onClick={() => router.push(`/clients/${client.client_id}`)}
                      className="btn btn-primary btn-sm"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <DashboardLayout>
      <PageHeader
        title="Clients"
        actions={
          <button
            onClick={() => router.push('/clients/new')}
            className="btn btn-primary"
          >
            Add New Client
          </button>
        }
      />
      <ContentContainer>
        {renderContent()}
      </ContentContainer>
    </DashboardLayout>
  )
} 