import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import PageHeader from '../../components/PageHeader'
import ContentContainer from '../../components/ContentContainer'

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
    }, [])

    const fetchInitialData = async () => {
        try {
            setLoading(true)
            setError(null)

            // Fetch active contracts
            const contractsRes = await fetch('/api/contracts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'fetch' })
            })

            if (!contractsRes.ok) {
                throw new Error('Failed to fetch contracts')
            }

            const contractsData = await contractsRes.json()
            console.log('Fetched contracts:', contractsData)
            setContracts(contractsData)

            // Fetch employees
            const employeesRes = await fetch('/api/employees', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'fetch' })
            })

            if (!employeesRes.ok) {
                throw new Error('Failed to fetch employees')
            }

            const employeesData = await employeesRes.json()
            setEmployees(employeesData)

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
            
            const response = await fetch('/api/contracts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    action: 'fetch_details',
                    contract_id: contractId 
                })
            })

            if (!response.ok) {
                throw new Error('Failed to load contract details')
            }
            
            const contract = await response.json()
            console.log('Contract details:', contract)

            // Store the selected contract
            setSelectedContract(contract)

            // Initialize services from contract packages
            const initialServices = contract.packages.flatMap(pkg => 
                pkg.includedServices.map(service => ({
                    service_id: service.service_id,
                    package_id: pkg.package_id,
                    name: service.name,
                    process_template_id: service.process_template_id,
                    selected_steps: service.selected_steps || [],
                    deliverables: service.deliverables || []
                }))
            )

            // Update form data
            setFormData(prev => ({
                ...prev,
                contract_id: contract.contract_id,
                client_id: contract.client_id,
                services: initialServices,
                start_date: new Date().toISOString().split('T')[0],
                end_date: contract.end_date ? new Date(contract.end_date).toISOString().split('T')[0] : ''
            }))

        } catch (error) {
            console.error('Error loading contract details:', error)
            setError('Failed to load contract details')
            setSelectedContract(null)
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setSaving(true)
        setError(null)

        try {
            // Transform services to include employee assignments
            const servicesWithAssignments = formData.services.map(service => ({
                ...service,
                deliverables: service.deliverables.map((phase, phaseIndex) => ({
                    ...phase,
                    assigned_to: selectedEmployees[`phase_${service.service_id}_${phaseIndex}`],
                    tasks: phase.tasks.map((task, taskIndex) => ({
                        ...task,
                        assigned_to: selectedEmployees[`task_${service.service_id}_${phaseIndex}_${taskIndex}`]
                    }))
                }))
            }))

            const projectData = {
                ...formData,
                services: servicesWithAssignments,
                action: 'create'
            }

            console.log('Creating project with data:', projectData)

            const response = await fetch('/api/projects', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(projectData),
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.message || 'Failed to create project')
            }

            router.push('/projects')
        } catch (error) {
            console.error('Error creating project:', error)
            setError(error.message)
            setSaving(false)
        }
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

    return (
        <DashboardLayout>
            <PageHeader 
                title="New Project" 
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

                        <div className="form-control w-full mb-4">
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
                                {contracts.map(contract => (
                                    <option key={contract.contract_id} value={contract.contract_id}>
                                        {contract.contract_id} - {contract.client_id}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {selectedContract && (
                            <>
                                <div className="form-control w-full mb-4">
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

                                <div className="form-control w-full mb-4">
                                    <label className="label">
                                        <span className="label-text font-medium">Description</span>
                                    </label>
                                    <textarea
                                        className="textarea textarea-bordered h-24"
                                        placeholder="Enter project description"
                                        value={formData.description}
                                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                                        required
                                    ></textarea>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
                                        />
                                    </div>
                                </div>

                                <div className="divider text-lg font-semibold">Contract Services</div>

                                {formData.services.map((service, index) => (
                                    <div key={service.service_id} className="card bg-base-200 p-4 mb-4">
                                        <h3 className="font-medium mb-2">{service.name}</h3>
                                        <div className="space-y-4">
                                            {service.deliverables?.map((phase, phaseIndex) => (
                                                <div key={phaseIndex} className="card bg-base-300 p-4">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <h4 className="font-medium">{phase.phase}</h4>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm">Phase Lead:</span>
                                                            <select 
                                                                className="select select-bordered select-sm"
                                                                value={selectedEmployees[`phase_${service.service_id}_${phaseIndex}`] || ''}
                                                                onChange={(e) => {
                                                                    setSelectedEmployees(prev => ({
                                                                        ...prev,
                                                                        [`phase_${service.service_id}_${phaseIndex}`]: e.target.value
                                                                    }))
                                                                }}
                                                            >
                                                                <option value="">Select Lead</option>
                                                                {employees.map(emp => (
                                                                    <option key={emp.employee_id} value={emp.employee_id}>
                                                                        {emp.name} ({emp.role})
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-3 ml-4">
                                                        {phase.tasks?.map((task, taskIndex) => (
                                                            <div key={taskIndex} className="flex items-center justify-between">
                                                                <div className="text-sm">
                                                                    • {task.name} ({task.estimated_hours}h)
                                                                </div>
                                                                <select 
                                                                    className="select select-bordered select-sm"
                                                                    value={selectedEmployees[`task_${service.service_id}_${phaseIndex}_${taskIndex}`] || ''}
                                                                    onChange={(e) => {
                                                                        setSelectedEmployees(prev => ({
                                                                            ...prev,
                                                                            [`task_${service.service_id}_${phaseIndex}_${taskIndex}`]: e.target.value
                                                                        }))
                                                                    }}
                                                                >
                                                                    <option value="">Assign To</option>
                                                                    {employees.map(emp => (
                                                                        <option key={emp.employee_id} value={emp.employee_id}>
                                                                            {emp.name} ({emp.role}) - {emp.availability_hours || 0}h available
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
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