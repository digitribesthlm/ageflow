import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import PageHeader from '../../components/PageHeader'
import ContentContainer from '../../components/ContentContainer'

export default function ContractDetails() {
    const router = useRouter()
    const { id } = router.query
    const [contract, setContract] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        if (id) {
            fetchContractDetails()
        }
    }, [id])

    const fetchContractDetails = async () => {
        try {
            const response = await fetch(`/api/contracts/${id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ action: 'fetch_details' })
            })

            if (response.ok) {
                const data = await response.json()
                console.log('Contract details:', data)
                setContract(data)
            } else {
                const errorData = await response.json()
                setError(errorData.message || 'Failed to fetch contract details')
            }
        } catch (error) {
            console.error('Error fetching contract details:', error)
            setError('Error fetching contract details')
        } finally {
            setLoading(false)
        }
    }

    const renderContent = () => {
        if (loading) {
            return (
                <div className="flex justify-center items-center min-h-[200px]">
                    <span className="loading loading-spinner loading-lg"></span>
                </div>
            )
        }

        if (error) {
            return (
                <div className="alert alert-error">
                    <span>{error}</span>
                </div>
            )
        }

        if (!contract) {
            return (
                <div className="alert alert-warning">
                    <span>Contract not found</span>
                </div>
            )
        }

        return (
            <div className="space-y-6">
                {/* Contract Overview */}
                <div className="card bg-base-100 shadow-xl">
                    <div className="card-body">
                        <h2 className="card-title text-2xl">Contract Details</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <div>
                                <p className="text-sm opacity-70">Contract ID</p>
                                <p>{contract.contract_id}</p>
                            </div>
                            <div>
                                <p className="text-sm opacity-70">Client ID</p>
                                <p>{contract.client_id}</p>
                            </div>
                            <div>
                                <p className="text-sm opacity-70">Status</p>
                                <div className={`badge ${
                                    contract.status === 'active' ? 'badge-success' : 
                                    contract.status === 'pending' ? 'badge-warning' : 
                                    'badge-error'
                                } badge-lg`}>
                                    {contract.status}
                                </div>
                            </div>
                            <div>
                                <p className="text-sm opacity-70">Monthly Fee</p>
                                <p>{new Intl.NumberFormat('en-US', {
                                    style: 'currency',
                                    currency: 'USD'
                                }).format(contract.monthly_fee)}</p>
                            </div>
                            <div>
                                <p className="text-sm opacity-70">Start Date</p>
                                <p>{new Date(contract.start_date).toLocaleDateString()}</p>
                            </div>
                            <div>
                                <p className="text-sm opacity-70">End Date</p>
                                <p>{new Date(contract.end_date).toLocaleDateString()}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Packages & Services */}
                <div className="space-y-4">
                    <h3 className="text-xl font-semibold">Packages & Services</h3>
                    {contract.packages.map((pkg, index) => (
                        <div key={pkg.package_id} className="card bg-base-100 shadow-xl">
                            <div className="card-body">
                                <h4 className="card-title">
                                    {pkg.name}
                                    <div className="badge badge-secondary badge-lg">
                                        Quantity: {pkg.quantity}
                                    </div>
                                </h4>
                                {pkg.description && (
                                    <p className="text-sm opacity-70">{pkg.description}</p>
                                )}

                                {/* Included Services */}
                                <div className="mt-4">
                                    <h5 className="font-medium mb-2">Included Services</h5>
                                    <div className="space-y-4">
                                        {pkg.includedServices.map((service, serviceIndex) => (
                                            <div key={serviceIndex} className="card bg-base-200">
                                                <div className="card-body">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <h6 className="font-medium">{service.name}</h6>
                                                            {service.description && (
                                                                <p className="text-sm opacity-70 mt-1">{service.description}</p>
                                                            )}
                                                            <div className="mt-2">
                                                                <span className="text-sm font-medium">Category: </span>
                                                                <span className="badge badge-info">{service.category}</span>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-sm">
                                                                {service.included_hours}h included
                                                            </div>
                                                            {service.minimum_hours && (
                                                                <div className="text-xs opacity-70">
                                                                    (min. {service.minimum_hours}h)
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <DashboardLayout>
            <PageHeader 
                title="Contract Details"
                actions={
                    <button
                        onClick={() => router.back()}
                        className="btn btn-ghost"
                    >
                        Back
                    </button>
                }
            />
            <ContentContainer>
                {renderContent()}
            </ContentContainer>
        </DashboardLayout>
    )
} 