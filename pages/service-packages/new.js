import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import PageHeader from '../../components/PageHeader'
import ContentContainer from '../../components/ContentContainer'

export default function NewServicePackage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [services, setServices] = useState([])
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        tier: 'small',
        package_type: 'retainer',
        includedServices: [], // Array of {service_id, quantity}
        basePrice: '',
        billing_frequency: 'monthly',
        minimum_contract_months: 6
    })

    useEffect(() => {
        fetchServices()
    }, [])

    const fetchServices = async () => {
        try {
            const response = await fetch('/api/services', {
                credentials: 'include',  // Include cookies in the request
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            if (response.ok) {
                const data = await response.json()
                setServices(data)
            } else {
                const errorData = await response.json()
                setError(errorData.message || 'Failed to fetch services')
            }
        } catch (error) {
            setError('Error fetching services: ' + error.message)
        }
    }

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
    }

    const handleServiceSelection = (e) => {
        const selectedServices = Array.from(e.target.selectedOptions).map(option => ({
            service_id: option.value,
            name: option.text,
            quantity: 1
        }))
        setFormData(prev => ({
            ...prev,
            includedServices: selectedServices
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

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            const response = await fetch('/api/service-packages', {
                method: 'POST',
                credentials: 'include',  // Include cookies in the request
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            })

            if (response.ok) {
                router.push('/service-packages')
            } else {
                const data = await response.json()
                setError(data.message || 'Failed to create service package')
            }
        } catch (error) {
            setError('Error creating service package: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <DashboardLayout>
            <PageHeader title="Create Service Package" />
            <ContentContainer>
                <div className="max-w-4xl mx-auto">
                    <form onSubmit={handleSubmit} className="space-y-6 bg-base-100 p-6 rounded-lg shadow-lg">
                        {error && (
                            <div className="alert alert-error">
                                <span>{error}</span>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Package Name</span>
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
                                    <span className="label-text">Package Type</span>
                                </label>
                                <select
                                    name="package_type"
                                    value={formData.package_type}
                                    onChange={handleChange}
                                    className="select select-bordered"
                                    required
                                >
                                    <option value="retainer">Retainer</option>
                                    <option value="project">Project</option>
                                    <option value="one-time">One-time</option>
                                </select>
                            </div>

                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Tier</span>
                                </label>
                                <select
                                    name="tier"
                                    value={formData.tier}
                                    onChange={handleChange}
                                    className="select select-bordered"
                                    required
                                >
                                    <option value="small">Small</option>
                                    <option value="medium">Medium</option>
                                    <option value="large">Large</option>
                                    <option value="enterprise">Enterprise</option>
                                </select>
                            </div>

                            <div className="form-control md:col-span-2">
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
                        </div>

                        <div className="space-y-4">
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Services</span>
                                </label>
                                <select
                                    multiple
                                    onChange={handleServiceSelection}
                                    className="select select-bordered min-h-[200px]"
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
                                <div className="space-y-4">
                                    <h3 className="font-medium">Service Quantities</h3>
                                    {formData.includedServices.map((service) => (
                                        <div key={service.service_id} className="card bg-base-200">
                                            <div className="card-body">
                                                <div className="flex items-center justify-between">
                                                    <h4 className="font-medium">{service.name}</h4>
                                                    <div className="form-control w-32">
                                                        <label className="label">
                                                            <span className="label-text">Quantity</span>
                                                        </label>
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            value={service.quantity}
                                                            onChange={(e) => updateServiceQuantity(service.service_id, e.target.value)}
                                                            className="input input-bordered w-full"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Base Price</span>
                                </label>
                                <input
                                    type="number"
                                    name="basePrice"
                                    value={formData.basePrice}
                                    onChange={handleChange}
                                    className="input input-bordered"
                                    required
                                    min="0"
                                />
                            </div>

                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Billing Frequency</span>
                                </label>
                                <select
                                    name="billing_frequency"
                                    value={formData.billing_frequency}
                                    onChange={handleChange}
                                    className="select select-bordered"
                                    required
                                >
                                    <option value="monthly">Monthly</option>
                                    <option value="quarterly">Quarterly</option>
                                    <option value="semi-annual">Semi-Annual</option>
                                    <option value="annual">Annual</option>
                                </select>
                            </div>

                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Minimum Contract Months</span>
                                </label>
                                <input
                                    type="number"
                                    name="minimum_contract_months"
                                    value={formData.minimum_contract_months}
                                    onChange={handleChange}
                                    className="input input-bordered"
                                    required
                                    min="1"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-4">
                            <button
                                type="button"
                                onClick={() => router.back()}
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
