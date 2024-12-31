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
        fetchPackages()
    }, [])

    const fetchPackages = async () => {
        try {
            const response = await fetch('/api/service-packages', {
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            if (response.ok) {
                const data = await response.json()
                setPackages(data)
            } else {
                const errorData = await response.json()
                setError(errorData.message || 'Failed to fetch packages')
            }
        } catch (error) {
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

    return (
        <DashboardLayout>
            <PageHeader 
                title="Service Packages" 
                action={
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
                                            {pkg.services?.map((service) => (
                                                <div 
                                                    key={service.service_id} 
                                                    className="bg-base-200 p-3 rounded-lg"
                                                >
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <h4 className="font-medium">
                                                                {service.name}
                                                            </h4>
                                                            {service.customizations?.notes && (
                                                                <p className="text-sm text-base-content/70 mt-1">
                                                                    {service.customizations.notes}
                                                                </p>
                                                            )}
                                                        </div>
                                                        {service.quantity > 1 && (
                                                            <span className="badge">
                                                                x{service.quantity}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {service.customizations?.hours && (
                                                        <div className="mt-2 text-sm">
                                                            <span className="text-base-content/70">
                                                                Hours: {service.customizations.hours}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="divider"></div>

                                    <div className="flex justify-between items-center">
                                        <div>
                                            <div className="font-medium">
                                                {formatPrice(pkg.price)}
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
