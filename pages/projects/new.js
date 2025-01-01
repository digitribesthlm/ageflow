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
            console.log('Fetched templates:', templatesData)

            setContracts(contractsData)
            setProcessTemplates(templatesData)
        } catch (error) {
            setError(error.message)
        } finally {
            setLoading(false)
        }
    }

    const handleContractSelect = async (contractId) => {
        try {
            const contract = contracts.find(c => c.contract_id === contractId)
            if (!contract) {
                console.error('Contract not found:', contractId)
                return
            }

            console.log('Selected contract:', JSON.stringify(contract, null, 2))
            setSelectedContract(contract)
            
            let services = []
            
            // Handle old format (single package_id)
            if (contract.package_id) {
                console.log('Fetching package details for legacy contract:', contract.package_id)
                const packageResponse = await fetch(`/api/service-packages/${contract.package_id}`)
                
                if (!packageResponse.ok) {
                    const errorText = await packageResponse.text()
                    console.error('Package fetch failed:', {
                        status: packageResponse.status,
                        statusText: packageResponse.statusText,
                        error: errorText,
                        packageId: contract.package_id
                    })
                    throw new Error(`Failed to fetch package details: ${packageResponse.status}`)
                }
                
                const packageData = await packageResponse.json()
                console.log('Package details:', JSON.stringify(packageData, null, 2))
                
                if (!packageData.includedServices || !Array.isArray(packageData.includedServices)) {
                    console.error('Invalid package data - missing or invalid includedServices array:', packageData)
                    throw new Error('Package data is missing services information')
                }
                
                // Fetch full service details for each included service
                const serviceIds = packageData.includedServices.map(s => s.service_id)
                const servicesResponse = await fetch(`/api/services?ids=${serviceIds.join(',')}`)
                if (!servicesResponse.ok) {
                    throw new Error('Failed to fetch service details')
                }
                const servicesData = await servicesResponse.json()
                
                services = packageData.includedServices.map(included => {
                    const serviceDetails = servicesData.find(s => s.service_id === included.service_id)
                    return {
                        service_id: included.service_id,
                        package_id: contract.package_id,
                        process_templates: [],
                        name: serviceDetails?.name || 'Unknown Service',
                        quantity: included.quantity || 1
                    }
                })
            }
            // Handle new format (packages array)
            else if (contract.packages && contract.packages.length > 0) {
                console.log('Contract packages:', JSON.stringify(contract.packages, null, 2))
                services = contract.packages.flatMap(pkg => {
                    if (!pkg.includedServices || !Array.isArray(pkg.includedServices)) {
                        console.error('Package missing includedServices array:', pkg)
                        return []
                    }
                    return pkg.includedServices.map(included => ({
                        service_id: included.service_id,
                        package_id: pkg.package_id,
                        process_templates: [],
                        name: included.name || 'Unknown Service',
                        quantity: included.quantity || 1
                    }))
                })
            } else {
                throw new Error('Contract has no package information')
            }
            
            console.log('Extracted services:', JSON.stringify(services, null, 2))
            console.log('Available process templates:', JSON.stringify(processTemplates, null, 2))
            
            // Log matching templates for each service
            services.forEach(service => {
                const matchingTemplates = processTemplates.filter(t => t.service_id === service.service_id)
                console.log(`Matching templates for service ${service.service_id}:`, matchingTemplates)
            })
            
            // Convert dates - handle both MongoDB format and regular dates
            const startDate = contract.start_date?.$date 
                ? new Date(parseInt(contract.start_date.$date.$numberLong)).toISOString().split('T')[0]
                : new Date(contract.start_date).toISOString().split('T')[0]
            
            const endDate = contract.end_date?.$date 
                ? new Date(parseInt(contract.end_date.$date.$numberLong)).toISOString().split('T')[0]
                : contract.end_date ? new Date(contract.end_date).toISOString().split('T')[0] : ''
            
            // Update form with contract data
            setFormData(prev => ({
                ...prev,
                contract_id: contract.contract_id,
                client_id: contract.client_id,
                name: `${contract.client_id} Project - ${new Date().toLocaleDateString()}`,
                services,
                total_budget: contract.monthly_fee?.$numberInt || contract.monthly_fee || 0,
                start_date: startDate,
                end_date: endDate
            }))
        } catch (error) {
            console.error('Error loading contract details:', error)
            setError(error.message || 'Error loading contract details')
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
            // Create phases from selected process templates
            const phases = []
            formData.services.forEach(service => {
                service.process_templates.forEach(templateId => {
                    const template = processTemplates.find(t => t.template_id === templateId)
                    if (template) {
                        phases.push({
                            name: template.name,
                            service_id: service.service_id,
                            template_id: template.template_id,
                            status: 'pending',
                            steps: template.steps.map(step => ({
                                ...step,
                                status: 'pending'
                            }))
                        })
                    }
                })
            })

            const projectData = {
                ...formData,
                phases,
                created_at: new Date(),
                updated_at: new Date()
            }

            const response = await fetch('/api/projects', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(projectData),
            })

            if (response.ok) {
                router.push('/projects')
            } else {
                const error = await response.json()
                throw new Error(error.message || 'Failed to create project')
            }
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
                                {contracts.map(contract => (
                                    <option key={contract.contract_id} value={contract.contract_id}>
                                        {contract.client_id} - Package {contract.package_id} (${contract.monthly_fee}/month)
                                    </option>
                                ))}
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
                                    <div key={service.service_id} className="card bg-base-200 p-4 mb-4">
                                        <h3 className="font-medium mb-2">{service.name}</h3>
                                        
                                        <div className="form-control w-full">
                                            <label className="label">
                                                <span className="label-text">Select Process Templates</span>
                                            </label>
                                            <select
                                                multiple
                                                className="select select-bordered min-h-[100px]"
                                                value={service.process_templates}
                                                onChange={(e) => {
                                                    const selectedOptions = Array.from(e.target.selectedOptions).map(opt => opt.value)
                                                    handleProcessTemplateSelect(service.service_id, selectedOptions)
                                                }}
                                            >
                                                {processTemplates
                                                    .filter(template => template.service_id === service.service_id)
                                                    .map(template => (
                                                        <option key={template.template_id} value={template.template_id}>
                                                            {template.name} (v{template.version})
                                                        </option>
                                                    ))
                                                }
                                            </select>
                                            <label className="label">
                                                <span className="label-text-alt">Hold Ctrl/Cmd to select multiple templates</span>
                                            </label>
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