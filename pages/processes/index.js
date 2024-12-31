import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import PageHeader from '../../components/PageHeader'
import ContentContainer from '../../components/ContentContainer'

export default function ProcessInstances() {
  const router = useRouter()
  const [instances, setInstances] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchInstances()
  }, [])

  const fetchInstances = async () => {
    try {
      const response = await fetch('/api/process-instances')
      if (response.ok) {
        const data = await response.json()
        setInstances(data || [])
      } else {
        const errorData = await response.json()
        setError(errorData.message || 'Failed to fetch process instances')
      }
    } catch (error) {
      setError('Error fetching process instances: ' + error.message)
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

    if (instances.length === 0) {
      return (
        <div className="text-center p-8">
          <h3 className="text-xl font-semibold mb-4">No Process Instances Yet</h3>
          <p className="mb-6">Start by creating a new process instance</p>
          <button
            onClick={() => router.push('/processes/new')}
            className="btn btn-primary"
          >
            Create Process Instance
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
              <th className="bg-base-200 text-base font-semibold">Project</th>
              <th className="bg-base-200 text-base font-semibold">Status</th>
              <th className="bg-base-200 text-base font-semibold">Start Date</th>
              <th className="bg-base-200 text-base font-semibold">End Date</th>
              <th className="bg-base-200 text-base font-semibold">Progress</th>
              <th className="bg-base-200 text-base font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {instances.map((instance) => {
              const completedPhases = instance.phases?.filter(p => p.status === 'completed').length || 0
              const totalPhases = instance.phases?.length || 0
              const progress = totalPhases > 0 ? Math.round((completedPhases / totalPhases) * 100) : 0

              return (
                <tr key={instance._id} className="hover:bg-base-200">
                  <td className="font-medium">{instance.name}</td>
                  <td>{instance.project_id}</td>
                  <td>
                    <span className={`badge ${
                      instance.status === 'completed' ? 'badge-success' :
                      instance.status === 'active' ? 'badge-info' :
                      'badge-warning'
                    }`}>
                      {instance.status}
                    </span>
                  </td>
                  <td>{new Date(instance.start_date).toLocaleDateString()}</td>
                  <td>
                    {instance.end_date 
                      ? new Date(instance.end_date).toLocaleDateString()
                      : '-'
                    }
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <progress 
                        className="progress progress-primary w-20" 
                        value={progress} 
                        max="100"
                      ></progress>
                      <span className="text-sm">{progress}%</span>
                    </div>
                  </td>
                  <td className="text-right">
                    <button
                      onClick={() => router.push(`/processes/${instance._id}`)}
                      className="btn btn-primary btn-sm"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <DashboardLayout>
      <PageHeader 
        title="Process Instances"
        action={{
          label: 'New Process Instance',
          onClick: () => router.push('/processes/new')
        }}
      />
      <ContentContainer>
        {renderContent()}
      </ContentContainer>
    </DashboardLayout>
  )
}
