import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import PageHeader from '../../components/PageHeader'
import ContentContainer from '../../components/ContentContainer'

const ProcessTemplateSelector = ({ service, templates, onSelect }) => {
    const [selectedTemplate, setSelectedTemplate] = useState(null)
    const [selectedTasks, setSelectedTasks] = useState([])

    // Initialize with pre-selected template and steps
    useEffect(() => {
        if (service.process_template_id) {
            const template = templates.find(t => t.template_id === service.process_template_id)
            if (template) {
                console.log('Service selected steps:', service.selected_steps)
                setSelectedTemplate(template)
                setSelectedTasks(service.selected_steps || [])
                // Also notify parent about pre-selected steps
                onSelect(service.service_id, template.template_id, service.selected_steps || [])
            }
        }
    }, [service.process_template_id, service.selected_steps])

    // Helper function to check if a task should be shown
    const isTaskInSelectedSteps = (stepId, taskId, subTaskId = null) => {
        const taskKey = `${stepId}:${taskId}${subTaskId ? ':' + subTaskId : ''}`
        return service.selected_steps?.includes(taskKey) || false
    }

    const handleTaskSelect = (stepId, taskTemplateId, subTaskTemplateId = null) => {
        const newSelectedTasks = [...selectedTasks]
        const taskKey = `${stepId}:${taskTemplateId}${subTaskTemplateId ? ':' + subTaskTemplateId : ''}`
        
        if (newSelectedTasks.includes(taskKey)) {
            const index = newSelectedTasks.indexOf(taskKey)
            newSelectedTasks.splice(index, 1)
        } else {
            newSelectedTasks.push(taskKey)
        }
        
        setSelectedTasks(newSelectedTasks)
        onSelect(service.service_id, selectedTemplate.template_id, newSelectedTasks)
    }

    return (
        <div className="card bg-base-200 p-4 mb-4">
            <h3 className="font-medium mb-2">{service.name}</h3>
            
            {selectedTemplate && (
                <div className="space-y-4">
                    <label className="label">
                        <span className="label-text font-medium">Selected Tasks</span>
                    </label>
                    {selectedTemplate.steps.map(step => {
                        // Only show steps that have selected tasks
                        const hasSelectedTasks = step.tasks.some(task => 
                            isTaskInSelectedSteps(step.step_id, task.task_template_id) ||
                            task.sub_tasks?.some(subTask => 
                                isTaskInSelectedSteps(step.step_id, task.task_template_id, subTask.sub_task_template_id)
                            )
                        )

                        if (!hasSelectedTasks) return null

                        return (
                            <div key={step.step_id} className="card bg-base-100 p-4">
                                <div className="font-medium mb-2">{step.name}</div>
                                <div className="space-y-2 ml-4">
                                    {step.tasks.map(task => {
                                        const isMainTaskSelected = isTaskInSelectedSteps(step.step_id, task.task_template_id)
                                        const hasSelectedSubTasks = task.sub_tasks?.some(subTask => 
                                            isTaskInSelectedSteps(step.step_id, task.task_template_id, subTask.sub_task_template_id)
                                        )

                                        if (!isMainTaskSelected && !hasSelectedSubTasks) return null

                                        return (
                                            <div key={task.task_template_id} className="space-y-2">
                                                {isMainTaskSelected && (
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="checkbox"
                                                            className="checkbox"
                                                            checked={selectedTasks.includes(`${step.step_id}:${task.task_template_id}`)}
                                                            onChange={() => handleTaskSelect(step.step_id, task.task_template_id)}
                                                        />
                                                        <span className="font-medium">{task.name}</span>
                                                        <span className="text-sm opacity-70">
                                                            ({task.estimated_hours}h)
                                                        </span>
                                                    </div>
                                                )}
                                                
                                                {task.sub_tasks && (
                                                    <div className="ml-6 space-y-2">
                                                        {task.sub_tasks.map(subTask => {
                                                            if (!isTaskInSelectedSteps(step.step_id, task.task_template_id, subTask.sub_task_template_id)) {
                                                                return null
                                                            }
                                                            return (
                                                                <div key={subTask.sub_task_template_id} className="flex items-center gap-2">
                                                                    <input
                                                                        type="checkbox"
                                                                        className="checkbox checkbox-sm"
                                                                        checked={selectedTasks.includes(`${step.step_id}:${task.task_template_id}:${subTask.sub_task_template_id}`)}
                                                                        onChange={() => handleTaskSelect(step.step_id, task.task_template_id, subTask.sub_task_template_id)}
                                                                    />
                                                                    <span>{subTask.name}</span>
                                                                    <span className="text-sm opacity-70">
                                                                        ({subTask.estimated_hours}h)
                                                                    </span>
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

export default function NewProject() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState(null)
    
    // Data states
    const [contracts, setContracts] = useState([])
    const [processTemplates, setProcessTemplates] = useState([])
    const [selectedContract, setSelectedContract] = useState(null)
    
    // Form data
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        contract_id: '',
        client_id: '',
        start_date: '',
        end_date: '',
        status: 'planning',
        services: [], // Will contain service_id, package_id, and selected process templates
        total_budget: '',
        phases: []
    })

    useEffect(() => {
        const user = localStorage.getItem('user')
        if (!user) {
            router.push('/')
            return
        }
        fetchInitialData()
    }, [])

    const fetchInitialData = async () => {
        try {
            const [contractsRes, templatesRes] = await Promise.all([
                fetch('/api/contracts'),
                fetch('/api/process-templates')
            ])

            if (!contractsRes.ok || !templatesRes.ok) {
                throw new Error('Failed to fetch initial data')
            }

            const [contractsData, templatesData] = await Promise.all([
                contractsRes.json(),
                templatesRes.json()
            ])

            console.log('Fetched contracts:', contractsData)
            console.log('Fetched process templates:', JSON.stringify(templatesData, null, 2))

            // Log available templates for each service
            const templatesByService = templatesData.reduce((acc, template) => {
                if (!acc[template.service_id]) {
                    acc[template.service_id] = []
                }
                acc[template.service_id].push(template)
                return acc
            }, {})
            console.log('Templates by service:', templatesByService)

            setContracts(contractsData)
            setProcessTemplates(templatesData)
        } catch (error) {
            console.error('Error fetching initial data:', error)
            setError(error.message)
        } finally {
            setLoading(false)
        }
    }

    const handleContractSelect = async (contractId) => {
        if (!contractId) {
            setSelectedContract(null)
            setFormData(prev => ({
                ...prev,
                contract_id: '',
                client_id: '',
                services: []
            }))
            return
        }

        try {
            setLoading(true)
            setError(null)
            console.log('Fetching contract details for:', contractId)
            
            const response = await fetch(`/api/contracts/${contractId}`)
            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.message || 'Error loading contract details')
            }
            
            const contract = await response.json()
            console.log('Contract details:', contract)

            // Store the selected contract
            setSelectedContract(contract)

            // Get all services from the contract's packages
            const servicesFromPackages = contract.packages
                ?.flatMap(pkg => pkg.includedServices || [])
                .map(service => ({
                    service_id: service.service_id,
                    name: service.name,
                    description: service.description,
                    process_template_id: service.process_template_id,
                    selected_steps: service.selected_steps || []
                })) || []

            console.log('Services from packages:', servicesFromPackages)

            // Update form data
            setFormData(prev => ({
                ...prev,
                contract_id: contractId,
                client_id: contract.client_id,
                name: `${contract.client_id} Project - ${new Date().toLocaleDateString()}`,
                services: servicesFromPackages.map(service => ({
                    ...service,
                    process_templates: service.process_template_id ? [{
                        template_id: service.process_template_id,
                        selected_steps: service.selected_steps || []
                    }] : []
                })),
                total_budget: contract.monthly_fee || 0,
                start_date: new Date().toISOString().split('T')[0],
                end_date: ''
            }))

        } catch (error) {
            console.error('Error in handleContractSelect:', error)
            setError(error.message)
            setSelectedContract(null)
        } finally {
            setLoading(false)
        }
    }

    const handleProcessTemplateSelect = (serviceId, selectedTemplateIds) => {
        setFormData(prev => ({
            ...prev,
            services: prev.services.map(service => 
                service.service_id === serviceId
                    ? { ...service, process_templates: selectedTemplateIds }
                    : service
            )
        }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setSaving(true)
        setError(null)

        try {
            // Create phases and tasks from selected process templates
            const phases = []
            const tasks = []
            
            formData.services.forEach(service => {
                service.process_templates.forEach(templateData => {
                    const template = processTemplates.find(t => t.template_id === templateData.template_id)
                    if (template) {
                        template.steps.forEach(step => {
                            const selectedTasksInStep = templateData.selected_steps.filter(
                                taskKey => taskKey.startsWith(step.step_id)
                            )
                            
                            if (selectedTasksInStep.length > 0) {
                                // Create phase
                                const phase = {
                                    name: step.name,
                                    step_id: step.step_id,
                                    service_id: service.service_id,
                                    template_id: template.template_id,
                                    status: 'pending',
                                    order: step.order,
                                    estimated_hours: 0,
                                    tasks: []
                                }
                                
                                // Process selected tasks
                                step.tasks.forEach(taskTemplate => {
                                    const mainTaskKey = `${step.step_id}:${taskTemplate.task_template_id}`
                                    if (templateData.selected_steps.includes(mainTaskKey)) {
                                        const taskId = `TSK_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
                                        
                                        // Create main task
                                        const task = {
                                            task_id: taskId,
                                            name: taskTemplate.name,
                                            description: taskTemplate.description,
                                            service_id: service.service_id,
                                            project_id: '', // Will be set after project creation
                                            phase_id: phase.step_id,
                                            template_id: template.template_id,
                                            task_template_id: taskTemplate.task_template_id,
                                            estimated_hours: taskTemplate.estimated_hours,
                                            required_tools: taskTemplate.required_tools || [],
                                            deliverables: taskTemplate.deliverables || [],
                                            instruction_doc: taskTemplate.instruction_doc,
                                            status: 'pending',
                                            created_at: new Date(),
                                            updated_at: new Date()
                                        }
                                        
                                        tasks.push(task)
                                        phase.tasks.push(taskId)
                                        phase.estimated_hours += taskTemplate.estimated_hours
                                        
                                        // Process sub-tasks if any
                                        taskTemplate.sub_tasks?.forEach(subTaskTemplate => {
                                            const subTaskKey = `${step.step_id}:${taskTemplate.task_template_id}:${subTaskTemplate.sub_task_template_id}`
                                            if (templateData.selected_steps.includes(subTaskKey)) {
                                                const subTaskId = `TSK_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
                                                
                                                const subTask = {
                                                    task_id: subTaskId,
                                                    name: subTaskTemplate.name,
                                                    description: subTaskTemplate.description,
                                                    service_id: service.service_id,
                                                    project_id: '', // Will be set after project creation
                                                    phase_id: phase.step_id,
                                                    parent_task_id: taskId,
                                                    template_id: template.template_id,
                                                    task_template_id: subTaskTemplate.sub_task_template_id,
                                                    estimated_hours: subTaskTemplate.estimated_hours,
                                                    instruction_doc: subTaskTemplate.instruction_doc,
                                                    status: 'pending',
                                                    created_at: new Date(),
                                                    updated_at: new Date()
                                                }
                                                
                                                tasks.push(subTask)
                                                phase.tasks.push(subTaskId)
                                                phase.estimated_hours += subTaskTemplate.estimated_hours
                                            }
                                        })
                                    }
                                })
                                
                                phases.push(phase)
                            }
                        })
                    }
                })
            })

            const projectData = {
                ...formData,
                phases: phases.sort((a, b) => a.order - b.order),
                created_at: new Date(),
                updated_at: new Date()
            }

            // Create project first
            const projectResponse = await fetch('/api/projects', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(projectData),
            })

            if (!projectResponse.ok) {
                const error = await projectResponse.json()
                throw new Error(error.message || 'Failed to create project')
            }

            const project = await projectResponse.json()

            // Create tasks with project ID
            const tasksWithProject = tasks.map(task => ({
                ...task,
                project_id: project.project_id
            }))

            const tasksResponse = await fetch('/api/tasks/batch', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(tasksWithProject),
            })

            if (!tasksResponse.ok) {
                const error = await tasksResponse.json()
                throw new Error(error.message || 'Failed to create tasks')
            }

            router.push('/projects')
        } catch (error) {
            setError(error.message)
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex justify-center items-center min-h-[200px]">
                    <span className="loading loading-spinner loading-lg"></span>
                </div>
            </DashboardLayout>
        )
    }

    return (
        <DashboardLayout>
            <PageHeader 
                title="Create New Project" 
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

                        <div className="form-control w-full">
                            <label className="label">
                                <span className="label-text font-medium">Select Contract</span>
                            </label>
                            <select
                                className="select select-bordered w-full"
                                value={formData.contract_id}
                                onChange={(e) => handleContractSelect(e.target.value)}
                                required
                            >
                                <option value="">Select a contract</option>
                                {contracts.map(contract => {
                                    const totalServices = contract.packages
                                        ?.reduce((sum, pkg) => sum + (pkg.includedServices?.length || 0), 0) || 0
                                    return (
                                        <option key={contract.contract_id} value={contract.contract_id}>
                                            {contract.client_id} - {totalServices} Services 
                                            {contract.monthly_fee ? ` ($${contract.monthly_fee}/month)` : ''}
                                        </option>
                                    )
                                })}
                            </select>
                        </div>

                        {selectedContract && (
                            <>
                                <div className="form-control w-full">
                                    <label className="label">
                                        <span className="label-text font-medium">Project Name</span>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Enter project name"
                                        className="input input-bordered w-full"
                                        value={formData.name}
                                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                                        required
                                    />
                                </div>

                                <div className="form-control w-full">
                                    <label className="label">
                                        <span className="label-text font-medium">Description</span>
                                    </label>
                                    <textarea
                                        className="textarea textarea-bordered h-24"
                                        placeholder="Enter project description"
                                        value={formData.description}
                                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                                    ></textarea>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                                    <div className="form-control w-full">
                                        <label className="label">
                                            <span className="label-text font-medium">End Date</span>
                                        </label>
                                        <input
                                            type="date"
                                            className="input input-bordered w-full"
                                            value={formData.end_date}
                                            onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="divider">Services & Process Templates</div>

                                {formData.services.map((service) => (
                                    <ProcessTemplateSelector
                                        key={service.service_id}
                                        service={service}
                                        templates={processTemplates}
                                        onSelect={(serviceId, templateId, selectedSteps) => {
                                            setFormData(prev => ({
                                                ...prev,
                                                services: prev.services.map(s => 
                                                    s.service_id === serviceId
                                                        ? { 
                                                            ...s, 
                                                            process_templates: [{
                                                                template_id: templateId,
                                                                selected_steps: selectedSteps
                                                            }]
                                                        }
                                                        : s
                                                )
                                            }))
                                        }}
                                    />
                                ))}

                                <div className="card-actions justify-end mt-6">
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={saving}
                                    >
                                        {saving ? (
                                            <span className="loading loading-spinner"></span>
                                        ) : (
                                            'Create Project'
                                        )}
                                    </button>
                                </div>
                            </>
                        )}
                    </form>
                </div>
            </ContentContainer>
        </DashboardLayout>
    )
} 