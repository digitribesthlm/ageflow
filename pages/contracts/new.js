import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import PageHeader from '../../components/PageHeader';
import ContentContainer from '../../components/ContentContainer';

export default function NewContract() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [clients, setClients] = useState([]);
    const [packages, setPackages] = useState([]);
    const [formData, setFormData] = useState({
        client_id: '',
        packages: [],
        start_date: '',
        end_date: '',
        monthly_fee: '',
        billing_frequency: 'monthly',
        payment_terms: 'net-30',
        contract_type: 'one-time'
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            // Fetch clients and service packages
            const [clientsRes, packagesRes] = await Promise.all([
                fetch('/api/clients', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ action: 'fetch' })
                }),
                fetch('/api/service-packages', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ action: 'fetch' })
                })
            ]);

            if (!clientsRes.ok || !packagesRes.ok) {
                const errorData = !clientsRes.ok ? await clientsRes.json() : await packagesRes.json();
                throw new Error(errorData.message || 'Failed to fetch data');
            }

            const [clientsData, packagesData] = await Promise.all([
                clientsRes.json(),
                packagesRes.json()
            ]);

            setClients(clientsData);
            setPackages(packagesData);
        } catch (error) {
            setError('Error fetching data: ' + error.message);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/contracts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                router.push('/contracts');
            } else {
                const data = await response.json();
                setError(data.message || 'Failed to create contract');
            }
        } catch (error) {
            setError('Error creating contract: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handlePackageChange = (e) => {
        const selectedOptions = Array.from(e.target.selectedOptions).map(option => ({
            package_id: option.value,
            name: option.text,
            quantity: 1
        }));
        setFormData(prev => ({
            ...prev,
            packages: selectedOptions
        }));
    };

    const updatePackageQuantity = (packageId, quantity) => {
        setFormData(prev => ({
            ...prev,
            packages: prev.packages.map(pkg => 
                pkg.package_id === packageId 
                    ? { ...pkg, quantity: parseInt(quantity) || 1 }
                    : pkg
            )
        }));
    };

    return (
        <DashboardLayout>
            <PageHeader title="Create New Contract" />
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
                                    <span className="label-text">Client</span>
                                </label>
                                <select
                                    name="client_id"
                                    value={formData.client_id}
                                    onChange={handleChange}
                                    className="select select-bordered"
                                    required
                                >
                                    <option value="">Select Client</option>
                                    {clients.map(client => (
                                        <option key={client.client_id} value={client.client_id}>
                                            {client.company} ({client.name})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Service Packages</span>
                                </label>
                                <select
                                    multiple
                                    name="packages"
                                    onChange={handlePackageChange}
                                    className="select select-bordered min-h-[120px]"
                                    required
                                >
                                    {packages.map((pkg) => (
                                        <option key={pkg.package_id} value={pkg.package_id}>
                                            {pkg.name}
                                        </option>
                                    ))}
                                </select>
                                <label className="label">
                                    <span className="label-text-alt">Hold Ctrl/Cmd to select multiple packages</span>
                                </label>
                            </div>

                            {formData.packages.length > 0 && (
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text">Package Quantities</span>
                                    </label>
                                    <div className="space-y-2">
                                        {formData.packages.map((pkg) => (
                                            <div key={pkg.package_id} className="flex items-center gap-4">
                                                <span className="flex-grow">{pkg.name}</span>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={pkg.quantity}
                                                    onChange={(e) => updatePackageQuantity(pkg.package_id, e.target.value)}
                                                    className="input input-bordered w-24"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Contract Type</span>
                                </label>
                                <select
                                    name="contract_type"
                                    value={formData.contract_type}
                                    onChange={handleChange}
                                    className="select select-bordered"
                                    required
                                >
                                    <option value="one-time">One-time</option>
                                    <option value="recurring">Recurring</option>
                                </select>
                            </div>

                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Start Date</span>
                                </label>
                                <input
                                    type="date"
                                    name="start_date"
                                    value={formData.start_date}
                                    onChange={handleChange}
                                    className="input input-bordered"
                                    required
                                />
                            </div>

                            {formData.contract_type === 'one-time' && (
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text">End Date</span>
                                    </label>
                                    <input
                                        type="date"
                                        name="end_date"
                                        value={formData.end_date}
                                        onChange={handleChange}
                                        className="input input-bordered"
                                        required
                                    />
                                </div>
                            )}

                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Monthly Fee</span>
                                </label>
                                <input
                                    type="number"
                                    name="monthly_fee"
                                    value={formData.monthly_fee}
                                    onChange={handleChange}
                                    className="input input-bordered"
                                    placeholder="0.00"
                                    step="0.01"
                                    required
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
                                    <option value="annual">Annual</option>
                                </select>
                            </div>

                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Payment Terms</span>
                                </label>
                                <select
                                    name="payment_terms"
                                    value={formData.payment_terms}
                                    onChange={handleChange}
                                    className="select select-bordered"
                                    required
                                >
                                    <option value="net-15">Net 15</option>
                                    <option value="net-30">Net 30</option>
                                    <option value="net-45">Net 45</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-4">
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
                                    <>
                                        <span className="loading loading-spinner loading-sm"></span>
                                        Creating...
                                    </>
                                ) : (
                                    'Create Contract'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </ContentContainer>
        </DashboardLayout>
    );
} 