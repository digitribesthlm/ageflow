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
    const [employees, setEmployees] = useState([])
    const [selectedEmployees, setSelectedEmployees] = useState({})
    
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
        fetchEmployees()
    }, [])

    const fetchInitialData = async () => {
        try {
            setLoading(true)
            setError(null)

            const [contractsRes, templatesRes] = await Promise.all([
                fetch('/api/contracts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'fetch' })
                }),
                fetch('/api/process-templates', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'fetch' })
                })
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

            setContracts(contractsData)
            setProcessTemplates(templatesData)
        } catch (error) {
            console.error('Error fetching initial data:', error)
            setError('Failed to load initial data')
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
            
            const response = await fetch('/api/contracts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'fetch', contract_id: contractId })
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.message || 'Error loading contract details')
            }
            
            const contract = await response.json()
            console.log('Contract details:', JSON.stringify(contract, null, 2))

            // Store the selected contract
            setSelectedContract(contract)

            // Debug contract packages
            console.log('Contract packages:', contract.packages)

            // Get all services from the contract's packages with their process templates
            const servicesFromPackages = contract.packages
                ?.flatMap(pkg => {
                    console.log('Processing package:', pkg.name, 'Included services:', pkg.includedServices)
                    return (pkg.includedServices || []).map(service => {
                        console.log('Processing service:', service)
                        return {
                            service_id: service.service_id,
                            name: service.name,
                            description: service.description,
                            process_template_id: service.process_template_id,
                            selected_steps: service.selected_steps || [],
                            package_name: pkg.name,
                            package_id: pkg.package_id,
                            deliverables: service.deliverables || [],
                            estimated_hours: service.estimated_hours,
                            minimum_hours: service.minimum_hours,
                            included_hours: service.included_hours,
                            service_type: service.service_type,
                            billing_type: service.billing_type,
                            base_price: service.base_price,
                            category: service.category
                        }
                    })
                }) || []

            console.log('Services from packages:', JSON.stringify(servicesFromPackages, null, 2))

            if (servicesFromPackages.length === 0) {
                console.warn('No services found in the contract packages')
            }

            // Update form data with enhanced service information
            setFormData(prev => {
                const newFormData = {
                    ...prev,
                    contract_id: contractId,
                    client_id: contract.client_id,
                    services: servicesFromPackages
                }
                console.log('Updated form data:', newFormData)
                return newFormData
            })

        } catch (error) {
            console.error('Error selecting contract:', error)
            setError('Failed to load contract details')
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

    const handleEmployeeAssignment = (taskKey, employeeId) => {
        setSelectedEmployees(prev => ({
            ...prev,
            [taskKey]: employeeId
        }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setSaving(true)
        setError(null)

        // Validate required fields
        if (!formData.name) {
            setError('Project name is required')
            setSaving(false)
            return
        }

        if (!formData.start_date || !formData.end_date) {
            setError('Start date and end date are required')
            setSaving(false)
            return
        }

        if (!formData.contract_id || !formData.client_id) {
            setError('Please select a contract')
            setSaving(false)
            return
        }

        if (!formData.services || formData.services.length === 0) {
            setError('No services selected')
            setSaving(false)
            return
        }

        try {
            const projectData = {
                name: formData.name,
                description: formData.description || '',
                client_id: formData.client_id,
                contract_id: formData.contract_id,
                start_date: formData.start_date,
                end_date: formData.end_date,
                services: formData.services.map(service => ({
                    service_id: service.service_id,
                    name: service.name,
                    category: service.category,
                    process_template_id: service.process_template_id,
                    package_id: service.package_id,
                    package_name: service.package_name,
                    deliverables: (service.deliverables || []).map((phase, phaseIndex) => ({
                        phase_id: `PHASE_${phaseIndex}`,
                        phase: phase.phase,
                        tasks: (phase.tasks || []).map((task, taskIndex) => ({
                            ...task,
                            assigned_to: selectedEmployees[`task_${service.service_id}_${phaseIndex}_${taskIndex}`]
                        })),
                        assigned_to: selectedEmployees[`phase_${service.service_id}_${phaseIndex}`]
                    }))
                })),
                employeeAssignments: selectedEmployees
            }

            console.log('Submitting project data:', JSON.stringify(projectData, null, 2))

            // Create project
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

            const result = await projectResponse.json()
            console.log('Project created:', result)

            router.push('/projects')
        } catch (error) {
            console.error('Error creating project:', error)
            setError(error.message)
        } finally {
            setSaving(false)
        }
    }

    const fetchEmployees = async () => {
        try {
            const response = await fetch('/api/employees', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'fetch' })
            })
            
            if (response.ok) {
                const data = await response.json()
                console.log('Fetched employees:', data)
                setEmployees(data)
            } else {
                console.error('Failed to fetch employees')
            }
        } catch (error) {
            console.error('Error fetching employees:', error)
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

                                {selectedContract && formData.services.length > 0 && (
                                    <div className="space-y-4">
                                        <h2 className="text-xl font-semibold">Services & Process Templates</h2>
                                        {formData.services.map((service, index) => (
                                            <div key={`${service.service_id}-${index}`} className="card bg-base-200 p-4">
                                                <div className="mb-4">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <h3 className="font-medium text-lg">{service.name}</h3>
                                                            <p className="text-sm opacity-70">Package: {service.package_name}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <span className="badge badge-outline">{service.category}</span>
                                                            {service.estimated_hours && (
                                                                <div className="text-sm mt-1">
                                                                    Total: {service.estimated_hours}h
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {service.description && service.description !== '.' && (
                                                        <p className="text-sm mt-2">{service.description}</p>
                                                    )}
                                                </div>

                                                {/* Display Deliverables */}
                                                {service.deliverables && service.deliverables.length > 0 && (
                                                    <div className="mb-4">
                                                        <h4 className="font-medium mb-2">Phase & Task Assignment</h4>
                                                        {service.deliverables.map((phase, phaseIndex) => (
                                                            <div key={phaseIndex} className="card bg-base-100 p-4 mb-2">
                                                                <h5 className="font-medium mb-2 flex items-center justify-between">
                                                                    <span>{phase.phase}</span>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-sm">Phase Lead:</span>
                                                                        <select 
                                                                            className="select select-bordered select-sm"
                                                                            value={selectedEmployees[`phase_${service.service_id}_${phaseIndex}`] || ''}
                                                                            onChange={(e) => handleEmployeeAssignment(`phase_${service.service_id}_${phaseIndex}`, e.target.value)}
                                                                        >
                                                                            <option value="">Select Lead</option>
                                                                            {employees
                                                                                .filter(emp => {
                                                                                    console.log('Filtering employee:', emp.name, 'Skills:', emp.skills, 'Service category:', service.category)
                                                                                    return emp.skills?.some(skill => 
                                                                                        skill.toLowerCase().includes(service.category.toLowerCase()) ||
                                                                                        service.category.toLowerCase().includes(skill.toLowerCase())
                                                                                    ) || emp.role.toLowerCase().includes(service.category.toLowerCase())
                                                                                })
                                                                                .map(emp => (
                                                                                    <option key={emp.employee_id} value={emp.employee_id}>
                                                                                        {emp.name} ({emp.role})
                                                                                    </option>
                                                                                ))
                                                                            }
                                                                        </select>
                                                                    </div>
                                                                </h5>
                                                                <div className="space-y-2 ml-4">
                                                                    {phase.tasks.map((task, taskIndex) => (
                                                                        <div key={taskIndex}>
                                                                            <div className="flex items-center justify-between gap-2">
                                                                                <div>
                                                                                    <span className="font-medium">{task.name}</span>
                                                                                    {task.estimated_hours && (
                                                                                        <span className="text-sm opacity-70 ml-2">
                                                                                            ({task.estimated_hours}h)
                                                                                        </span>
                                                                                    )}
                                                                                </div>
                                                                                <select 
                                                                                    className="select select-bordered select-sm"
                                                                                    value={selectedEmployees[`task_${service.service_id}_${phaseIndex}_${taskIndex}`] || ''}
                                                                                    onChange={(e) => handleEmployeeAssignment(`task_${service.service_id}_${phaseIndex}_${taskIndex}`, e.target.value)}
                                                                                >
                                                                                    <option value="">Assign To</option>
                                                                                    {employees
                                                                                        .filter(emp => {
                                                                                            console.log('Filtering employee for task:', emp.name, 'Skills:', emp.skills, 'Service category:', service.category)
                                                                                            return emp.skills?.some(skill => 
                                                                                                skill.toLowerCase().includes(service.category.toLowerCase()) ||
                                                                                                service.category.toLowerCase().includes(skill.toLowerCase())
                                                                                            ) || emp.role.toLowerCase().includes(service.category.toLowerCase())
                                                                                        })
                                                                                        .map(emp => (
                                                                                            <option key={emp.employee_id} value={emp.employee_id}>
                                                                                                {emp.name} ({emp.role}) - {emp.availability_hours}h available
                                                                                            </option>
                                                                                        ))
                                                                                    }
                                                                                </select>
                                                                            </div>
                                                                            {/* ... existing task details ... */}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Process Template Selector */}
                                                {service.process_template_id && (
                                                    <ProcessTemplateSelector
                                                        service={service}
                                                        templates={processTemplates.filter(t => t.service_id === service.service_id)}
                                                        onSelect={(serviceId, templateId, selectedSteps) => {
                                                            const updatedServices = [...formData.services]
                                                            const serviceIndex = updatedServices.findIndex(s => 
                                                                s.service_id === serviceId && 
                                                                s.package_id === service.package_id
                                                            )
                                                            if (serviceIndex !== -1) {
                                                                updatedServices[serviceIndex] = {
                                                                    ...updatedServices[serviceIndex],
                                                                    process_template_id: templateId,
                                                                    selected_steps: selectedSteps
                                                                }
                                                                setFormData(prev => ({
                                                                    ...prev,
                                                                    services: updatedServices
                                                                }))
                                                            }
                                                        }}
                                                    />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}

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