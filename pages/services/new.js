import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import DashboardLayout from '@/components/DashboardLayout'
import PageHeader from '@/components/PageHeader'
import ContentContainer from '@/components/ContentContainer'

export default function NewService() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [processTemplates, setProcessTemplates] = useState([])
    const [formData, setFormData] = useState({
        name: '',
        category: '',
        service_type: '',
        billing_type: '',
        description: '',
        process_template_id: '',
        base_price: '',
        minimum_hours: '',
        included_hours: '',
        additional_deliverables: ''
    })
    const [selectedTemplate, setSelectedTemplate] = useState(null)
    const [selectedSteps, setSelectedSteps] = useState([])

    useEffect(() => {
        fetchProcessTemplates()
    }, [])

    const fetchProcessTemplates = async () => {
        try {
            const response = await fetch('/api/process-templates', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ action: 'fetch' })
            })
            
            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.message || 'Failed to fetch process templates')
            }
            
            const data = await response.json()
            console.log('Fetched process templates:', data)
            setProcessTemplates(data)
        } catch (error) {
            console.error('Error fetching process templates:', error)
            setError('Failed to load process templates')
        }
    }

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
    }

    const handleTemplateChange = (e) => {
        const templateId = e.target.value
        console.log('Selected template ID:', templateId) // Debug log
        
        setFormData(prev => ({
            ...prev,
            process_template_id: templateId
        }))
        
        const template = processTemplates.find(t => t.template_id === templateId)
        console.log('Found template:', template) // Debug log
        console.log('All templates:', processTemplates) // Debug log
        
        setSelectedTemplate(template)
        setSelectedSteps([]) // Reset selected steps when template changes
    }

    const handleStepToggle = (stepId) => {
        setSelectedSteps(prev => {
            const isSelected = prev.includes(stepId)
            if (isSelected) {
                return prev.filter(id => id !== stepId)
            } else {
                return [...prev, stepId]
            }
        })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        // Calculate total estimated hours and format deliverables
        let totalEstimatedHours = 0
        const selectedDeliverables = []

        if (selectedTemplate) {
            selectedTemplate.steps.forEach(step => {
                const selectedTasksInPhase = step.tasks.filter(task => 
                    selected_steps.includes(task.task_template_id) ||
                    (task.sub_tasks || []).some(subTask => selected_steps.includes(subTask.sub_task_template_id))
                )

                if (selectedTasksInPhase.length > 0) {
                    selectedTasksInPhase.forEach(task => {
                        if (selected_steps.includes(task.task_template_id)) {
                            selectedDeliverables.push(`${task.name} (${task.estimated_hours}h)`)
                            totalEstimatedHours += task.estimated_hours || 0
                        }

                        // Add selected sub-tasks
                        const selectedSubTasks = (task.sub_tasks || []).filter(subTask => 
                            selected_steps.includes(subTask.sub_task_template_id)
                        )

                        selectedSubTasks.forEach(subTask => {
                            selectedDeliverables.push(`${subTask.name} (${subTask.estimated_hours}h)`)
                            totalEstimatedHours += subTask.estimated_hours || 0
                        })
                    })
                }
            })
        }

        // Add any additional deliverables
        if (formData.additional_deliverables) {
            const additionalDeliverables = formData.additional_deliverables
                .split('\n')
                .filter(d => d.trim())
                .map(d => d.trim())
            selectedDeliverables.push(...additionalDeliverables)
        }

        try {
            const response = await fetch('/api/services', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'create',
                    ...formData,
                    selected_steps: selected_steps,
                    deliverables: selectedDeliverables.join('\n'),
                    total_estimated_hours: totalEstimatedHours
                }),
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.message || 'Failed to create service')
            }

            router.push('/services')
        } catch (error) {
            console.error('Error creating service:', error)
            setError(error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <DashboardLayout>
            <PageHeader
                title="New Service"
                breadcrumbs={[
                    { label: 'Services', href: '/services' },
                    { label: 'New Service', href: '/services/new' }
                ]}
            />
            <ContentContainer>
                <div className="max-w-3xl mx-auto">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="alert alert-error">
                                <span>{error}</span>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Basic Information */}
                            <div className="card bg-base-100 shadow-xl">
                                <div className="card-body">
                                    <h2 className="card-title">Basic Information</h2>
                                    <div className="space-y-4">
                                        <div className="form-control">
                                            <label className="label">
                                                <span className="label-text">Service Name</span>
                                            </label>
                                            <input
                                                type="text"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleChange}
                                                className="input input-bordered"
                                                required
                                            />
                                        </div>

                                        <div className="form-control">
                                            <label className="label">
                                                <span className="label-text">Category</span>
                                            </label>
                                            <select
                                                name="category"
                                                value={formData.category}
                                                onChange={handleChange}
                                                className="select select-bordered"
                                                required
                                            >
                                                <option value="">Select Category</option>
                                                <option value="seo">SEO</option>
                                                <option value="web-development">Web Development</option>
                                                <option value="content">Content</option>
                                                <option value="marketing">Marketing</option>
                                            </select>
                                        </div>

                                        <div className="form-control">
                                            <label className="label">
                                                <span className="label-text">Service Type</span>
                                            </label>
                                            <select
                                                name="service_type"
                                                value={formData.service_type}
                                                onChange={handleChange}
                                                className="select select-bordered"
                                                required
                                            >
                                                <option value="">Select Type</option>
                                                <option value="one-time">One-time</option>
                                                <option value="recurring">Recurring</option>
                                            </select>
                                        </div>

                                        <div className="form-control">
                                            <label className="label">
                                                <span className="label-text">Billing Type</span>
                                            </label>
                                            <select
                                                name="billing_type"
                                                value={formData.billing_type}
                                                onChange={handleChange}
                                                className="select select-bordered"
                                                required
                                            >
                                                <option value="">Select Billing Type</option>
                                                <option value="fixed">Fixed Price</option>
                                                <option value="hourly">Hourly Rate</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Pricing Information */}
                            <div className="card bg-base-100 shadow-xl">
                                <div className="card-body">
                                    <h2 className="card-title">Pricing Information</h2>
                                    <div className="space-y-4">
                                        <div className="form-control">
                                            <label className="label">
                                                <span className="label-text">Base Price</span>
                                            </label>
                                            <input
                                                type="number"
                                                name="base_price"
                                                value={formData.base_price}
                                                onChange={handleChange}
                                                className="input input-bordered"
                                                min="0"
                                                step="0.01"
                                                required
                                            />
                                        </div>

                                        <div className="form-control">
                                            <label className="label">
                                                <span className="label-text">Minimum Hours</span>
                                            </label>
                                            <input
                                                type="number"
                                                name="minimum_hours"
                                                value={formData.minimum_hours}
                                                onChange={handleChange}
                                                className="input input-bordered"
                                                min="0"
                                            />
                                        </div>

                                        <div className="form-control">
                                            <label className="label">
                                                <span className="label-text">Included Hours</span>
                                            </label>
                                            <input
                                                type="number"
                                                name="included_hours"
                                                value={formData.included_hours}
                                                onChange={handleChange}
                                                className="input input-bordered"
                                                min="0"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Process Template Selection */}
                        <div className="card bg-base-100 shadow-xl">
                            <div className="card-body">
                                <h2 className="card-title">Process Template</h2>
                                <div className="space-y-4">
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text">Select Process Template</span>
                                        </label>
                                        <select
                                            name="process_template_id"
                                            value={formData.process_template_id}
                                            onChange={handleTemplateChange}
                                            className="select select-bordered"
                                            required
                                        >
                                            <option value="">Select Process Template</option>
                                            {processTemplates.map(template => (
                                                <option key={template.template_id} value={template.template_id}>
                                                    {template.name}
                                                </option>
                                            ))}
                                        </select>
                                        <label className="label">
                                            <span className="label-text-alt">Select the process template and then choose specific steps below</span>
                                        </label>
                                    </div>

                                    {selectedTemplate && (
                                        <div className="space-y-4">
                                            <div className="divider">Select Steps and Tasks</div>
                                            
                                            {selectedTemplate.steps?.map((step) => (
                                                <div key={step.step_id} className="card bg-base-100 shadow p-4">
                                                    <div className="font-medium text-lg mb-2">{step.name}</div>
                                                    <div className="space-y-2 ml-4">
                                                        {step.tasks?.map((task) => (
                                                            <div key={task.task_template_id} className="space-y-2">
                                                                <label className="flex items-start gap-2 cursor-pointer">
                                                                    <input
                                                                        type="checkbox"
                                                                        className="checkbox mt-1"
                                                                        checked={selectedSteps.includes(task.task_template_id)}
                                                                        onChange={() => handleStepToggle(task.task_template_id)}
                                                                    />
                                                                    <div>
                                                                        <div className="font-medium">{task.name}</div>
                                                                        {task.description && (
                                                                            <div className="text-sm text-base-content/70">{task.description}</div>
                                                                        )}
                                                                        <div className="text-sm text-base-content/70">
                                                                            Estimated: {task.estimated_hours}h
                                                                        </div>
                                                                    </div>
                                                                </label>
                                                                
                                                                {task.sub_tasks?.map((subTask) => (
                                                                    <label 
                                                                        key={subTask.sub_task_template_id} 
                                                                        className="flex items-start gap-2 ml-6 cursor-pointer"
                                                                    >
                                                                        <input
                                                                            type="checkbox"
                                                                            className="checkbox checkbox-sm mt-1"
                                                                            checked={selectedSteps.includes(subTask.sub_task_template_id)}
                                                                            onChange={() => handleStepToggle(subTask.sub_task_template_id)}
                                                                        />
                                                                        <div>
                                                                            <div className="font-medium">{subTask.name}</div>
                                                                            {subTask.description && (
                                                                                <div className="text-sm text-base-content/70">
                                                                                    {subTask.description}
                                                                                </div>
                                                                            )}
                                                                            <div className="text-sm text-base-content/70">
                                                                                Estimated: {subTask.estimated_hours}h
                                                                            </div>
                                                                        </div>
                                                                    </label>
                                                                ))}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}

                                            {selectedSteps.length > 0 && (
                                                <div className="card bg-base-200 p-4">
                                                    <h3 className="font-medium mb-2">Selected Tasks</h3>
                                                    <div className="space-y-1">
                                                        {selectedSteps.map(taskId => {
                                                            const task = selectedTemplate.steps
                                                                .flatMap(s => [
                                                                    ...s.tasks,
                                                                    ...s.tasks.flatMap(t => t.sub_tasks || [])
                                                                ])
                                                                .find(t => t.task_template_id === taskId || t.sub_task_template_id === taskId)
                                                            
                                                            return task ? (
                                                                <div key={taskId} className="text-sm">
                                                                    • {task.name} ({task.estimated_hours}h)
                                                                </div>
                                                            ) : null
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Description and Deliverables */}
                        <div className="card bg-base-100 shadow-xl">
                            <div className="card-body">
                                <h2 className="card-title">Details</h2>
                                <div className="space-y-4">
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text">Description</span>
                                        </label>
                                        <textarea
                                            name="description"
                                            value={formData.description}
                                            onChange={handleChange}
                                            className="textarea textarea-bordered h-24"
                                            required
                                        />
                                    </div>

                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text">Additional Deliverables</span>
                                        </label>
                                        <textarea
                                            name="additional_deliverables"
                                            value={formData.additional_deliverables || ''}
                                            onChange={handleChange}
                                            className="textarea textarea-bordered h-24"
                                            placeholder="Enter any additional deliverables for this service..."
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-4">
                            <button
                                type="button"
                                onClick={() => router.push('/services')}
                                className="btn btn-ghost"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={loading}
                            >
                                {loading ? (
                                    <span className="loading loading-spinner loading-sm"></span>
                                ) : (
                                    'Create Service'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </ContentContainer>
        </DashboardLayout>
    )
} 