import { useState, useEffect } from 'react'
import Link from 'next/link'
import DashboardLayout from '../../components/DashboardLayout'
import PageHeader from '../../components/PageHeader'
import ContentContainer from '../../components/ContentContainer'

export default function ServicePackages() {
    const [packages, setPackages] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        console.log('ServicePackages component mounted')
        fetchPackages()
    }, [])

    const fetchPackages = async () => {
        try {
            console.log('Fetching packages...')
            const response = await fetch('/api/service-packages')
            console.log('Response status:', response.status)
            
            if (response.ok) {
                const data = await response.json()
                console.log('Fetched packages:', data)
                setPackages(data || [])
            } else {
                const errorData = await response.json()
                console.error('Failed to fetch packages:', errorData)
                setError(errorData.message || 'Failed to fetch packages')
            }
        } catch (error) {
            console.error('Error fetching packages:', error)
            setError('Error fetching packages: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    const formatPrice = (price) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(price)
    }

    const getBadgeColor = (tier) => {
        switch (tier?.toLowerCase()) {
            case 'basic':
                return 'badge-primary'
            case 'standard':
                return 'badge-secondary'
            case 'premium':
                return 'badge-accent'
            case 'enterprise':
                return 'badge-neutral'
            default:
                return 'badge-ghost'
        }
    }

    console.log('Rendering ServicePackages. Loading:', loading, 'Error:', error, 'Packages:', packages)

    return (
        <DashboardLayout>
            <PageHeader 
                title="Service Packages" 
                actions={
                    <Link href="/service-packages/new" className="btn btn-primary">
                        Create Package
                    </Link>
                }
            />
            <ContentContainer>
                {error && (
                    <div className="alert alert-error mb-4">
                        <span>{error}</span>
                    </div>
                )}

                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <span className="loading loading-spinner loading-lg"></span>
                    </div>
                ) : packages.length === 0 ? (
                    <div className="text-center p-8">
                        <h3 className="text-xl font-semibold mb-4">No Service Packages Yet</h3>
                        <p className="mb-6">Start by creating your first service package</p>
                        <Link href="/service-packages/new" className="btn btn-primary">
                            Create Package
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {packages.map((pkg) => (
                            <div key={pkg.package_id} className="card bg-base-100 shadow-xl">
                                <div className="card-body">
                                    <div className="flex justify-between items-start">
                                        <h2 className="card-title">{pkg.name}</h2>
                                        <div className={`badge ${getBadgeColor(pkg.tier)}`}>
                                            {pkg.tier || 'Standard'}
                                        </div>
                                    </div>
                                    
                                    <p className="text-sm text-base-content/70 mt-2">
                                        {pkg.description || 'No description provided'}
                                    </p>

                                    <div className="divider"></div>

                                    <div className="space-y-4">
                                        <h3 className="font-medium">Included Services</h3>
                                        <div className="space-y-2">
                                            {pkg.includedServices?.map((service) => (
                                                <div 
                                                    key={service.service_id} 
                                                    className="bg-base-200 p-3 rounded-lg"
                                                >
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <h4 className="font-medium">
                                                                {service.name}
                                                            </h4>
                                                        </div>
                                                        {service.quantity > 1 && (
                                                            <span className="badge">
                                                                x{service.quantity}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="divider"></div>

                                    <div className="flex justify-between items-center">
                                        <div>
                                            <div className="font-medium">
                                                {formatPrice(pkg.basePrice)}
                                            </div>
                                            <div className="text-sm text-base-content/70">
                                                per {pkg.billing_frequency}
                                            </div>
                                        </div>
                                        <Link 
                                            href={`/service-packages/${pkg.package_id}/edit`}
                                            className="btn btn-sm"
                                        >
                                            Edit
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </ContentContainer>
        </DashboardLayout>
    )
}
