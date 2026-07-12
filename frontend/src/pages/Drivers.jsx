import React, { useEffect, useState } from 'react';
import client from '../api/client';

const Drivers = () => {
  const [drivers, setDrivers] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editId, setEditId] = useState(null);

  // Filters state
  const [statusFilter, setStatusFilter] = useState('');

  // Form State
  const [name, setName] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [licenseCategory, setLicenseCategory] = useState('');
  const [licenseExpiryDate, setLicenseExpiryDate] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [safetyScore, setSafetyScore] = useState('');
  const [status, setStatus] = useState('Available');
  const [userId, setUserId] = useState('');

  const fetchDrivers = async () => {
    setLoading(true);
    try {
      let query = '/drivers';
      if (statusFilter) {
        query += `?status=${statusFilter}`;
      }
      const [driversRes, usersRes] = await Promise.all([
        client.get(query),
        client.get('/auth/me').catch(() => null) // to list linkable users or mock users if needed
      ]);
      setDrivers(driversRes.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching drivers:', err);
      setError('Failed to fetch drivers. Please ensure database and backend are running.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, [statusFilter]);

  const handleOpenCreateModal = () => {
    setIsEditMode(false);
    setName('');
    setLicenseNumber('');
    setLicenseCategory('');
    setLicenseExpiryDate('');
    setContactNumber('');
    setSafetyScore('');
    setStatus('Available');
    setUserId('');
    setError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (driver) => {
    setIsEditMode(true);
    setEditId(driver.id);
    setName(driver.name);
    setLicenseNumber(driver.license_number);
    setLicenseCategory(driver.license_category);
    // Format expiry date to YYYY-MM-DD
    const dateObj = new Date(driver.license_expiry_date);
    const formattedDate = !isNaN(dateObj) ? dateObj.toISOString().split('T')[0] : '';
    setLicenseExpiryDate(formattedDate);
    setContactNumber(driver.contact_number);
    setSafetyScore(driver.safety_score);
    setStatus(driver.status);
    setUserId(driver.userId || '');
    setError('');
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this driver?')) return;
    try {
      await client.delete(`/drivers/${id}`);
      fetchDrivers();
    } catch (err) {
      console.error('Delete error:', err);
      alert(err.response?.data?.error || 'Failed to delete driver.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const payload = {
      name,
      license_number: licenseNumber,
      license_category: licenseCategory,
      license_expiry_date: licenseExpiryDate,
      contact_number: contactNumber,
      safety_score: parseFloat(safetyScore),
      status,
      userId: userId ? parseInt(userId) : null
    };

    try {
      if (isEditMode) {
        await client.put(`/drivers/${editId}`, payload);
      } else {
        await client.post('/drivers', payload);
      }
      setIsModalOpen(false);
      fetchDrivers();
    } catch (err) {
      console.error('Save error:', err);
      setError(err.response?.data?.error || 'Failed to save driver details.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-display text-on-surface">Drivers Management</h2>
          <p className="font-body-md text-body-md text-secondary mt-1">
            Manage drivers registration, track license expirations, and monitor safety logs.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenCreateModal}
            className="h-10 px-6 bg-primary text-white font-label-md text-label-md hover:opacity-90 transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">person_add</span>
            Add Driver
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
            <option value="OffDuty">Off Duty</option>
            <option value="Suspended">Suspended</option>
          </select>
        </div>
        {statusFilter && (
          <button
            onClick={() => setStatusFilter('')}
            className="ml-auto text-primary font-label-md text-label-md hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Main Drivers Table */}
      <div className="bg-white border border-outline-variant overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-secondary">Loading drivers data...</div>
        ) : drivers.length === 0 ? (
          <div className="p-8 text-center text-secondary">No drivers found. Try resetting filters or adding one.</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#F9FAFB] border-b border-outline-variant">
              <tr>
                <th className="px-gutter py-3 text-label-md font-label-md text-secondary uppercase tracking-wider">Driver Name</th>
                <th className="px-gutter py-3 text-label-md font-label-md text-secondary uppercase tracking-wider">License No</th>
                <th className="px-gutter py-3 text-label-md font-label-md text-secondary uppercase tracking-wider">Category</th>
                <th className="px-gutter py-3 text-label-md font-label-md text-secondary uppercase tracking-wider">License Expiry</th>
                <th className="px-gutter py-3 text-label-md font-label-md text-secondary uppercase tracking-wider">Contact</th>
                <th className="px-gutter py-3 text-label-md font-label-md text-secondary uppercase tracking-wider">Safety Score</th>
                <th className="px-gutter py-3 text-label-md font-label-md text-secondary uppercase tracking-wider">Status</th>
                <th className="px-gutter py-3 text-label-md font-label-md text-secondary uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {drivers.map((d) => {
                const isExpired = new Date(d.license_expiry_date) < new Date();
                return (
                  <tr key={d.id} className="hover:bg-surface-container-low transition-colors">
                    <td className="px-gutter py-4 font-bold text-on-surface">{d.name}</td>
                    <td className="px-gutter py-4 font-code text-secondary">{d.license_number}</td>
                    <td className="px-gutter py-4 font-body-md text-secondary">{d.license_category}</td>
                    <td className="px-gutter py-4 font-body-md text-secondary">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border mr-2 ${
                          isExpired ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'
                        }`}
                      >
                        {isExpired ? 'Expired' : 'Valid'}
                      </span>
                      {new Date(d.license_expiry_date).toLocaleDateString()}
                    </td>
                    <td className="px-gutter py-4 font-body-md text-secondary">{d.contact_number}</td>
                    <td className="px-gutter py-4 font-body-md text-on-surface font-semibold">{d.safety_score} / 100</td>
                    <td className="px-gutter py-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-[2px] text-[11px] font-bold border uppercase ${
                          d.status === 'Available'
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : d.status === 'OnTrip'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : d.status === 'Suspended'
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : 'bg-gray-100 text-gray-600 border-gray-300'
                        }`}
                      >
                        {d.status}
                      </span>
                    </td>
                    <td className="px-gutter py-4 text-right space-x-1">
                      <button
                        onClick={() => handleOpenEditModal(d)}
                        className="p-1 hover:bg-surface-container rounded text-secondary"
                      >
                        <span className="material-symbols-outlined text-lg">edit</span>
                      </button>
                      <button
                        onClick={() => handleDelete(d.id)}
                        className="p-1 hover:bg-surface-container rounded text-secondary"
                      >
                        <span className="material-symbols-outlined text-lg text-error">delete</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Add / Edit Driver Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-[2px] z-[60] flex items-center justify-center">
          <div className="bg-white w-full max-w-lg border border-outline-variant shadow-xl overflow-hidden rounded-lg">
            <div className="px-6 py-4 bg-surface border-b border-outline-variant flex items-center justify-between">
              <h3 className="font-headline text-headline text-on-surface">
                {isEditMode ? 'Edit Driver Profile' : 'Register New Driver'}
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
              <div className="space-y-1">
                <label className="block text-label-md font-bold text-secondary uppercase">Driver Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full h-8 px-3 border border-outline-variant rounded focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-label-md font-bold text-secondary uppercase">License Number</label>
                  <input
                    type="text"
                    required
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    placeholder="e.g. DL-998877"
                    className="w-full h-8 px-3 border border-outline-variant rounded focus:outline-none focus:border-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-label-md font-bold text-secondary uppercase">License Category</label>
                  <input
                    type="text"
                    required
                    value={licenseCategory}
                    onChange={(e) => setLicenseCategory(e.target.value)}
                    placeholder="e.g. Class A CDL"
                    className="w-full h-8 px-3 border border-outline-variant rounded focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-label-md font-bold text-secondary uppercase">Expiry Date</label>
                  <input
                    type="date"
                    required
                    value={licenseExpiryDate}
                    onChange={(e) => setLicenseExpiryDate(e.target.value)}
                    className="w-full h-8 px-3 border border-outline-variant rounded focus:outline-none focus:border-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-label-md font-bold text-secondary uppercase">Contact Number</label>
                  <input
                    type="text"
                    required
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    placeholder="e.g. 512-555-0199"
                    className="w-full h-8 px-3 border border-outline-variant rounded focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-label-md font-bold text-secondary uppercase">Safety Score (0-100)</label>
                  <input
                    type="number"
                    required
                    value={safetyScore}
                    onChange={(e) => setSafetyScore(e.target.value)}
                    placeholder="e.g. 95"
                    className="w-full h-8 px-3 border border-outline-variant rounded focus:outline-none focus:border-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-label-md font-bold text-secondary uppercase">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full h-8 px-3 border border-outline-variant rounded text-body-md focus:outline-none focus:border-primary"
                  >
                    <option value="Available">Available</option>
                    <option value="OnTrip">On Trip</option>
                    <option value="OffDuty">Off Duty</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                </div>
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
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Drivers;
