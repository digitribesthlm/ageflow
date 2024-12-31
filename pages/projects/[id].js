import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import PageHeader from '../../components/PageHeader'
import ContentContainer from '../../components/ContentContainer'

export default function ProjectDetails() {
  const router = useRouter()
  const { id } = router.query
  const [project, setProject] = useState(null)
  const [client, setClient] = useState(null)
  const [service, setService] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const user = localStorage.getItem('user')
    if (!user) {
      router.push('/')
      return
    }
    if (id) {
      fetchProjectData()
    }
  }, [id])

  const fetchProjectData = async () => {
    try {
      // Fetch project details
      const projectRes = await fetch(`/api/projects/${id}`)
      if (!projectRes.ok) {
        throw new Error('Failed to fetch project')
      }
      const projectData = await projectRes.json()
      setProject(projectData)

      // Fetch client details
      const clientRes = await fetch(`/api/clients/${projectData.client_id}`)
      if (clientRes.ok) {
        const clientData = await clientRes.json()
        setClient(clientData)
      }

      // Fetch service details
      const serviceRes = await fetch(`/api/services/${projectData.service_id}`)
      if (serviceRes.ok) {
        const serviceData = await serviceRes.json()
        setService(serviceData)
      }
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'badge-success'
      case 'in-progress':
        return 'badge-warning'
      case 'planning':
        return 'badge-info'
      default:
        return 'badge-ghost'
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

    if (!project) {
      return (
        <div className="alert alert-error">
          <span>Project not found</span>
        </div>
      )
    }

    return (
      <div className="space-y-6">
        {/* Project Overview Card */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="card-title text-2xl">{project.name}</h2>
                <div className="badge badge-outline mt-2">{project.project_type}</div>
              </div>
              <div className={`badge ${getStatusColor(project.status)} badge-lg`}>
                {project.status}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div>
                <h3 className="font-medium mb-2">Client Information</h3>
                <div className="bg-base-200 p-4 rounded-lg">
                  <p className="font-medium">{client?.company}</p>
                  <p className="text-sm">{client?.name}</p>
                  <p className="text-sm">{client?.contactInfo?.email}</p>
                  <p className="text-sm">{client?.contactInfo?.phone}</p>
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-2">Service Details</h3>
                <div className="bg-base-200 p-4 rounded-lg">
                  <p className="font-medium">{service?.name}</p>
                  <p className="text-sm">Type: {service?.service_type}</p>
                  <p className="text-sm">Billing: {service?.billing_type}</p>
                </div>
              </div>
            </div>

            <div className="divider"></div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="stat bg-base-200 rounded-box">
                <div className="stat-title">Budget</div>
                <div className="stat-value text-primary">${project.total_budget?.toLocaleString()}</div>
              </div>
              <div className="stat bg-base-200 rounded-box">
                <div className="stat-title">Start Date</div>
                <div className="stat-value text-lg">{new Date(project.start_date).toLocaleDateString()}</div>
              </div>
              <div className="stat bg-base-200 rounded-box">
                <div className="stat-title">End Date</div>
                <div className="stat-value text-lg">{new Date(project.end_date).toLocaleDateString()}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Project Phases */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Project Phases</h2>
            
            <div className="mt-4">
              {project.phases.map((phase, index) => (
                <div key={index} className="collapse collapse-arrow bg-base-200 mb-4">
                  <input type="checkbox" defaultChecked={index === 0} /> 
                  <div className="collapse-title">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="font-medium">{phase.name}</span>
                        <div className="badge badge-neutral ml-2">{phase.estimated_hours}h</div>
                      </div>
                      <div className={`badge ${getStatusColor(phase.status)}`}>
                        {phase.status}
                      </div>
                    </div>
                  </div>
                  <div className="collapse-content">
                    {phase.description && (
                      <p className="text-sm mb-4">{phase.description}</p>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm font-medium">Timeline</p>
                        <p className="text-sm">
                          {new Date(phase.start_date).toLocaleDateString()} - {new Date(phase.end_date).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Status</p>
                        <div className={`badge ${getStatusColor(phase.status)} mt-1`}>
                          {phase.status}
                        </div>
                      </div>
                    </div>

                    {phase.deliverables?.length > 0 && (
                      <div className="mb-4">
                        <p className="font-medium mb-2">Deliverables:</p>
                        <ul className="list-disc list-inside space-y-1">
                          {phase.deliverables.map((deliverable, dIndex) => (
                            <li key={dIndex} className="text-sm">{deliverable}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {phase.required_tools?.length > 0 && (
                      <div>
                        <p className="font-medium mb-2">Required Tools:</p>
                        <div className="flex flex-wrap gap-2">
                          {phase.required_tools.map((tool, tIndex) => (
                            <div key={tIndex} className="badge badge-outline">{tool}</div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-2">
          <button
            onClick={() => router.push(`/projects/${id}/edit`)}
            className="btn btn-primary"
          >
            Edit Project
          </button>
          <button
            onClick={() => router.push(`/projects/${id}/tasks`)}
            className="btn btn-outline"
          >
            View Tasks
          </button>
        </div>
      </div>
    )
  }

  return (
    <DashboardLayout>
      <PageHeader 
        title="Project Details"
        actions={
          <button
            onClick={() => router.back()}
            className="btn btn-ghost"
          >
            Back
          </button>
        }
      />
      <ContentContainer>
        {renderContent()}
      </ContentContainer>
    </DashboardLayout>
  )
} 