import React, { useEffect, useState } from 'react';
import client from '../api/client';

const Maintenance = () => {
  const [logs, setLogs] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCloseJobOpen, setIsCloseJobOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');

  // Create Form State
  const [vehicleId, setVehicleId] = useState('');
  const [serviceType, setServiceType] = useState('Scheduled');
  const [description, setDescription] = useState('');
  const [estimatedCost, setEstimatedCost] = useState('');

  // Close Job Form State
  const [actualCost, setActualCost] = useState('');
  const [resolution, setResolution] = useState('');

  const fetchLogs = async () => {
    try {
      let query = '/maintenance';
      if (statusFilter) {
        query += `?status=${statusFilter}`;
      }
      const res = await client.get(query);
      setLogs(res.data);
    } catch (err) {
      console.error('Error fetching maintenance:', err);
      setError('Failed to fetch maintenance logs. Make sure backend is running.');
    }
  };

  const fetchVehicles = async () => {
    try {
      const res = await client.get('/vehicles');
      setVehicles(res.data);
    } catch (err) {
      console.error('Error fetching vehicles list:', err);
    }
  };

  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      await Promise.all([fetchLogs(), fetchVehicles()]);
      setLoading(false);
    };
    initData();
  }, [statusFilter]);

  const handleOpenCreate = () => {
    setVehicleId('');
    setServiceType('Scheduled');
    setDescription('');
    setEstimatedCost('');
    setError('');
    setIsCreateOpen(true);
  };

  const handleCreateJob = async (e) => {
    e.preventDefault();
    setError('');

    const payload = {
      vehicle_id: parseInt(vehicleId),
      service_type: serviceType,
      description,
      estimated_cost: parseFloat(estimatedCost)
    };

    try {
      await client.post('/maintenance', payload);
      setIsCreateOpen(false);
      fetchLogs();
      fetchVehicles();
    } catch (err) {
      console.error('Create job error:', err);
      setError(err.response?.data?.error || 'Failed to create job.');
    }
  };

  const handleOpenCloseJob = (job) => {
    setSelectedJob(job);
    setActualCost(job.estimated_cost || '');
    setResolution('');
    setError('');
    setIsCloseJobOpen(true);
  };

  const handleCloseJobSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const payload = {
      status: 'Closed',
      actual_cost: parseFloat(actualCost),
      resolution
    };

    try {
      await client.put(`/maintenance/${selectedJob.id}`, payload);
      setIsCloseJobOpen(false);
      fetchLogs();
      fetchVehicles();
    } catch (err) {
      console.error('Close job error:', err);
      setError(err.response?.data?.error || 'Failed to close job.');
    }
  };

  // KPI Calculations
  const activeCount = logs.filter(j => j.status === 'Active').length;
  const closedCount = logs.filter(j => j.status === 'Closed').length;
  const totalSpend = logs.reduce((acc, curr) => acc + (curr.actual_cost || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-display text-on-surface">Maintenance Management</h2>
          <p className="font-body-md text-body-md text-secondary mt-1">
            Monitor fleet health, track maintenance spend, and schedule vehicle checkups.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-6 h-10 bg-primary text-on-primary font-label-md text-label-md hover:opacity-90 transition-all rounded"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            Create Maintenance
          </button>
        </div>
      </div>

      {/* KPI Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-outline-variant p-4 rounded">
          <p className="text-xs font-label-md text-secondary uppercase tracking-wider mb-1">Active Shop Jobs</p>
          <div className="flex items-end justify-between mt-1">
            <h3 className="text-2xl font-bold text-on-surface">{activeCount}</h3>
            <span className="text-[10px] font-bold text-error bg-error-container/20 px-1.5 py-0.5 rounded-sm">IN SHOP</span>
          </div>
        </div>
        <div className="bg-white border border-outline-variant p-4 rounded">
          <p className="text-xs font-label-md text-secondary uppercase tracking-wider mb-1">Closed (Resolved) Jobs</p>
          <div className="flex items-end justify-between mt-1">
            <h3 className="text-2xl font-bold text-on-surface">{closedCount}</h3>
            <span className="text-[10px] font-bold text-tertiary bg-tertiary-fixed/20 px-1.5 py-0.5 rounded-sm">COMPLETED</span>
          </div>
        </div>
        <div className="bg-white border border-outline-variant p-4 rounded">
          <p className="text-xs font-label-md text-secondary uppercase tracking-wider mb-1">Total Maintenance Spend</p>
          <div className="flex items-end justify-between mt-1">
            <h3 className="text-2xl font-bold text-on-surface">${totalSpend.toFixed(2)}</h3>
            <span className="text-[10px] font-bold text-secondary bg-surface-variant/50 px-1.5 py-0.5 rounded-sm">LIFETIME</span>
          </div>
        </div>
      </div>

      {/* Warning/Error alert */}
      {error && (
        <div className="p-3 bg-error-container/20 border border-error/20 text-error rounded text-body-sm">
          {error}
        </div>
      )}

      {/* Main Table Container */}
      <div className="bg-white border border-outline-variant rounded overflow-hidden">
        <div className="px-gutter py-4 border-b border-outline-variant flex items-center justify-between bg-surface-container-low">
          <h2 className="font-title-md text-title-md text-on-surface">Service History &amp; Active Jobs</h2>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-8 bg-surface border border-outline-variant text-[12px] font-medium px-2 rounded focus:ring-1 focus:ring-primary outline-none"
            >
              <option value="">Status: All</option>
              <option value="Active">Status: Active</option>
              <option value="Closed">Status: Closed</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-secondary">Loading maintenance logs...</div>
          ) : logs.length === 0 ? (
            <div className="p-8 text-center text-secondary">No maintenance log records found.</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant">
                  <th className="px-gutter py-3 font-label-md text-label-md text-secondary uppercase tracking-wider">Vehicle</th>
                  <th className="px-gutter py-3 font-label-md text-label-md text-secondary uppercase tracking-wider">Type / Description</th>
                  <th className="px-gutter py-3 font-label-md text-label-md text-secondary uppercase tracking-wider">Estimated Cost</th>
                  <th className="px-gutter py-3 font-label-md text-label-md text-secondary uppercase tracking-wider">Actual Cost</th>
                  <th className="px-gutter py-3 font-label-md text-label-md text-secondary uppercase tracking-wider">Status</th>
                  <th className="px-gutter py-3 font-label-md text-label-md text-secondary uppercase tracking-wider">Dates</th>
                  <th className="px-gutter py-3 font-label-md text-label-md text-secondary uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant text-body-sm">
                {logs.map((job) => (
                  <tr key={job.id} className={`hover:bg-surface-container-low/50 transition-colors ${job.status === 'Closed' ? 'opacity-80' : ''}`}>
                    <td className="px-gutter py-3">
                      <div className="flex flex-col">
                        <span className="font-bold text-on-surface">{job.vehicle.name_model}</span>
                        <span className="text-[11px] text-secondary">{job.vehicle.registration_number}</span>
                      </div>
                    </td>
                    <td className="px-gutter py-3">
                      <div className="flex flex-col">
                        <span className="font-bold capitalize text-primary text-xs">{job.service_type}</span>
                        <span>{job.description}</span>
                        {job.resolution && <span className="text-[11px] text-secondary italic mt-1">Res: {job.resolution}</span>}
                      </div>
                    </td>
                    <td className="px-gutter py-3 font-code">${job.estimated_cost.toFixed(2)}</td>
                    <td className="px-gutter py-3 font-code font-bold text-on-surface">
                      {job.actual_cost !== null ? `$${job.actual_cost.toFixed(2)}` : '—'}
                    </td>
                    <td className="px-gutter py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[2px] text-[11px] font-bold uppercase ${
                          job.status === 'Active'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-green-100 text-green-700'
                        }`}
                      >
                        {job.status}
                      </span>
                    </td>
                    <td className="px-gutter py-3 text-secondary text-xs">
                      <div>Opened: {new Date(job.opened_date).toLocaleDateString()}</div>
                      {job.closed_date && <div>Closed: {new Date(job.closed_date).toLocaleDateString()}</div>}
                    </td>
                    <td className="px-gutter py-3 text-right">
                      {job.status === 'Active' && (
                        <button
                          onClick={() => handleOpenCloseJob(job)}
                          className="text-primary hover:text-primary-container text-[12px] font-bold uppercase tracking-tight px-3 py-1 border border-primary hover:bg-primary/5 transition-all rounded"
                        >
                          Close Job
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Create Maintenance Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm" onClick={() => setIsCreateOpen(false)}></div>
          <div className="relative bg-surface w-full max-w-lg border border-outline-variant shadow-xl rounded-lg overflow-hidden">
            <div className="px-6 py-4 bg-surface border-b border-outline-variant flex items-center justify-between">
              <h3 className="font-headline text-headline text-on-surface">New Maintenance Request</h3>
              <button onClick={() => setIsCreateOpen(false)} className="text-secondary hover:text-on-surface">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <form onSubmit={handleCreateJob} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-label-md text-label-md text-on-surface mb-1">Vehicle</label>
                  <select
                    required
                    value={vehicleId}
                    onChange={(e) => setVehicleId(e.target.value)}
                    className="w-full h-8 px-3 bg-surface border border-outline-variant rounded focus:ring-1 focus:ring-primary outline-none"
                  >
                    <option value="">Select vehicle...</option>
                    {vehicles.filter(v => v.status !== 'Retired').map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name_model} ({v.registration_number}) - {v.status}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-label-md text-label-md text-on-surface mb-1">Service Type</label>
                  <select
                    value={serviceType}
                    onChange={(e) => setServiceType(e.target.value)}
                    className="w-full h-8 px-3 bg-surface border border-outline-variant rounded focus:ring-1 focus:ring-primary outline-none"
                  >
                    <option value="Scheduled">Scheduled</option>
                    <option value="Breakdown">Breakdown</option>
                    <option value="Inspection">Inspection</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block font-label-md text-label-md text-on-surface mb-1">Problem Description</label>
                <textarea
                  required
                  rows="3"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-surface border border-outline-variant rounded font-body-md focus:ring-1 focus:ring-primary outline-none"
                  placeholder="Describe the issues or scheduled checklists..."
                ></textarea>
              </div>
              <div>
                <label className="block font-label-md text-label-md text-on-surface mb-1">Estimated Cost ($)</label>
                <input
                  type="number"
                  required
                  value={estimatedCost}
                  onChange={(e) => setEstimatedCost(e.target.value)}
                  placeholder="0.00"
                  className="w-full h-8 px-3 bg-surface border border-outline-variant rounded font-body-md focus:ring-1 focus:ring-primary outline-none"
                />
              </div>

              <div className="mt-8 flex justify-end gap-3 border-t border-outline-variant pt-4">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 text-on-surface-variant font-label-md text-label-md hover:bg-surface-container-low transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-primary text-on-primary font-label-md text-label-md hover:bg-primary-container transition-all rounded"
                >
                  Open Maintenance Job
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Close Maintenance Modal */}
      {isCloseJobOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm" onClick={() => setIsCloseJobOpen(false)}></div>
          <div className="relative bg-surface w-full max-w-md border border-outline-variant shadow-xl rounded-lg overflow-hidden">
            <form onSubmit={handleCloseJobSubmit} className="p-6 space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-tertiary-fixed flex items-center justify-center">
                  <span className="material-symbols-outlined text-tertiary">check_circle</span>
                </div>
                <h3 className="font-headline text-headline text-on-surface">Close Maintenance Job</h3>
              </div>
              
              <p className="font-body-md text-body-md text-secondary">
                Confirm all repairs are complete for vehicle <span className="font-bold text-on-surface">{selectedJob?.vehicle?.name_model}</span>. This will set vehicle status back to <span className="font-bold">Available</span>.
              </p>
              
              <div>
                <label className="block font-label-md text-label-md text-on-surface mb-1">Final Service Cost ($)</label>
                <input
                  type="number"
                  required
                  value={actualCost}
                  onChange={(e) => setActualCost(e.target.value)}
                  className="w-full h-8 px-3 bg-surface border border-outline-variant rounded font-body-md focus:ring-1 focus:ring-primary outline-none"
                />
              </div>
              <div>
                <label className="block font-label-md text-label-md text-on-surface mb-1">Resolution Summary</label>
                <textarea
                  required
                  rows="3"
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  className="w-full px-3 py-2 bg-surface border border-outline-variant rounded font-body-md focus:ring-1 focus:ring-primary outline-none"
                  placeholder="e.g. Replaced front brake pads, topped brake fluid, tested stops."
                ></textarea>
              </div>

              <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-outline-variant">
                <button
                  type="button"
                  onClick={() => setIsCloseJobOpen(false)}
                  className="px-4 py-2 text-on-surface-variant font-label-md text-label-md hover:bg-surface-container-low transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-primary text-on-primary font-label-md text-label-md hover:bg-primary-container transition-all rounded"
                >
                  Finalize &amp; Close
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Maintenance;
