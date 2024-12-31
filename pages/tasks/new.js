import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import PageHeader from '../../components/PageHeader';
import ContentContainer from '../../components/ContentContainer';

export default function NewTask() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        name: '',
        status: 'pending',
        assigned_to: '',
        deadline: '',
        contract_id: '',
        project_id: '',
        service_id: '',
        process_id: '',
        step_id: '',
        description: ''
    });
    const [employees, setEmployees] = useState([]);
    const [projects, setProjects] = useState([]);
    const [services, setServices] = useState([]);
    const [contracts, setContracts] = useState([]);
    const [processes, setProcesses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [debug, setDebug] = useState({});

    useEffect(() => {
        const fetchData = async () => {
            try {
                const responses = await Promise.all([
                    fetch('/api/employees'),
                    fetch('/api/projects'),
                    fetch('/api/services'),
                    fetch('/api/contracts'),
                    fetch('/api/process-templates')
                ]);

                const [
                    employeesRes,
                    projectsRes,
                    servicesRes,
                    contractsRes,
                    processesRes
                ] = responses;

                if (!employeesRes.ok || !projectsRes.ok || !servicesRes.ok || 
                    !contractsRes.ok || !processesRes.ok) {
                    throw new Error('Failed to fetch data');
                }

                const [
                    employees,
                    projects,
                    services,
                    contracts,
                    processes
                ] = await Promise.all([
                    employeesRes.json(),
                    projectsRes.json(),
                    servicesRes.json(),
                    contractsRes.json(),
                    processesRes.json()
                ]);

                setEmployees(employees);
                setProjects(projects);
                setServices(services);
                setContracts(contracts);
                setProcesses(processes);
                
                console.log('Fetched processes:', processes);
                
            } catch (error) {
                console.error('Fetch Error:', error);
                setError('Error fetching data: ' + error.message);
            }
        };

        fetchData();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/tasks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                router.push('/tasks/board');
            } else {
                const data = await response.json();
                setError(data.message || 'Failed to create task');
            }
        } catch (error) {
            setError('Error creating task: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        console.log('Field changed:', name, 'New value:', value);
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Debug display
    useEffect(() => {
        setDebug({
            employees: employees.length,
            projects: projects.length,
            services: services.length,
            contracts: contracts.length,
            processes: processes.length,
            formData
        });
    }, [employees, projects, services, contracts, processes, formData]);

    return (
        <DashboardLayout>
            <PageHeader title="Create New Task" />
            <ContentContainer>
                <div className="max-w-4xl mx-auto">
                    {/* Debug information */}
                    <div className="mb-4 p-4 bg-base-200 rounded-lg text-sm">
                        <h3 className="font-semibold mb-2">Debug Info:</h3>
                        <pre className="whitespace-pre-wrap">
                            {JSON.stringify(debug, null, 2)}
                        </pre>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6 bg-base-100 p-6 rounded-lg shadow-lg">
                        {error && (
                            <div className="alert alert-error">
                                <span>{error}</span>
                            </div>
                        )}

                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">Task Name</span>
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

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Process</span>
                                </label>
                                <select
                                    name="process_id"
                                    value={formData.process_id}
                                    onChange={handleChange}
                                    className="select select-bordered"
                                    required
                                >
                                    <option value="">Select Process</option>
                                    {processes.map(process => (
                                        <option key={process.template_id} value={process.template_id}>
                                            {process.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Step</span>
                                </label>
                                <select
                                    name="step_id"
                                    value={formData.step_id}
                                    onChange={handleChange}
                                    className="select select-bordered"
                                    required
                                    disabled={!formData.process_id}
                                >
                                    <option value="">Select Step</option>
                                    {formData.process_id && processes
                                        .find(p => p.template_id === formData.process_id)?.steps
                                        .map(step => (
                                            <option key={step.step_id} value={step.step_id}>
                                                {step.name}
                                            </option>
                                        ))}
                                </select>
                            </div>

                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Status</span>
                                </label>
                                <select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange}
                                    className="select select-bordered"
                                    required
                                >
                                    <option value="pending">Pending</option>
                                    <option value="in-progress">In Progress</option>
                                    <option value="completed">Completed</option>
                                </select>
                            </div>

                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Assigned To</span>
                                </label>
                                <select
                                    name="assigned_to"
                                    value={formData.assigned_to}
                                    onChange={handleChange}
                                    className="select select-bordered"
                                    required
                                >
                                    <option value="">Select Employee</option>
                                    {employees.map(emp => (
                                        <option key={emp.employee_id} value={emp.employee_id}>
                                            {emp.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Project</span>
                                </label>
                                <select
                                    name="project_id"
                                    value={formData.project_id}
                                    onChange={handleChange}
                                    className="select select-bordered"
                                >
                                    <option value="">Select Project (Optional)</option>
                                    {projects.map(proj => (
                                        <option key={proj.project_id} value={proj.project_id}>
                                            {proj.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Service</span>
                                </label>
                                <select
                                    name="service_id"
                                    value={formData.service_id}
                                    onChange={handleChange}
                                    className="select select-bordered"
                                    required
                                >
                                    <option value="">Select Service</option>
                                    {services.map(service => (
                                        <option key={service.service_id} value={service.service_id}>
                                            {service.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Contract</span>
                                </label>
                                <select
                                    name="contract_id"
                                    value={formData.contract_id}
                                    onChange={handleChange}
                                    className="select select-bordered"
                                >
                                    <option value="">Select Contract (Optional)</option>
                                    {contracts.map(contract => (
                                        <option key={contract.contract_id} value={contract.contract_id}>
                                            Contract #{contract.contract_id}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Deadline</span>
                                </label>
                                <input
                                    type="datetime-local"
                                    name="deadline"
                                    value={formData.deadline}
                                    onChange={handleChange}
                                    className="input input-bordered"
                                    required
                                />
                            </div>
                        </div>

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
                                    'Create Task'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </ContentContainer>
        </DashboardLayout>
    );
}
