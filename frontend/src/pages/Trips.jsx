import React, { useEffect, useState } from 'react';
import client from '../api/client';

const Trips = () => {
  const [trips, setTrips] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCompleteOpen, setIsCompleteOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');

  // Create Form State
  const [tripNumber, setTripNumber] = useState('');
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [driverId, setDriverId] = useState('');
  const [cargoWeight, setCargoWeight] = useState('');
  const [plannedDistance, setPlannedDistance] = useState('');
  const [startOdometer, setStartOdometer] = useState('');
  const [dispatchImmediately, setDispatchImmediately] = useState(false);

  // Complete Form State
  const [finalOdometer, setFinalOdometer] = useState('');
  const [fuelConsumed, setFuelConsumed] = useState('');
  const [revenue, setRevenue] = useState('');

  const fetchTrips = async () => {
    try {
      let query = '/trips';
      if (statusFilter) {
        query += `?status=${statusFilter}`;
      }
      const res = await client.get(query);
      setTrips(res.data);
    } catch (err) {
      console.error('Error fetching trips:', err);
      setError('Failed to fetch trips. Make sure the database is running.');
    }
  };

  const fetchAssets = async () => {
    try {
      const [vRes, dRes] = await Promise.all([
        client.get('/vehicles'),
        client.get('/drivers')
      ]);
      setVehicles(vRes.data);
      setDrivers(dRes.data);
    } catch (err) {
      console.error('Error fetching vehicle/driver lists:', err);
    }
  };

  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      await Promise.all([fetchTrips(), fetchAssets()]);
      setLoading(false);
    };
    initData();
  }, [statusFilter]);

  const handleOpenCreate = () => {
    // Autogenerate a trip number
    setTripNumber(`TRP-${Math.floor(1000 + Math.random() * 9000)}`);
    setSource('');
    setDestination('');
    setVehicleId('');
    setDriverId('');
    setCargoWeight('');
    setPlannedDistance('');
    setStartOdometer('');
    setDispatchImmediately(false);
    setError('');
    setIsCreateOpen(true);
  };

  const handleCreateTrip = async (e) => {
    e.preventDefault();
    setError('');

    const payload = {
      trip_number: tripNumber,
      source,
      destination,
      vehicle_id: vehicleId,
      driver_id: driverId,
      cargo_weight: parseFloat(cargoWeight),
      planned_distance: parseFloat(plannedDistance),
      start_odometer: startOdometer ? parseFloat(startOdometer) : null,
      status: dispatchImmediately ? 'Dispatched' : 'Draft',
    };

    try {
      await client.post('/trips', payload);
      setIsCreateOpen(false);
      fetchTrips();
      fetchAssets(); // Refresh vehicle/driver availabilities
    } catch (err) {
      console.error('Create trip error:', err);
      setError(err.response?.data?.error || 'Failed to record trip.');
    }
  };

  const handleOpenComplete = (trip) => {
    setSelectedTrip(trip);
    setFinalOdometer('');
    setFuelConsumed('');
    setRevenue('');
    setError('');
    setIsCompleteOpen(true);
  };

  const handleCompleteTrip = async (e) => {
    e.preventDefault();
    setError('');

    const payload = {
      status: 'Completed',
      final_odometer: parseFloat(finalOdometer),
      fuel_consumed: parseFloat(fuelConsumed),
      revenue: parseFloat(revenue),
    };

    try {
      await client.put(`/trips/${selectedTrip.id}`, payload);
      setIsCompleteOpen(false);
      fetchTrips();
      fetchAssets();
    } catch (err) {
      console.error('Complete trip error:', err);
      setError(err.response?.data?.error || 'Failed to complete trip.');
    }
  };

  const handleCancelTrip = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this trip?')) return;
    try {
      await client.put(`/trips/${id}`, { status: 'Cancelled' });
      fetchTrips();
      fetchAssets();
    } catch (err) {
      console.error('Cancel trip error:', err);
      alert(err.response?.data?.error || 'Failed to cancel trip.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-display text-on-surface">Trips Management</h2>
          <p className="font-body-md text-body-md text-secondary mt-1">
            Dispatch cargo, assign drivers and vehicles, and update delivery statuses.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center border border-outline-variant rounded bg-white overflow-hidden">
            <div className="px-3 py-2 border-r border-outline-variant bg-surface-container-low">
              <span className="material-symbols-outlined text-[18px]">filter_list</span>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent border-none font-label-md text-label-md py-2 px-3 pr-8 focus:ring-0"
            >
              <option value="">All Statuses</option>
              <option value="Draft">Draft</option>
              <option value="Dispatched">Dispatched</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
          <button
            onClick={handleOpenCreate}
            className="bg-primary text-on-primary font-label-md text-label-md px-6 py-2 rounded flex items-center gap-2 hover:opacity-95 transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Create Trip
          </button>
        </div>
      </div>

      {/* Main Trips List Table */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-secondary">Loading trips database...</div>
        ) : trips.length === 0 ? (
          <div className="p-8 text-center text-secondary">No trip records found.</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant">
                <th className="px-cell_padding_x py-3 font-label-md text-label-md uppercase text-secondary">Trip No.</th>
                <th className="px-cell_padding_x py-3 font-label-md text-label-md uppercase text-secondary">Vehicle</th>
                <th className="px-cell_padding_x py-3 font-label-md text-label-md uppercase text-secondary">Driver</th>
                <th className="px-cell_padding_x py-3 font-label-md text-label-md uppercase text-secondary">Route (Source → Dest)</th>
                <th className="px-cell_padding_x py-3 font-label-md text-label-md uppercase text-secondary">Cargo</th>
                <th className="px-cell_padding_x py-3 font-label-md text-label-md uppercase text-secondary">Status</th>
                <th className="px-cell_padding_x py-3 font-label-md text-label-md uppercase text-secondary text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {trips.map((trip) => {
                const vehicleWarning = trip.vehicle.status === 'InShop' || trip.vehicle.status === 'Retired';
                const driverWarning = trip.driver.status === 'Suspended' || new Date(trip.driver.license_expiry_date) < new Date();

                return (
                  <tr
                    key={trip.id}
                    className={`hover:bg-surface-container-low transition-colors group ${
                      trip.status === 'Draft' && (vehicleWarning || driverWarning) ? 'bg-surface-container/30 opacity-60' : ''
                    }`}
                  >
                    <td className="px-cell_padding_x py-4 font-code text-code text-primary font-bold">{trip.trip_number}</td>
                    <td className="px-cell_padding_x py-4">
                      <div className="flex flex-col">
                        <span className="font-title-md text-title-md text-on-surface">{trip.vehicle.name_model}</span>
                        <span className="text-[11px] text-on-surface-variant flex items-center gap-1">
                          {trip.vehicle.registration_number}
                          {vehicleWarning && (
                            <span className="px-1.5 py-0.2 bg-error-container text-on-error-container text-[8px] font-bold rounded">
                              {trip.vehicle.status}
                            </span>
                          )}
                        </span>
                      </div>
                    </td>
                    <td className="px-cell_padding_x py-4">
                      <div className="flex flex-col">
                        <span className="font-body-md text-body-md">{trip.driver.name}</span>
                        {driverWarning && (
                          <span className="text-error font-label-sm text-[9px] font-bold">
                            {trip.driver.status === 'Suspended' ? 'SUSPENDED' : 'EXPIRED LICENSE'}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-cell_padding_x py-4">
                      <div className="flex flex-col">
                        <span className="font-body-sm text-body-sm">{trip.source}</span>
                        <span className="text-secondary text-[11px]">→ {trip.destination} ({trip.planned_distance} km)</span>
                      </div>
                    </td>
                    <td className="px-cell_padding_x py-4 font-body-sm text-body-sm">{trip.cargo_weight} kg</td>
                    <td className="px-cell_padding_x py-4">
                      <span
                        className={`px-3 py-1 rounded-full font-label-sm text-label-sm ${
                          trip.status === 'Draft'
                            ? 'bg-surface-variant text-on-surface-variant'
                            : trip.status === 'Dispatched'
                            ? 'bg-blue-100 text-blue-700'
                            : trip.status === 'Completed'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {trip.status}
                      </span>
                    </td>
                    <td className="px-cell_padding_x py-4 text-right">
                      {trip.status === 'Dispatched' && (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleOpenComplete(trip)}
                            className="text-primary hover:bg-primary/5 px-3 py-1 rounded font-label-sm text-label-sm transition-all border border-primary"
                          >
                            Complete
                          </button>
                          <button
                            onClick={() => handleCancelTrip(trip.id)}
                            className="text-error hover:bg-error-container/20 px-3 py-1 rounded font-label-sm text-label-sm transition-all border border-error/20"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                      {trip.status === 'Draft' && (
                        <div className="flex justify-end gap-2">
                          {!(vehicleWarning || driverWarning) ? (
                            <button
                              onClick={async () => {
                                try {
                                  await client.put(`/trips/${trip.id}`, { status: 'Dispatched' });
                                  fetchTrips();
                                  fetchAssets();
                                } catch (e) {
                                  alert(e.response?.data?.error || 'Failed to dispatch.');
                                }
                              }}
                              className="text-primary hover:bg-primary/5 px-3 py-1 rounded font-label-sm text-label-sm border border-primary"
                            >
                              Dispatch
                            </button>
                          ) : (
                            <span className="material-symbols-outlined text-outline cursor-not-allowed" title="Assigned resources are unavailable.">
                              lock
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Trip Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm" onClick={() => setIsCreateOpen(false)}></div>
          <div className="relative bg-surface-container-lowest border border-outline-variant w-full max-w-2xl shadow-xl rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-outline-variant bg-surface-container-low flex items-center justify-between">
              <h3 className="font-title-md text-title-md">Create New Trip Record</h3>
              <button className="text-on-surface-variant" onClick={() => setIsCreateOpen(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {error && (
              <div className="mx-6 mt-4 p-3 bg-error-container/20 border border-error/20 text-error rounded text-body-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateTrip} className="p-6 grid grid-cols-2 gap-4">
              <div className="col-span-2 md:col-span-1 space-y-1">
                <label className="font-label-md text-label-md text-on-surface-variant uppercase">Assign Vehicle</label>
                <select
                  required
                  value={vehicleId}
                  onChange={(e) => setVehicleId(e.target.value)}
                  className="w-full h-8 px-3 bg-surface border border-outline-variant rounded font-body-md"
                >
                  <option value="">Select vehicle...</option>
                  {vehicles.map((v) => {
                    const isDisabled = v.status !== 'Available';
                    return (
                      <option key={v.id} value={v.id} disabled={isDisabled} className={isDisabled ? 'text-error' : ''}>
                        {v.name_model} ({v.registration_number}) - {v.status} (Max: {v.max_load_capacity}kg)
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="col-span-2 md:col-span-1 space-y-1">
                <label className="font-label-md text-label-md text-on-surface-variant uppercase">Assign Driver</label>
                <select
                  required
                  value={driverId}
                  onChange={(e) => setDriverId(e.target.value)}
                  className="w-full h-8 px-3 bg-surface border border-outline-variant rounded font-body-md"
                >
                  <option value="">Select driver...</option>
                  {drivers.map((d) => {
                    const isExpired = new Date(d.license_expiry_date) < new Date();
                    const isDisabled = d.status !== 'Available' || isExpired;
                    return (
                      <option key={d.id} value={d.id} disabled={isDisabled} className={isDisabled ? 'text-error' : ''}>
                        {d.name} - {isDisabled ? (isExpired ? 'Expired License' : d.status) : 'Available'} (Score: {d.safety_score})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="col-span-2 md:col-span-1 space-y-1">
                <label className="font-label-md text-label-md text-on-surface-variant uppercase">Source Location</label>
                <input
                  type="text"
                  required
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  placeholder="e.g. Austin Port"
                  className="w-full bg-surface border border-outline-variant rounded px-3 py-1.5 font-body-md outline-none"
                />
              </div>

              <div className="col-span-2 md:col-span-1 space-y-1">
                <label className="font-label-md text-label-md text-on-surface-variant uppercase">Destination Location</label>
                <input
                  type="text"
                  required
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="e.g. Dallas Warehouse"
                  className="w-full bg-surface border border-outline-variant rounded px-3 py-1.5 font-body-md outline-none"
                />
              </div>

              <div className="col-span-2 md:col-span-1 space-y-1">
                <label className="font-label-md text-label-md text-on-surface-variant uppercase">Cargo Weight (kg)</label>
                <input
                  type="number"
                  required
                  value={cargoWeight}
                  onChange={(e) => setCargoWeight(e.target.value)}
                  placeholder="e.g. 500"
                  className="w-full bg-surface border border-outline-variant rounded px-3 py-1.5 font-body-md outline-none"
                />
              </div>

              <div className="col-span-2 md:col-span-1 space-y-1">
                <label className="font-label-md text-label-md text-on-surface-variant uppercase">Planned Distance (km)</label>
                <input
                  type="number"
                  required
                  value={plannedDistance}
                  onChange={(e) => setPlannedDistance(e.target.value)}
                  placeholder="e.g. 350"
                  className="w-full bg-surface border border-outline-variant rounded px-3 py-1.5 font-body-md outline-none"
                />
              </div>

              <div className="col-span-2 md:col-span-1 space-y-1">
                <label className="font-label-md text-label-md text-on-surface-variant uppercase">Start Odometer (km)</label>
                <input
                  type="number"
                  value={startOdometer}
                  onChange={(e) => setStartOdometer(e.target.value)}
                  placeholder="Leave empty to use vehicle current odometer"
                  className="w-full bg-surface border border-outline-variant rounded px-3 py-1.5 font-body-md outline-none"
                />
              </div>

              <div className="col-span-2 flex items-center gap-2 py-2">
                <input
                  type="checkbox"
                  id="dispatchImmediately"
                  checked={dispatchImmediately}
                  onChange={(e) => setDispatchImmediately(e.target.checked)}
                  className="w-4 h-4 text-primary focus:ring-primary border-outline-variant rounded"
                />
                <label htmlFor="dispatchImmediately" className="font-label-md text-on-surface select-none">
                  Dispatch immediately (skips draft state)
                </label>
              </div>

              <div className="col-span-2 flex justify-end gap-3 mt-4 border-t border-outline-variant pt-4">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-6 py-2 border border-outline-variant rounded font-label-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-primary text-on-primary rounded font-label-md hover:opacity-95"
                >
                  Save Trip Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Complete Trip Modal */}
      {isCompleteOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" id="completeTripModal">
          <div className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm" onClick={() => setIsCompleteOpen(false)}></div>
          <div className="relative bg-surface-container-lowest border border-outline-variant w-full max-w-md shadow-xl rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-outline-variant flex items-center justify-between bg-surface-container-low">
              <h3 className="font-title-md text-title-md text-on-surface">Complete Trip: {selectedTrip?.trip_number}</h3>
              <button className="text-on-surface-variant hover:text-on-surface" onClick={() => setIsCompleteOpen(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {error && (
              <div className="mx-6 mt-4 p-3 bg-error-container/20 border border-error/20 text-error rounded text-body-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleCompleteTrip} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="block font-label-md text-label-md text-on-surface-variant uppercase">Final Odometer (km)</label>
                <input
                  type="number"
                  required
                  value={finalOdometer}
                  onChange={(e) => setFinalOdometer(e.target.value)}
                  placeholder={`Should be > start odometer (${selectedTrip?.start_odometer || selectedTrip?.vehicle?.odometer})`}
                  className="w-full bg-surface border border-outline-variant rounded px-3 py-2 font-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="block font-label-md text-label-md text-on-surface-variant uppercase">Fuel Consumed (Liters)</label>
                <input
                  type="number"
                  required
                  value={fuelConsumed}
                  onChange={(e) => setFuelConsumed(e.target.value)}
                  placeholder="Enter fuel usage in liters"
                  className="w-full bg-surface border border-outline-variant rounded px-3 py-2 font-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="block font-label-md text-label-md text-on-surface-variant uppercase">Trip Revenue ($)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant font-label-md">$</span>
                  <input
                    type="number"
                    required
                    value={revenue}
                    onChange={(e) => setRevenue(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-surface border border-outline-variant rounded pl-8 pr-3 py-2 font-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  className="flex-1 bg-secondary-container text-on-secondary-container font-label-md py-2.5 rounded hover:opacity-90"
                  onClick={() => setIsCompleteOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-primary text-on-primary font-label-md py-2.5 rounded hover:bg-primary-container transition-all"
                >
                  Submit Details
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Trips;
