import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import PageHeader from '../../components/PageHeader'
import ContentContainer from '../../components/ContentContainer'

export default function NewService() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState(null)
    const [processTemplates, setProcessTemplates] = useState([])
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        category: 'digital-marketing',
        service_type: 'recurring',
        billing_type: 'hourly',
        base_price: '',
        minimum_hours: '',
        included_hours: '',
        process_templates: [], // Array of template IDs
    })

    useEffect(() => {
        const user = localStorage.getItem('user')
        if (!user) {
            router.push('/')
            return
        }
        fetchProcessTemplates()
    }, [])

    const fetchProcessTemplates = async () => {
        try {
            const response = await fetch('/api/process-templates')
            if (!response.ok) {
                throw new Error('Failed to fetch process templates')
            }
            const data = await response.json()
            setProcessTemplates(data)
        } catch (error) {
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
            const response = await fetch('/api/services', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            })

            if (response.ok) {
                router.push('/services')
            } else {
                const error = await response.json()
                throw new Error(error.message || 'Failed to create service')
            }
        } catch (error) {
            setError(error.message)
        } finally {
            setSaving(false)
        }
    }

    const handleProcessTemplateSelection = (e) => {
        const selectedOptions = Array.from(e.target.selectedOptions).map(option => option.value)
        setFormData(prev => ({
            ...prev,
            process_templates: selectedOptions
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
                title="Create New Service" 
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
                                <span className="label-text font-medium">Service Name</span>
                            </label>
                            <input
                                type="text"
                                placeholder="Enter service name"
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
                                placeholder="Enter service description"
                                value={formData.description}
                                onChange={(e) => setFormData({...formData, description: e.target.value})}
                            ></textarea>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="form-control w-full">
                                <label className="label">
                                    <span className="label-text font-medium">Category</span>
                                </label>
                                <select
                                    className="select select-bordered w-full"
                                    value={formData.category}
                                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                                    required
                                >
                                    <option value="digital-marketing">Digital Marketing</option>
                                    <option value="web-development">Web Development</option>
                                    <option value="design">Design</option>
                                    <option value="content">Content</option>
                                    <option value="consulting">Consulting</option>
                                </select>
                            </div>

                            <div className="form-control w-full">
                                <label className="label">
                                    <span className="label-text font-medium">Service Type</span>
                                </label>
                                <select
                                    className="select select-bordered w-full"
                                    value={formData.service_type}
                                    onChange={(e) => setFormData({...formData, service_type: e.target.value})}
                                    required
                                >
                                    <option value="recurring">Recurring</option>
                                    <option value="one-time">One-time</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-control w-full">
                            <label className="label">
                                <span className="label-text font-medium">Process Templates</span>
                            </label>
                            <select
                                multiple
                                className="select select-bordered min-h-[200px]"
                                value={formData.process_templates}
                                onChange={handleProcessTemplateSelection}
                            >
                                {processTemplates.map(template => (
                                    <option key={template.template_id} value={template.template_id}>
                                        {template.name}
                                    </option>
                                ))}
                            </select>
                            <label className="label">
                                <span className="label-text-alt">Hold Ctrl/Cmd to select multiple templates</span>
                            </label>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="form-control w-full">
                                <label className="label">
                                    <span className="label-text font-medium">Billing Type</span>
                                </label>
                                <select
                                    className="select select-bordered w-full"
                                    value={formData.billing_type}
                                    onChange={(e) => setFormData({...formData, billing_type: e.target.value})}
                                    required
                                >
                                    <option value="hourly">Hourly</option>
                                    <option value="fixed">Fixed Price</option>
                                    <option value="value">Value Based</option>
                                </select>
                            </div>

                            <div className="form-control w-full">
                                <label className="label">
                                    <span className="label-text font-medium">Base Price</span>
                                </label>
                                <input
                                    type="number"
                                    placeholder="Enter base price"
                                    className="input input-bordered w-full"
                                    value={formData.base_price}
                                    onChange={(e) => setFormData({...formData, base_price: e.target.value})}
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="form-control w-full">
                                <label className="label">
                                    <span className="label-text font-medium">Minimum Hours</span>
                                </label>
                                <input
                                    type="number"
                                    placeholder="Enter minimum hours"
                                    className="input input-bordered w-full"
                                    value={formData.minimum_hours}
                                    onChange={(e) => setFormData({...formData, minimum_hours: e.target.value})}
                                />
                            </div>

                            <div className="form-control w-full">
                                <label className="label">
                                    <span className="label-text font-medium">Included Hours</span>
                                </label>
                                <input
                                    type="number"
                                    placeholder="Enter included hours"
                                    className="input input-bordered w-full"
                                    value={formData.included_hours}
                                    onChange={(e) => setFormData({...formData, included_hours: e.target.value})}
                                />
                            </div>
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