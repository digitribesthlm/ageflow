import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import PageHeader from '../../components/PageHeader'
import ContentContainer from '../../components/ContentContainer'

export default function Services() {
  const router = useRouter()
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const user = localStorage.getItem('user')
    if (!user) {
      router.push('/')
      return
    }
    fetchServices()
  }, [])

  const fetchServices = async () => {
    try {
      const response = await fetch('/api/services', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'fetch'
        }),
      })
      
      if (response.ok) {
        const data = await response.json()
        setServices(data || [])
      } else {
        const errorData = await response.json()
        setError(errorData.message || 'Failed to fetch services')
      }
    } catch (error) {
      setError('Error fetching services: ' + error.message)
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

    if (services.length === 0) {
      return (
        <div className="text-center p-8">
          <h3 className="text-xl font-semibold mb-4">No Services Yet</h3>
          <p className="mb-6">Start by adding your first service</p>
          <button
            onClick={() => router.push('/services/new')}
            className="btn btn-primary"
          >
            Add Service
          </button>
        </div>
      )
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service) => (
          <div key={service.service_id} className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
            <div className="card-body">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="card-title text-lg font-bold">{service.name}</h2>
                  <div className="badge badge-outline mt-2">{service.category}</div>
                </div>
                <div className="badge badge-primary">{service.service_type}</div>
              </div>
              
              <p className="text-sm mt-4">{service.description}</p>

              <div className="mt-4">
                <h3 className="font-medium mb-2">Deliverables:</h3>
                <div className="space-y-4">
                  {service.deliverables?.map((phase, phaseIndex) => (
                    <div key={phaseIndex}>
                      {phase.phase !== 'Additional Deliverables' && phase.tasks && (
                        <>
                          <h4 className="font-medium text-sm">{phase.phase}</h4>
                          <ul className="list-disc list-inside space-y-1">
                            {phase.tasks.map((task, taskIndex) => (
                              <li key={taskIndex} className="text-sm">
                                {task.name} {task.estimated_hours && `(${task.estimated_hours}h)`}
                              </li>
                            ))}
                          </ul>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 flex justify-between items-center">
                <div className="badge">{service.billing_type}</div>
                <div className="text-sm">
                  {service.estimated_hours && `Total: ${service.estimated_hours}h`}
                </div>
              </div>

              <div className="card-actions justify-end mt-4">
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => router.push(`/services/${service.service_id}/edit`)}
                >
                  Edit
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <DashboardLayout>
      <PageHeader 
        title="Services"
        actions={
          <button
            onClick={() => router.push('/services/new')}
            className="btn btn-primary"
          >
            New Service
          </button>
        }
      />
      <ContentContainer>
        {renderContent()}
      </ContentContainer>
    </DashboardLayout>
  )
} 