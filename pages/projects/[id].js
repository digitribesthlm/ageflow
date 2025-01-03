import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import PageHeader from '../../components/PageHeader'
import ContentContainer from '../../components/ContentContainer'

export default function ProjectDetails() {
    const router = useRouter()
    const { id } = router.query
    const [project, setProject] = useState(null)
    const [processInstances, setProcessInstances] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    // Helper functions for progress calculation
    const calculateTotalHours = (instances) => {
        return instances.reduce((total, instance) => 
            total + instance.phases.reduce((phaseTotal, phase) => 
                phaseTotal + phase.tasks.reduce((taskTotal, task) => 
                    taskTotal + (task.estimated_hours || 0), 0), 0), 0)
    }

    const calculateCompletedHours = (instances) => {
        return instances.reduce((total, instance) => 
            total + instance.phases.reduce((phaseTotal, phase) => 
                phaseTotal + phase.tasks.reduce((taskTotal, task) => 
                    taskTotal + (task.status === 'completed' ? (task.estimated_hours || 0) : 0), 0), 0), 0)
    }

    const calculateProgress = (instances) => {
        const totalHours = calculateTotalHours(instances)
        if (totalHours === 0) return 0
        return Math.round((calculateCompletedHours(instances) / totalHours) * 100)
    }

    const getProjectStatus = (instances) => {
        if (!instances || instances.length === 0) return 'planning'

        const progress = calculateProgress(instances)
        if (progress === 100) return 'completed'
        if (progress > 0) return 'in-progress'
        return 'planning'
    }

    useEffect(() => {
        if (id) {
            fetchProjectDetails()
        }
    }, [id])

    const fetchProjectDetails = async () => {
        try {
            const response = await fetch('/api/projects', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    action: 'fetch_details',
                    project_id: id
                })
            })

            if (response.ok) {
                const data = await response.json()
                console.log('Project details:', data)
                setProject(data.project)
                setProcessInstances(data.processInstances || [])
            } else {
                const errorData = await response.json()
                setError(errorData.message || 'Failed to fetch project details')
            }
        } catch (error) {
            console.error('Error fetching project details:', error)
            setError('Error fetching project details')
        } finally {
            setLoading(false)
        }
    }

    const handleTaskStatusChange = async (instanceId, phaseId, taskId, newStatus) => {
        try {
            const response = await fetch('/api/projects', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    action: 'update_task_status',
                    project_id: id,
                    instance_id: instanceId,
                    phase_id: phaseId,
                    task_id: taskId,
                    status: newStatus
                })
            })

            if (response.ok) {
                const data = await response.json()
                console.log('Task status updated:', data)
                fetchProjectDetails()
            } else {
                const errorData = await response.json()
                setError(errorData.message || 'Failed to update task status')
            }
        } catch (error) {
            console.error('Error updating task status:', error)
            setError('Error updating task status')
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
                <div className="alert alert-warning">
                    <span>Project not found</span>
                </div>
            )
        }

        return (
            <div className="space-y-6">
                {/* Project Overview */}
                <div className="card bg-base-100 shadow-xl">
                    <div className="card-body">
                        <h2 className="card-title text-2xl">{project.name}</h2>
                        
                        {/* Progress Bar */}
                        <div className="mt-4">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-medium">Overall Progress</span>
                                <span className="text-sm">{calculateProgress(processInstances)}%</span>
                            </div>
                            <div className="w-full bg-base-200 rounded-full h-2.5">
                                <div 
                                    className="bg-primary h-2.5 rounded-full transition-all" 
                                    style={{ width: `${calculateProgress(processInstances)}%` }}
                                ></div>
                            </div>
                            <div className="flex justify-between text-xs mt-1">
                                <span>{calculateCompletedHours(processInstances)}h completed</span>
                                <span>{calculateTotalHours(processInstances)}h total</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <div>
                                <p className="text-sm opacity-70">Client ID</p>
                                <p>{project.client_id}</p>
                            </div>
                            <div>
                                <p className="text-sm opacity-70">Status</p>
                                <div className={`badge ${
                                    project.status === 'completed' ? 'badge-success' : 
                                    project.status === 'in-progress' ? 'badge-warning' : 
                                    'badge-info'
                                } badge-lg`}>
                                    {getProjectStatus(processInstances)}
                                </div>
                            </div>
                            <div>
                                <p className="text-sm opacity-70">Start Date</p>
                                <p>{new Date(project.start_date).toLocaleDateString()}</p>
                            </div>
                            <div>
                                <p className="text-sm opacity-70">End Date</p>
                                <p>{new Date(project.end_date).toLocaleDateString()}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Process Instances */}
                <div className="space-y-4">
                    <h3 className="text-xl font-semibold">Services & Phases</h3>
                    {processInstances.map((instance, instanceIndex) => (
                        <div key={instance.instance_id} className="card bg-base-100 shadow-xl">
                            <div className="card-body">
                                <h4 className="card-title">
                                    Service: {instance.template_id}
                                    <div className={`badge ${
                                        instance.status === 'completed' ? 'badge-success' : 
                                        instance.status === 'in-progress' ? 'badge-warning' : 
                                        'badge-info'
                                    }`}>
                                        {instance.status}
                                    </div>
                                </h4>

                                {/* Phases */}
                                <div className="mt-4">
                                    {instance.phases.map((phase, phaseIndex) => (
                                        <div key={phaseIndex} className="collapse collapse-arrow bg-base-200 mb-4">
                                            <input type="checkbox" defaultChecked={phaseIndex === 0} /> 
                                            <div className="collapse-title">
                                                <div className="flex justify-between items-center">
                                                    <span className="font-medium">{phase.name}</span>
                                                    <div className="flex items-center gap-4">
                                                        {phase.assigned_to && (
                                                            <div className="text-sm">
                                                                Lead: <span className="font-medium">{phase.assigned_to.name}</span>
                                                                <span className="text-xs opacity-70 ml-1">({phase.assigned_to.role})</span>
                                                            </div>
                                                        )}
                                                        <div className={`badge ${
                                                            phase.status === 'completed' ? 'badge-success' : 
                                                            phase.status === 'in-progress' ? 'badge-warning' : 
                                                            'badge-info'
                                                        }`}>
                                                            {phase.status}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="collapse-content">
                                                {/* Tasks */}
                                                <div className="space-y-4">
                                                    {phase.tasks.map((task, taskIndex) => (
                                                        <div key={taskIndex} className="card bg-base-100">
                                                            <div className="card-body">
                                                                <div className="flex justify-between items-start">
                                                                    <div>
                                                                        <h5 className="font-medium">{task.name}</h5>
                                                                        {task.description && (
                                                                            <p className="text-sm opacity-70 mt-1">{task.description}</p>
                                                                        )}
                                                                        {task.assigned_to && (
                                                                            <div className="mt-2 text-sm">
                                                                                Assigned to: <span className="font-medium">{task.assigned_to.name}</span>
                                                                                <span className="text-xs opacity-70 ml-1">({task.assigned_to.role})</span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <div className="text-right space-y-2">
                                                                        <select
                                                                            className={`select select-sm ${
                                                                                task.status === 'completed' ? 'select-success' : 
                                                                                task.status === 'in-progress' ? 'select-warning' : 
                                                                                'select-info'
                                                                            }`}
                                                                            value={task.status}
                                                                            onChange={(e) => handleTaskStatusChange(
                                                                                instance.instance_id,
                                                                                phase.phase_id,
                                                                                task.task_id,
                                                                                e.target.value
                                                                            )}
                                                                        >
                                                                            <option value="pending">Pending</option>
                                                                            <option value="in-progress">In Progress</option>
                                                                            <option value="completed">Completed</option>
                                                                        </select>
                                                                        {task.estimated_hours && (
                                                                            <div className="text-sm">
                                                                                {task.estimated_hours}h
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
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