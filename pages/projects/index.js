import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import PageHeader from '../../components/PageHeader'
import ContentContainer from '../../components/ContentContainer'

export default function Projects() {
  const router = useRouter()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const user = localStorage.getItem('user')
    if (!user) {
      router.push('/')
      return
    }
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects')
      if (response.ok) {
        const data = await response.json()
        setProjects(data || [])
      } else {
        const errorData = await response.json()
        setError(errorData.message || 'Failed to fetch projects')
      }
    } catch (error) {
      setError('Error fetching projects: ' + error.message)
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

    if (projects.length === 0) {
      return (
        <div className="text-center p-8">
          <h3 className="text-xl font-semibold mb-4">No Projects Yet</h3>
          <p className="mb-6">Start by creating your first project</p>
          <button
            onClick={() => router.push('/projects/new')}
            className="btn btn-primary"
          >
            Create Project
          </button>
        </div>
      )
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <div key={project.project_id} className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
            <div className="card-body">
              <h2 className="card-title text-lg font-bold">{project.name}</h2>
              <div className="badge badge-outline">{project.project_type}</div>
              
              <div className="mt-4 space-y-2">
                <div className="flex items-center text-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  Client: {project.client_id}
                </div>
                
                <div className="flex items-center text-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {new Date(project.start_date).toLocaleDateString()} - {new Date(project.end_date).toLocaleDateString()}
                </div>

                <div className="flex items-center text-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Budget: ${project.total_budget?.toLocaleString()}
                </div>
              </div>

              <div className="divider my-2"></div>

              <div className="flex justify-between items-center">
                <div className={`badge ${
                  project.status === 'completed' ? 'badge-success' : 
                  project.status === 'in-progress' ? 'badge-warning' : 
                  'badge-info'
                } badge-lg`}>
                  {project.status}
                </div>
                <button 
                  onClick={() => router.push(`/projects/${project.project_id}`)}
                  className="btn btn-primary btn-sm"
                >
                  View Details
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
        title="Projects"
        actions={
          <button
            onClick={() => router.push('/projects/new')}
            className="btn btn-primary"
          >
            New Project
          </button>
        }
      />
      <ContentContainer>
        {renderContent()}
      </ContentContainer>
    </DashboardLayout>
  )
} 