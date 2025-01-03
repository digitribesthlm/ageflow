import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import DashboardLayout from '../../components/DashboardLayout'
import PageHeader from '../../components/PageHeader'
import ContentContainer from '../../components/ContentContainer'

export default function ProcessTemplates() {
  const router = useRouter()
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/process-templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'fetch'
        }),
      })
      
      if (!response.ok) throw new Error('Failed to fetch templates')
      const data = await response.json()
      setTemplates(data)
    } catch (error) {
      console.error('Error fetching templates:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const renderContent = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map(template => (
          <div 
            key={template.template_id} 
            className="card bg-base-100 shadow-xl cursor-pointer hover:shadow-2xl transition-shadow"
            onClick={() => router.push(`/process-templates/${template.template_id}`)}
          >
            <div className="card-body">
              <h2 className="card-title">{template.name}</h2>
              <div className="flex gap-2 mt-2">
                <span className="badge badge-outline">{template.category}</span>
                <span className="badge badge-outline">Version {template.version}</span>
              </div>
              <div className="mt-4">
                <p className="text-sm text-base-content/70">
                  {template.steps?.length || 0} Steps
                </p>
                <p className="text-sm text-base-content/70">
                  {template.steps?.reduce((total, step) => total + step.tasks.length, 0) || 0} Tasks
                </p>
              </div>
              <div className="card-actions justify-end mt-4">
                <button 
                  className="btn btn-primary btn-sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    router.push(`/process-templates/${template.template_id}`)
                  }}
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

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center min-h-screen">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="p-4">
          <div className="alert alert-error">
            {error}
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <PageHeader
        title="Process Templates"
        breadcrumbs={[
          { label: 'Process Templates', href: '/process-templates' }
        ]}
      />
      <ContentContainer>
        {renderContent()}
      </ContentContainer>
    </DashboardLayout>
  )
} 