import React, { useEffect, useState } from 'react';
import client from '../api/client';
import { formatDistance, getCurrencySymbol, getDistanceUnit } from '../utils/format';

const Vehicles = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editId, setEditId] = useState(null);

  // Documents state
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [vehicleDocs, setVehicleDocs] = useState([]);
  const [docLoading, setDocLoading] = useState(false);
  const [isDocFormOpen, setIsDocFormOpen] = useState(false);
  const [docEditId, setDocEditId] = useState(null);

  // Doc form inputs
  const [docType, setDocType] = useState('Registration');
  const [docNumber, setDocNumber] = useState('');
  const [docIssueDate, setDocIssueDate] = useState('');
  const [docExpiryDate, setDocExpiryDate] = useState('');
  const [docFilePath, setDocFilePath] = useState('');

  // Filters state
  const [statusFilter, setStatusFilter] = useState('');
  const [regionFilter, setRegionFilter] = useState('');

  // Form State
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [nameModel, setNameModel] = useState('');
  const [type, setType] = useState('Transit Bus');
  const [maxLoadCapacity, setMaxLoadCapacity] = useState('');
  const [odometer, setOdometer] = useState('');
  const [acquisitionCost, setAcquisitionCost] = useState('');
  const [status, setStatus] = useState('Available');
  const [region, setRegion] = useState('Central Metro');

  const handleOpenDocumentsModal = async (vehicle) => {
    setSelectedVehicle(vehicle);
    setIsDocModalOpen(true);
    setDocLoading(true);
    setIsDocFormOpen(false);
    setDocEditId(null);
    try {
      const res = await client.get(`/vehicle-documents?vehicle_id=${vehicle.id}`);
      setVehicleDocs(res.data);
    } catch (err) {
      console.error('Error fetching documents:', err);
    } finally {
      setDocLoading(false);
    }
  };

  const handleOpenCreateDocForm = () => {
    setDocEditId(null);
    setDocType('Registration');
    setDocNumber('');
    setDocIssueDate('');
    setDocExpiryDate('');
    setDocFilePath('');
    setIsDocFormOpen(true);
  };

  const handleOpenEditDocForm = (doc) => {
    setDocEditId(doc.id);
    setDocType(doc.document_type);
    setDocNumber(doc.document_number);
    setDocIssueDate(new Date(doc.issue_date).toISOString().split('T')[0]);
    setDocExpiryDate(new Date(doc.expiry_date).toISOString().split('T')[0]);
    setDocFilePath(doc.file_path || '');
    setIsDocFormOpen(true);
  };

  const handleDeleteDoc = async (id) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    try {
      await client.delete(`/vehicle-documents/${id}`);
      const res = await client.get(`/vehicle-documents?vehicle_id=${selectedVehicle.id}`);
      setVehicleDocs(res.data);
      fetchVehicles();
    } catch (err) {
      console.error('Error deleting document:', err);
      alert('Failed to delete document.');
    }
  };

  const handleSubmitDoc = async (e) => {
    e.preventDefault();
    const payload = {
      vehicle_id: selectedVehicle.id,
      document_type: docType,
      document_number: docNumber,
      issue_date: docIssueDate,
      expiry_date: docExpiryDate,
      file_path: docFilePath || null,
    };
    try {
      if (docEditId) {
        await client.put(`/vehicle-documents/${docEditId}`, payload);
      } else {
        await client.post('/vehicle-documents', payload);
      }
      setIsDocFormOpen(false);
      setDocEditId(null);
      const res = await client.get(`/vehicle-documents?vehicle_id=${selectedVehicle.id}`);
      setVehicleDocs(res.data);
      fetchVehicles();
    } catch (err) {
      console.error('Error saving document:', err);
      alert(err.response?.data?.error || 'Failed to save document.');
    }
  };

  const getDocAlert = (vehicle) => {
    if (!vehicle.documents || vehicle.documents.length === 0) return null;
    const expired = vehicle.documents.filter(d => d.status === 'Expired');
    const expiring = vehicle.documents.filter(d => d.status === 'Expiring Soon');
    if (expired.length > 0) {
      return {
        type: 'expired',
        message: `${expired.length} Expired Document${expired.length > 1 ? 's' : ''}`
      };
    }
    if (expiring.length > 0) {
      return {
        type: 'expiring',
        message: `${expiring.length} Document${expiring.length > 1 ? 's' : ''} Expiring Soon`
      };
    }
    return null;
  };

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      let query = '/vehicles';
      const params = [];
      if (statusFilter) params.push(`status=${statusFilter}`);
      if (regionFilter) params.push(`region=${regionFilter}`);
      if (params.length > 0) {
        query += `?${params.join('&')}`;
      }

      const res = await client.get(query);
      setVehicles(res.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching vehicles:', err);
      setError('Failed to fetch vehicles. Please ensure database and backend are running.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, [statusFilter, regionFilter]);

  const handleOpenCreateModal = () => {
    setIsEditMode(false);
    setRegistrationNumber('');
    setNameModel('');
    setType('Transit Bus');
    setMaxLoadCapacity('');
    setOdometer('');
    setAcquisitionCost('');
    setStatus('Available');
    setRegion('Central Metro');
    setError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (vehicle) => {
    setIsEditMode(true);
    setEditId(vehicle.id);
    setRegistrationNumber(vehicle.registration_number);
    setNameModel(vehicle.name_model);
    setType(vehicle.type);
    setMaxLoadCapacity(vehicle.max_load_capacity);
    setOdometer(vehicle.odometer);
    setAcquisitionCost(vehicle.acquisition_cost);
    setStatus(vehicle.status);
    setRegion(vehicle.region);
    setError('');
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this vehicle?')) return;
    try {
      await client.delete(`/vehicles/${id}`);
      fetchVehicles();
    } catch (err) {
      console.error('Delete error:', err);
      alert(err.response?.data?.error || 'Failed to delete vehicle.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const payload = {
      registration_number: registrationNumber,
      name_model: nameModel,
      type,
      max_load_capacity: parseFloat(maxLoadCapacity),
      odometer: parseFloat(odometer),
      acquisition_cost: parseFloat(acquisitionCost),
      status,
      region,
    };

    try {
      if (isEditMode) {
        await client.put(`/vehicles/${editId}`, payload);
      } else {
        await client.post('/vehicles', payload);
      }
      setIsModalOpen(false);
      fetchVehicles();
    } catch (err) {
      console.error('Save error:', err);
      setError(err.response?.data?.error || 'Failed to save vehicle details.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-display text-on-surface">Vehicles Management</h2>
          <p className="font-body-md text-body-md text-secondary mt-1">
            Register assets, track odometer readings, and monitor service availability.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenCreateModal}
            className="h-10 px-6 bg-primary text-white font-label-md text-label-md hover:opacity-90 transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Add Vehicle
          </button>
        </div>
      </div>

      {/* Filters bar */}
      <div className="flex flex-wrap items-center gap-4 bg-white p-3 border border-outline-variant rounded">
        <div className="flex items-center gap-2">
          <span className="text-label-md font-label-md text-secondary uppercase">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-8 bg-surface-container-low border border-outline-variant text-body-sm px-2 focus:ring-0 focus:border-primary"
          >
            <option value="">All Statuses</option>
            <option value="Available">Available</option>
            <option value="OnTrip">On Trip</option>
            <option value="InShop">In Shop</option>
            <option value="Retired">Retired</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-label-md font-label-md text-secondary uppercase">Region:</span>
          <select
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
            className="h-8 bg-surface-container-low border border-outline-variant text-body-sm px-2 focus:ring-0 focus:border-primary"
          >
            <option value="">All Regions</option>
            <option value="Central Metro">Central Metro</option>
            <option value="North-East">North-East</option>
            <option value="South-West">South-West</option>
            <option value="Coastline">Coastline</option>
            <option value="Austin">Austin</option>
            <option value="Houston">Houston</option>
            <option value="Dallas">Dallas</option>
            <option value="San Antonio">San Antonio</option>
            <option value="El Paso">El Paso</option>
          </select>
        </div>
        {(statusFilter || regionFilter) && (
          <button
            onClick={() => {
              setStatusFilter('');
              setRegionFilter('');
            }}
            className="ml-auto text-primary font-label-md text-label-md hover:underline"
          >
            Clear all filters
          </button>
        )}
      </div>

      {/* Main Vehicles Table */}
      <div className="bg-white border border-outline-variant overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-secondary">Loading vehicles data...</div>
        ) : vehicles.length === 0 ? (
          <div className="p-8 text-center text-secondary">No vehicles found. Try resetting filters or adding one.</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#F9FAFB] border-b border-outline-variant">
              <tr>
                <th className="px-gutter py-3 text-label-md font-label-md text-secondary uppercase tracking-wider">Reg. Number</th>
                <th className="px-gutter py-3 text-label-md font-label-md text-secondary uppercase tracking-wider">Vehicle Name</th>
                <th className="px-gutter py-3 text-label-md font-label-md text-secondary uppercase tracking-wider">Type</th>
                <th className="px-gutter py-3 text-label-md font-label-md text-secondary uppercase tracking-wider">Max Load</th>
                <th className="px-gutter py-3 text-label-md font-label-md text-secondary uppercase tracking-wider">Odometer</th>
                <th className="px-gutter py-3 text-label-md font-label-md text-secondary uppercase tracking-wider">Region</th>
                <th className="px-gutter py-3 text-label-md font-label-md text-secondary uppercase tracking-wider">Status</th>
                <th className="px-gutter py-3 text-label-md font-label-md text-secondary uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {vehicles.map((v) => (
                <tr key={v.id} className="hover:bg-surface-container-low transition-colors">
                  <td className="px-gutter py-4 font-code text-code text-on-surface">
                    <div className="flex items-center gap-1.5">
                      <span>{v.registration_number}</span>
                      {(() => {
                        const alertInfo = getDocAlert(v);
                        if (!alertInfo) return null;
                        if (alertInfo.type === 'expired') {
                          return (
                            <span className="material-symbols-outlined text-error text-[16px] cursor-pointer" title={alertInfo.message}>
                              warning
                            </span>
                          );
                        }
                        return (
                          <span className="material-symbols-outlined text-warning text-[16px] cursor-pointer" title={alertInfo.message}>
                            info
                          </span>
                        );
                      })()}
                    </div>
                  </td>
                  <td className="px-gutter py-4 font-title-md text-title-md text-on-surface">{v.name_model}</td>
                  <td className="px-gutter py-4 font-body-md text-body-md text-secondary">{v.type}</td>
                  <td className="px-gutter py-4 font-body-md text-body-md text-secondary">{v.max_load_capacity} kg</td>
                  <td className="px-gutter py-4 font-body-md text-body-md text-secondary">{formatDistance(v.odometer)}</td>
                  <td className="px-gutter py-4 font-body-md text-body-md text-secondary">{v.region}</td>
                  <td className="px-gutter py-4">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-[2px] text-[11px] font-bold border uppercase ${
                        v.status === 'Available'
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : v.status === 'OnTrip'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : v.status === 'InShop'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-gray-100 text-gray-600 border-gray-300'
                      }`}
                    >
                      {v.status}
                    </span>
                  </td>
                  <td className="px-gutter py-4 text-right space-x-1">
                    <button
                      onClick={() => handleOpenDocumentsModal(v)}
                      title="Manage Documents"
                      className="p-1 hover:bg-surface-container rounded text-secondary"
                    >
                      <span className="material-symbols-outlined text-lg">folder_open</span>
                    </button>
                    <button
                      onClick={() => handleOpenEditModal(v)}
                      title="Edit Vehicle"
                      className="p-1 hover:bg-surface-container rounded text-secondary"
                    >
                      <span className="material-symbols-outlined text-lg">edit</span>
                    </button>
                    <button
                      onClick={() => handleDelete(v.id)}
                      title="Delete Vehicle"
                      className="p-1 hover:bg-surface-container rounded text-secondary"
                    >
                      <span className="material-symbols-outlined text-lg text-error">delete</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add / Edit Vehicle Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-[2px] z-[60] flex items-center justify-center">
          <div className="bg-white w-full max-w-2xl border border-outline-variant shadow-xl overflow-hidden rounded-lg">
            <div className="px-6 py-4 bg-surface border-b border-outline-variant flex items-center justify-between">
              <h3 className="font-headline text-headline text-on-surface">
                {isEditMode ? 'Edit Vehicle Details' : 'Create New Vehicle'}
              </h3>
              <button className="text-secondary hover:text-on-surface" onClick={() => setIsModalOpen(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            {error && (
              <div className="mx-6 mt-4 p-3 bg-error-container/20 border border-error/20 text-error rounded text-body-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-label-md font-bold text-secondary uppercase">Registration Number</label>
                  <input
                    type="text"
                    required
                    value={registrationNumber}
                    onChange={(e) => setRegistrationNumber(e.target.value)}
                    placeholder="e.g. TX-1234-AB"
                    className="w-full h-8 px-3 border border-outline-variant rounded focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-label-md font-bold text-secondary uppercase">Vehicle Name / Model</label>
                  <input
                    type="text"
                    required
                    value={nameModel}
                    onChange={(e) => setNameModel(e.target.value)}
                    placeholder="e.g. Ford Transit Cargo"
                    className="w-full h-8 px-3 border border-outline-variant rounded focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-label-md font-bold text-secondary uppercase">Vehicle Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full h-8 px-2 border border-outline-variant rounded bg-white text-body-sm focus:outline-none focus:border-primary"
                  >
                    <option value="Transit Bus">Transit Bus</option>
                    <option value="Heavy Truck">Heavy Truck</option>
                    <option value="Cargo Van">Cargo Van</option>
                    <option value="Standard Trailer">Standard Trailer</option>
                    <option value="Reefer Trailer">Reefer Trailer</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-label-md font-bold text-secondary uppercase">Max Load Capacity (kg)</label>
                  <input
                    type="number"
                    required
                    value={maxLoadCapacity}
                    onChange={(e) => setMaxLoadCapacity(e.target.value)}
                    placeholder="e.g. 5000"
                    className="w-full h-8 px-3 border border-outline-variant rounded focus:outline-none focus:border-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-label-md font-bold text-secondary uppercase">Odometer ({getDistanceUnit()})</label>
                  <input
                    type="number"
                    required
                    value={odometer}
                    onChange={(e) => setOdometer(e.target.value)}
                    placeholder="e.g. 24500"
                    className="w-full h-8 px-3 border border-outline-variant rounded focus:outline-none focus:border-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-label-md font-bold text-secondary uppercase">Acquisition Cost ({getCurrencySymbol()})</label>
                  <input
                    type="number"
                    required
                    value={acquisitionCost}
                    onChange={(e) => setAcquisitionCost(e.target.value)}
                    placeholder="e.g. 35000"
                    className="w-full h-8 px-3 border border-outline-variant rounded focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="space-y-1 col-span-2">
                <label className="block text-label-md font-bold text-secondary uppercase">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full h-8 px-3 border border-outline-variant rounded text-body-md focus:outline-none focus:border-primary"
                >
                  <option value="Available">Available</option>
                  <option value="OnTrip">On Trip</option>
                  <option value="InShop">In Shop</option>
                  <option value="Retired">Retired</option>
                </select>
              </div>

              <div className="px-6 py-4 bg-surface-container border-t border-outline-variant flex items-center justify-end gap-3 -mx-6 -mb-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="h-10 px-6 bg-secondary-container text-on-secondary-container font-label-md text-label-md hover:bg-secondary-fixed transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-10 px-8 bg-primary text-white font-label-md text-label-md hover:opacity-90 transition-all"
                >
                  Save Vehicle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Vehicle Document Management Modal */}
      {isDocModalOpen && selectedVehicle && (
        <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-[2px] z-[60] flex items-center justify-center">
          <div className="bg-white w-full max-w-4xl border border-outline-variant shadow-xl overflow-hidden rounded-lg flex flex-col max-h-[85vh]">
            <div className="px-6 py-4 bg-surface border-b border-outline-variant flex items-center justify-between">
              <div>
                <h3 className="font-headline text-headline text-on-surface">Vehicle Document Management</h3>
                <p className="text-secondary text-body-sm mt-0.5">
                  Managing documents for: <span className="font-bold text-primary">{selectedVehicle.registration_number}</span> — {selectedVehicle.name_model}
                </p>
              </div>
              <button className="text-secondary hover:text-on-surface" onClick={() => setIsDocModalOpen(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {/* Document Form */}
              {isDocFormOpen ? (
                <form onSubmit={handleSubmitDoc} className="bg-surface-container-low p-5 border border-outline-variant rounded space-y-4">
                  <h4 className="font-title-md text-title-md font-bold text-on-surface">
                    {docEditId ? 'Edit Document Details' : 'Add New Document'}
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-secondary uppercase">Document Type</label>
                      <select
                        value={docType}
                        onChange={(e) => setDocType(e.target.value)}
                        className="w-full h-8 px-2 border border-outline-variant rounded bg-white text-body-sm focus:outline-none focus:border-primary"
                      >
                        <option value="Registration">Registration</option>
                        <option value="Insurance">Insurance</option>
                        <option value="Road Permit">Road Permit</option>
                        <option value="Emission Certificate">Emission Certificate</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-secondary uppercase">Document Number</label>
                      <input
                        type="text"
                        required
                        value={docNumber}
                        onChange={(e) => setDocNumber(e.target.value)}
                        placeholder="e.g. REG-12345-TX"
                        className="w-full h-8 px-3 border border-outline-variant rounded focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-secondary uppercase">Issue Date</label>
                      <input
                        type="date"
                        required
                        value={docIssueDate}
                        onChange={(e) => setDocIssueDate(e.target.value)}
                        className="w-full h-8 px-3 border border-outline-variant rounded focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-secondary uppercase">Expiry Date</label>
                      <input
                        type="date"
                        required
                        value={docExpiryDate}
                        onChange={(e) => setDocExpiryDate(e.target.value)}
                        className="w-full h-8 px-3 border border-outline-variant rounded focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-secondary uppercase">Document Link / URL (Optional)</label>
                    <input
                      type="text"
                      value={docFilePath}
                      onChange={(e) => setDocFilePath(e.target.value)}
                      placeholder="e.g. https://storage.googleapis.com/transitops-docs/insurance.pdf"
                      className="w-full h-8 px-3 border border-outline-variant rounded focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsDocFormOpen(false)}
                      className="h-8 px-4 bg-secondary-container text-on-secondary-container text-body-sm font-bold rounded hover:bg-secondary-fixed transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="h-8 px-6 bg-primary text-white text-body-sm font-bold rounded hover:opacity-90 transition-colors"
                    >
                      {docEditId ? 'Update Document' : 'Save Document'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="flex justify-between items-center bg-surface-container-low p-4 border border-outline-variant rounded">
                  <div>
                    <h4 className="font-title-md text-title-md font-bold">Document Inventory</h4>
                    <p className="text-secondary text-body-sm">Track compliance and expiry status.</p>
                  </div>
                  <button
                    onClick={handleOpenCreateDocForm}
                    className="h-8 px-4 bg-primary text-white text-body-sm font-bold rounded hover:opacity-90 transition-colors flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[16px]">add</span>
                    Add Document
                  </button>
                </div>
              )}

              {/* Documents Table */}
              <div className="border border-outline-variant rounded overflow-hidden bg-white">
                {docLoading ? (
                  <div className="p-8 text-center text-secondary">Loading documents...</div>
                ) : vehicleDocs.length === 0 ? (
                  <div className="p-8 text-center text-secondary">No documents added yet.</div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-[#F9FAFB] border-b border-outline-variant">
                      <tr className="text-[10px] uppercase text-outline font-bold">
                        <th className="px-gutter py-2.5">Document Type</th>
                        <th className="px-gutter py-2.5">Document Number</th>
                        <th className="px-gutter py-2.5">Issue Date</th>
                        <th className="px-gutter py-2.5">Expiry Date</th>
                        <th className="px-gutter py-2.5">Status</th>
                        <th className="px-gutter py-2.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant text-body-sm">
                      {vehicleDocs.map((doc) => (
                        <tr key={doc.id} className="hover:bg-surface-container-low transition-colors">
                          <td className="px-gutter py-3 font-bold text-on-surface">{doc.document_type}</td>
                          <td className="px-gutter py-3 font-code">{doc.document_number}</td>
                          <td className="px-gutter py-3 text-secondary">{new Date(doc.issue_date).toLocaleDateString()}</td>
                          <td className="px-gutter py-3 text-secondary">{new Date(doc.expiry_date).toLocaleDateString()}</td>
                          <td className="px-gutter py-3">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-[2px] text-[10px] font-bold border uppercase ${
                                doc.status === 'Active'
                                  ? 'bg-green-50 text-green-700 border-green-200'
                                  : doc.status === 'Expiring Soon'
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : 'bg-red-50 text-red-700 border-red-200'
                              }`}
                            >
                              {doc.status}
                            </span>
                          </td>
                          <td className="px-gutter py-3 text-right space-x-1">
                            {doc.file_path && (
                              <a
                                href={doc.file_path}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="View Document File"
                                className="p-1 inline-block hover:bg-surface-container rounded text-secondary"
                              >
                                <span className="material-symbols-outlined text-lg">open_in_new</span>
                              </a>
                            )}
                            <button
                              onClick={() => handleOpenEditDocForm(doc)}
                              title="Edit Document"
                              className="p-1 hover:bg-surface-container rounded text-secondary"
                            >
                              <span className="material-symbols-outlined text-lg">edit</span>
                            </button>
                            <button
                              onClick={() => handleDeleteDoc(doc.id)}
                              title="Delete Document"
                              className="p-1 hover:bg-surface-container rounded text-secondary"
                            >
                              <span className="material-symbols-outlined text-lg text-error">delete</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-outline-variant bg-surface-container-low flex justify-end">
              <button
                onClick={() => setIsDocModalOpen(false)}
                className="h-10 px-6 bg-secondary-container text-on-secondary-container font-label-md text-label-md hover:bg-secondary-fixed transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Vehicles;
