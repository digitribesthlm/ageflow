import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import PageHeader from '../../components/PageHeader'
import ContentContainer from '../../components/ContentContainer'

export default function NewServicePackage() {
    console.log('NewServicePackage component mounted')
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState(null)
    const [services, setServices] = useState([])
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        includedServices: [],
        basePrice: '',
        billing_frequency: 'monthly',
        package_type: 'retainer',
        tier: 'small',
        minimum_contract_months: 6
    })

    useEffect(() => {
        console.log('NewServicePackage useEffect running')
        const user = localStorage.getItem('user')
        if (!user) {
            console.log('No user found, redirecting to login')
            router.push('/')
            return
        }
        fetchServices()
    }, [])

    const fetchServices = async () => {
        try {
            console.log('Fetching services...')
            const response = await fetch('/api/services')
            console.log('Services response status:', response.status)
            
            if (!response.ok) {
                throw new Error('Failed to fetch services')
            }
            const data = await response.json()
            console.log('Fetched services:', data)
            setServices(data)
        } catch (error) {
            console.error('Error fetching services:', error)
            setError(error.message)
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setSaving(true)
        setError(null)

        try {
            const response = await fetch('/api/service-packages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            })

            if (response.ok) {
                router.push('/service-packages')
            } else {
                const errorData = await response.json()
                if (errorData.missingServices) {
                    const missingServiceNames = errorData.missingServices.map(id => {
                        const service = services.find(s => s.service_id === id)
                        return service ? service.name : id
                    }).join(', ')
                    throw new Error(`The following services are not available: ${missingServiceNames}`)
                }
                throw new Error(errorData.message || 'Failed to create service package')
            }
        } catch (error) {
            setError(error.message)
            setSaving(false)
        }
    }

    const handleServiceSelection = (e) => {
        const selectedOptions = Array.from(e.target.selectedOptions).map(option => {
            const existingService = formData.includedServices.find(s => s.service_id === option.value)
            return {
                service_id: option.value,
                quantity: existingService?.quantity || 1
            }
        })
        setFormData(prev => ({
            ...prev,
            includedServices: selectedOptions
        }))
    }

    const updateServiceQuantity = (serviceId, quantity) => {
        setFormData(prev => ({
            ...prev,
            includedServices: prev.includedServices.map(service => 
                service.service_id === serviceId 
                    ? { ...service, quantity: parseInt(quantity) || 1 }
                    : service
            )
        }))
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
                title="Create Service Package"
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
                                <span className="label-text font-medium">Package Name</span>
                            </label>
                            <input
                                type="text"
                                placeholder="Enter package name"
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
                                placeholder="Enter package description"
                                value={formData.description}
                                onChange={(e) => setFormData({...formData, description: e.target.value})}
                            ></textarea>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="form-control w-full">
                                <label className="label">
                                    <span className="label-text font-medium">Package Type</span>
                                </label>
                                <select
                                    className="select select-bordered w-full"
                                    value={formData.package_type}
                                    onChange={(e) => setFormData({...formData, package_type: e.target.value})}
                                    required
                                >
                                    <option value="retainer">Retainer</option>
                                    <option value="project">Project</option>
                                </select>
                            </div>

                            <div className="form-control w-full">
                                <label className="label">
                                    <span className="label-text font-medium">Tier</span>
                                </label>
                                <select
                                    className="select select-bordered w-full"
                                    value={formData.tier}
                                    onChange={(e) => setFormData({...formData, tier: e.target.value})}
                                    required
                                >
                                    <option value="small">Small</option>
                                    <option value="medium">Medium</option>
                                    <option value="large">Large</option>
                                    <option value="enterprise">Enterprise</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-control w-full">
                            <label className="label">
                                <span className="label-text font-medium">Included Services</span>
                            </label>
                            <select
                                multiple
                                className="select select-bordered min-h-[200px]"
                                value={formData.includedServices.map(s => s.service_id)}
                                onChange={handleServiceSelection}
                                required
                            >
                                {services.map(service => (
                                    <option key={service.service_id} value={service.service_id}>
                                        {service.name}
                                    </option>
                                ))}
                            </select>
                            <label className="label">
                                <span className="label-text-alt">Hold Ctrl/Cmd to select multiple services</span>
                            </label>
                        </div>

                        {formData.includedServices.length > 0 && (
                            <div className="form-control w-full">
                                <label className="label">
                                    <span className="label-text font-medium">Service Quantities</span>
                                </label>
                                <div className="space-y-2">
                                    {formData.includedServices.map((service) => {
                                        const serviceDetails = services.find(s => s.service_id === service.service_id)
                                        return (
                                            <div key={service.service_id} className="flex items-center gap-4">
                                                <span className="flex-grow">{serviceDetails?.name || 'Unknown Service'}</span>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={service.quantity}
                                                    onChange={(e) => updateServiceQuantity(service.service_id, e.target.value)}
                                                    className="input input-bordered w-24"
                                                />
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="form-control w-full">
                                <label className="label">
                                    <span className="label-text font-medium">Base Price</span>
                                </label>
                                <input
                                    type="number"
                                    placeholder="Enter base price"
                                    className="input input-bordered w-full"
                                    value={formData.basePrice}
                                    onChange={(e) => setFormData({...formData, basePrice: e.target.value})}
                                    required
                                />
                            </div>

                            <div className="form-control w-full">
                                <label className="label">
                                    <span className="label-text font-medium">Billing Frequency</span>
                                </label>
                                <select
                                    className="select select-bordered w-full"
                                    value={formData.billing_frequency}
                                    onChange={(e) => setFormData({...formData, billing_frequency: e.target.value})}
                                    required
                                >
                                    <option value="monthly">Monthly</option>
                                    <option value="quarterly">Quarterly</option>
                                    <option value="yearly">Yearly</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-control w-full">
                            <label className="label">
                                <span className="label-text font-medium">Minimum Contract Months</span>
                            </label>
                            <input
                                type="number"
                                placeholder="Enter minimum contract months"
                                className="input input-bordered w-full"
                                value={formData.minimum_contract_months}
                                onChange={(e) => setFormData({...formData, minimum_contract_months: e.target.value})}
                                required
                            />
                        </div>

                        <div className="card-actions justify-end mt-6">
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={saving}
                            >
                                {saving ? (
                                    <span className="loading loading-spinner"></span>
                                ) : (
                                    'Create Package'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </ContentContainer>
        </DashboardLayout>
    )
}
