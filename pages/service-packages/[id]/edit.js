import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import DashboardLayout from '../../../components/DashboardLayout'
import PageHeader from '../../../components/PageHeader'
import ContentContainer from '../../../components/ContentContainer'

export default function EditServicePackage() {
    const router = useRouter()
    const { id } = router.query
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState(null)
    const [services, setServices] = useState([])
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        tier: 'standard',
        services: [], // Array of {service_id, quantity, customizations}
        price: '',
        billing_frequency: 'monthly'
    })

    useEffect(() => {
        if (id) {
            Promise.all([
                fetchPackage(),
                fetchServices()
            ])
        }
    }, [id])

    const fetchPackage = async () => {
        try {
            const response = await fetch(`/api/service-packages/${id}`, {
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            if (response.ok) {
                const data = await response.json()
                setFormData(data)
            } else {
                const errorData = await response.json()
                setError(errorData.message || 'Failed to fetch package')
            }
        } catch (error) {
            setError('Error fetching package: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    const fetchServices = async () => {
        try {
            const response = await fetch('/api/services', {
                credentials: 'include',
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
        const selectedServices = Array.from(e.target.selectedOptions).map(option => {
            // Check if service was already selected to keep existing customizations
            const existingService = formData.services.find(s => s.service_id === option.value)
            return existingService || {
                service_id: option.value,
                name: option.text,
                quantity: 1,
                customizations: {}
            }
        })
        setFormData(prev => ({
            ...prev,
            services: selectedServices
        }))
    }

    const updateServiceQuantity = (serviceId, quantity) => {
        setFormData(prev => ({
            ...prev,
            services: prev.services.map(service => 
                service.service_id === serviceId 
                    ? { ...service, quantity: parseInt(quantity) || 1 }
                    : service
            )
        }))
    }

    const updateServiceCustomization = (serviceId, field, value) => {
        setFormData(prev => ({
            ...prev,
            services: prev.services.map(service => 
                service.service_id === serviceId 
                    ? { 
                        ...service, 
                        customizations: { 
                            ...service.customizations, 
                            [field]: value 
                        } 
                    }
                    : service
            )
        }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setSaving(true)
        setError(null)

        try {
            const response = await fetch(`/api/service-packages/${id}`, {
                method: 'PUT',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            })

            if (response.ok) {
                router.push('/service-packages')
            } else {
                const data = await response.json()
                setError(data.message || 'Failed to update service package')
            }
        } catch (error) {
            setError('Error updating service package: ' + error.message)
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex justify-center items-center h-64">
                    <span className="loading loading-spinner loading-lg"></span>
                </div>
            </DashboardLayout>
        )
    }

    return (
        <DashboardLayout>
            <PageHeader title="Edit Service Package" />
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
                                    <span className="label-text">Tier</span>
                                </label>
                                <select
                                    name="tier"
                                    value={formData.tier}
                                    onChange={handleChange}
                                    className="select select-bordered"
                                    required
                                >
                                    <option value="basic">Basic</option>
                                    <option value="standard">Standard</option>
                                    <option value="premium">Premium</option>
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
                                    value={formData.services.map(s => s.service_id)}
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

                            {formData.services.length > 0 && (
                                <div className="space-y-4">
                                    <h3 className="font-medium">Service Configuration</h3>
                                    {formData.services.map((service) => (
                                        <div key={service.service_id} className="card bg-base-200">
                                            <div className="card-body">
                                                <h4 className="font-medium">{service.name}</h4>
                                                
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="form-control">
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

                                                    <div className="form-control">
                                                        <label className="label">
                                                            <span className="label-text">Custom Hours</span>
                                                        </label>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            step="0.5"
                                                            value={service.customizations?.hours || ''}
                                                            onChange={(e) => updateServiceCustomization(service.service_id, 'hours', e.target.value)}
                                                            className="input input-bordered w-full"
                                                        />
                                                    </div>

                                                    <div className="form-control md:col-span-2">
                                                        <label className="label">
                                                            <span className="label-text">Custom Notes</span>
                                                        </label>
                                                        <textarea
                                                            value={service.customizations?.notes || ''}
                                                            onChange={(e) => updateServiceCustomization(service.service_id, 'notes', e.target.value)}
                                                            className="textarea textarea-bordered"
                                                            placeholder="Any special requirements or modifications"
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
                                    <span className="label-text">Price</span>
                                </label>
                                <input
                                    type="number"
                                    name="price"
                                    value={formData.price}
                                    onChange={handleChange}
                                    className="input input-bordered"
                                    required
                                    min="0"
                                    step="0.01"
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
                                disabled={saving}
                            >
                                {saving ? (
                                    <span className="loading loading-spinner loading-sm"></span>
                                ) : (
                                    'Save Changes'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </ContentContainer>
        </DashboardLayout>
    )
}
