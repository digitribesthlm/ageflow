import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import PageHeader from '../../components/PageHeader';
import ContentContainer from '../../components/ContentContainer';

export default function Contracts() {
    const router = useRouter();
    const [contracts, setContracts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchContracts();
    }, []);

    const fetchContracts = async () => {
        try {
            const response = await fetch('/api/contracts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ action: 'fetch' })
            });
            if (response.ok) {
                const data = await response.json();
                setContracts(data || []);
            } else {
                const errorData = await response.json();
                setError(errorData.message || 'Failed to fetch contracts');
            }
        } catch (error) {
            setError('Error fetching contracts: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    const renderContent = () => {
        if (loading) {
            return (
                <div className="flex justify-center items-center min-h-[200px]">
                    <span className="loading loading-spinner loading-lg"></span>
                </div>
            );
        }

        if (error) {
            return (
                <div className="alert alert-error">
                    <span>{error}</span>
                </div>
            );
        }

        if (contracts.length === 0) {
            return (
                <div className="text-center p-8">
                    <h3 className="text-xl font-semibold mb-4">No Contracts Yet</h3>
                    <p className="mb-6">Start by creating your first contract</p>
                    <button
                        onClick={() => router.push('/contracts/new')}
                        className="btn btn-primary"
                    >
                        Create Contract
                    </button>
                </div>
            );
        }

        return (
            <div className="overflow-x-auto">
                <table className="table">
                    <thead>
                        <tr>
                            <th>Contract ID</th>
                            <th>Client</th>
                            <th>Package</th>
                            <th>Status</th>
                            <th>Monthly Fee</th>
                            <th>Billing</th>
                            <th>Duration</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {contracts.map((contract) => (
                            <tr key={contract.contract_id} className="hover">
                                <td>{contract.contract_id}</td>
                                <td>{contract.client_id}</td>
                                <td>{contract.package_id}</td>
                                <td>
                                    <div className={`badge ${
                                        contract.status === 'active' ? 'badge-success' :
                                        contract.status === 'pending' ? 'badge-warning' :
                                        'badge-error'
                                    }`}>
                                        {contract.status}
                                    </div>
                                </td>
                                <td>{formatCurrency(contract.monthly_fee)}</td>
                                <td>
                                    <div>
                                        <div className="font-medium">
                                            {contract.billing?.frequency || 'Monthly'}
                                        </div>
                                        <div className="text-sm opacity-60">
                                            {contract.billing?.payment_terms || 'Net-30'}
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <div className="text-sm">
                                        {new Date(contract.start_date).toLocaleDateString()} - 
                                        {new Date(contract.end_date).toLocaleDateString()}
                                    </div>
                                </td>
                                <td>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => router.push(`/contracts/${contract.contract_id}`)}
                                            className="btn btn-sm btn-ghost"
                                        >
                                            View
                                        </button>
                                        <button
                                            onClick={() => router.push(`/contracts/${contract.contract_id}/edit`)}
                                            className="btn btn-sm btn-ghost"
                                        >
                                            Edit
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <DashboardLayout>
            <PageHeader 
                title="Contracts"
                actions={
                    <button
                        onClick={() => router.push('/contracts/new')}
                        className="btn btn-primary"
                    >
                        New Contract
                    </button>
                }
            />
            <ContentContainer>
                {renderContent()}
            </ContentContainer>
        </DashboardLayout>
    );
} 