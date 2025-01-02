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
        deliverables: '',
        process_template_id: '', // Added process template field
        base_price: '',
        minimum_hours: '',
        included_hours: ''
    })

    useEffect(() => {
        fetchProcessTemplates()
    }, [])

    const fetchProcessTemplates = async () => {
        try {
            const response = await fetch('/api/process-templates')
            if (!response.ok) throw new Error('Failed to fetch process templates')
            const data = await response.json()
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

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            const response = await fetch('/api/services', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            })

            if (!response.ok) {
                throw new Error('Failed to create service')
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
                                            onChange={handleChange}
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
                                            <span className="label-text-alt">This template will be used when creating projects for this service</span>
                                        </label>
                                    </div>

                                    {formData.process_template_id && (
                                        <div className="bg-base-200 p-4 rounded-lg">
                                            <h3 className="font-medium mb-2">Template Details</h3>
                                            {processTemplates.find(t => t.template_id === formData.process_template_id)?.steps?.map((step, index) => (
                                                <div key={index} className="text-sm text-base-content/70">
                                                    {index + 1}. {step.name}
                                                </div>
                                            ))}
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
                                            <span className="label-text">Deliverables</span>
                                        </label>
                                        <textarea
                                            name="deliverables"
                                            value={formData.deliverables}
                                            onChange={handleChange}
                                            className="textarea textarea-bordered h-24"
                                            placeholder="Enter each deliverable on a new line"
                                            required
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