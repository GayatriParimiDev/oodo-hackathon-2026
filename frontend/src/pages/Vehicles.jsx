import React, { useEffect, useState } from 'react';
import client from '../api/client';

const Vehicles = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editId, setEditId] = useState(null);

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
                  <td className="px-gutter py-4 font-code text-code text-on-surface">{v.registration_number}</td>
                  <td className="px-gutter py-4 font-title-md text-title-md text-on-surface">{v.name_model}</td>
                  <td className="px-gutter py-4 font-body-md text-body-md text-secondary">{v.type}</td>
                  <td className="px-gutter py-4 font-body-md text-body-md text-secondary">{v.max_load_capacity} kg</td>
                  <td className="px-gutter py-4 font-body-md text-body-md text-secondary">{v.odometer} km</td>
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
                      onClick={() => handleOpenEditModal(v)}
                      className="p-1 hover:bg-surface-container rounded text-secondary"
                    >
                      <span className="material-symbols-outlined text-lg">edit</span>
                    </button>
                    <button
                      onClick={() => handleDelete(v.id)}
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
                    className="w-full h-8 px-3 border border-outline-variant rounded text-body-md focus:outline-none focus:border-primary"
                  >
                    <option>Transit Bus</option>
                    <option>Cargo Van</option>
                    <option>Heavy Truck</option>
                    <option>Light Courier</option>
                    <option>Van</option>
                    <option>Semi Truck</option>
                    <option>Box Truck</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-label-md font-bold text-secondary uppercase">Region Assignment</label>
                  <select
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className="w-full h-8 px-3 border border-outline-variant rounded text-body-md focus:outline-none focus:border-primary"
                  >
                    <option>Central Metro</option>
                    <option>North-East</option>
                    <option>South-West</option>
                    <option>Coastline</option>
                    <option>Austin</option>
                    <option>Houston</option>
                    <option>Dallas</option>
                    <option>San Antonio</option>
                    <option>El Paso</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="block text-label-md font-bold text-secondary uppercase">Max Load (kg)</label>
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
                  <label className="block text-label-md font-bold text-secondary uppercase">Odometer (km)</label>
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
                  <label className="block text-label-md font-bold text-secondary uppercase">Acquisition Cost (₹)</label>
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
    </div>
  );
};

export default Vehicles;
