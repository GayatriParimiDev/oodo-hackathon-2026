import React, { useEffect, useState } from 'react';
import client from '../api/client';

const FuelExpenses = () => {
  const [activeTab, setActiveTab] = useState('fuel'); // 'fuel' or 'expenses'
  const [vehicles, setVehicles] = useState([]);
  const [fuelLogs, setFuelLogs] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals state
  const [isFuelModalOpen, setIsFuelModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

  // Fuel Form State
  const [fuelVehicleId, setFuelVehicleId] = useState('');
  const [liters, setLiters] = useState('');
  const [fuelCost, setFuelCost] = useState('');
  const [fuelLogDate, setFuelLogDate] = useState('');

  // Expense Form State
  const [expVehicleId, setExpVehicleId] = useState('');
  const [category, setCategory] = useState('toll');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [vRes, fRes, eRes] = await Promise.all([
        client.get('/vehicles'),
        client.get('/fuel-logs'),
        client.get('/expenses'),
      ]);
      setVehicles(vRes.data);
      setFuelLogs(fRes.data);
      setExpenses(eRes.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching fuel/expenses data:', err);
      setError('Failed to fetch entries. Ensure database is running.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateFuelLog = async (e) => {
    e.preventDefault();
    setError('');

    const payload = {
      vehicle_id: fuelVehicleId,
      liters: parseFloat(liters),
      cost: parseFloat(fuelCost),
      log_date: fuelLogDate,
    };

    try {
      await client.post('/fuel-logs', payload);
      setIsFuelModalOpen(false);
      fetchData();
    } catch (err) {
      console.error('Save fuel log error:', err);
      setError(err.response?.data?.error || 'Failed to record fuel log.');
    }
  };

  const handleCreateExpense = async (e) => {
    e.preventDefault();
    setError('');

    const payload = {
      vehicle_id: expVehicleId || null,
      category,
      amount: parseFloat(amount),
      description,
    };

    try {
      await client.post('/expenses', payload);
      setIsExpenseModalOpen(false);
      fetchData();
    } catch (err) {
      console.error('Save expense error:', err);
      setError(err.response?.data?.error || 'Failed to record expense.');
    }
  };

  // Calculations
  const totalFuelCost = fuelLogs.reduce((acc, curr) => acc + Number(curr.cost || 0), 0);
  const totalExpenseCost = expenses.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-display text-on-surface">Fuel &amp; Expense Logging</h2>
          <p className="font-body-md text-body-md text-secondary mt-1">
            Track fuel fill-ups, toll fees, maintenance logs, and general operating expenditures.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {activeTab === 'fuel' ? (
            <button
              onClick={() => {
                setFuelVehicleId('');
                setLiters('');
                setFuelCost('');
                setFuelLogDate(new Date().toISOString().split('T')[0]);
                setError('');
                setIsFuelModalOpen(true);
              }}
              className="bg-primary text-on-primary font-label-md text-label-md px-6 py-2 rounded flex items-center gap-2 hover:opacity-95"
            >
              <span className="material-symbols-outlined text-[18px]">local_gas_station</span>
              Log Fuel Purchase
            </button>
          ) : (
            <button
              onClick={() => {
                setExpVehicleId('');
                setCategory('toll');
                setAmount('');
                setDescription('');
                setError('');
                setIsExpenseModalOpen(true);
              }}
              className="bg-primary text-on-primary font-label-md text-label-md px-6 py-2 rounded flex items-center gap-2 hover:opacity-95"
            >
              <span className="material-symbols-outlined text-[18px]">add_card</span>
              Record Expense
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-outline-variant">
        <button
          onClick={() => setActiveTab('fuel')}
          className={`px-6 py-3 font-title-md text-title-md border-b-2 transition-all ${
            activeTab === 'fuel' ? 'border-primary text-primary font-bold' : 'border-transparent text-secondary hover:text-on-surface'
          }`}
        >
          Fuel Purchases (₹{Number(totalFuelCost || 0).toFixed(2)})
        </button>
        <button
          onClick={() => setActiveTab('expenses')}
          className={`px-6 py-3 font-title-md text-title-md border-b-2 transition-all ${
            activeTab === 'expenses' ? 'border-primary text-primary font-bold' : 'border-transparent text-secondary hover:text-on-surface'
          }`}
        >
          General Expenses (₹{Number(totalExpenseCost || 0).toFixed(2)})
        </button>
      </div>

      {/* Warning/Error alert */}
      {error && (
        <div className="p-3 bg-error-container/20 border border-error/20 text-error rounded text-body-sm">
          {error}
        </div>
      )}

      {/* Tab Contents */}
      {loading ? (
        <div className="p-8 text-center text-secondary">Loading records...</div>
      ) : activeTab === 'fuel' ? (
        <div className="bg-white border border-outline-variant rounded overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant">
                <th className="px-gutter py-3 font-label-md text-label-md uppercase text-secondary">Date</th>
                <th className="px-gutter py-3 font-label-md text-label-md uppercase text-secondary">Vehicle</th>
                <th className="px-gutter py-3 font-label-md text-label-md uppercase text-secondary text-right">Liters</th>
                <th className="px-gutter py-3 font-label-md text-label-md uppercase text-secondary text-right">Odometer</th>
                <th className="px-gutter py-3 font-label-md text-label-md uppercase text-secondary text-right">Total Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant text-body-sm">
              {fuelLogs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-secondary">No fuel logs logged.</td>
                </tr>
              ) : (
                fuelLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-surface-container-low/50">
                    <td className="px-gutter py-3 text-secondary">{new Date(log.log_date).toLocaleDateString()}</td>
                    <td className="px-gutter py-3 font-bold text-on-surface">
                      {log.vehicle.name_model} ({log.vehicle.registration_number})
                    </td>
                    <td className="px-gutter py-3 text-right font-code text-secondary">{log.liters} L</td>
                    <td className="px-gutter py-3 text-right font-code text-secondary">{log.odometer} km</td>
                    <td className="px-gutter py-3 text-right font-bold text-primary">₹{Number(log.cost || 0).toFixed(2)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white border border-outline-variant rounded overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant">
                <th className="px-gutter py-3 font-label-md text-label-md uppercase text-secondary">Date</th>
                <th className="px-gutter py-3 font-label-md text-label-md uppercase text-secondary">Category</th>
                <th className="px-gutter py-3 font-label-md text-label-md uppercase text-secondary">Description</th>
                <th className="px-gutter py-3 font-label-md text-label-md uppercase text-secondary">Vehicle</th>
                <th className="px-gutter py-3 font-label-md text-label-md uppercase text-secondary text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant text-body-sm">
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-secondary">No general expenses recorded.</td>
                </tr>
              ) : (
                expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-surface-container-low/50">
                    <td className="px-gutter py-3 text-secondary">{new Date(exp.expense_date).toLocaleDateString()}</td>
                    <td className="px-gutter py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-secondary-container text-on-secondary-container uppercase">
                        {exp.category}
                      </span>
                    </td>
                    <td className="px-gutter py-3 text-on-surface">{exp.description}</td>
                    <td className="px-gutter py-3 text-secondary">
                      {exp.vehicle ? `${exp.vehicle.name_model} (${exp.vehicle.registration_number})` : '—'}
                    </td>
                    <td className="px-gutter py-3 text-right font-bold text-primary">₹{Number(exp.amount || 0).toFixed(2)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Fuel Log Modal */}
      {isFuelModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm" onClick={() => setIsFuelModalOpen(false)}></div>
          <div className="relative bg-surface-container-lowest border border-outline-variant w-full max-w-md shadow-xl rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-outline-variant flex items-center justify-between bg-surface-container-low">
              <h3 className="font-title-md text-title-md text-on-surface">Log Fuel Purchase</h3>
              <button className="text-on-surface-variant" onClick={() => setIsFuelModalOpen(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleCreateFuelLog} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="block text-label-md font-bold text-secondary uppercase">Assign Vehicle</label>
                <select
                  required
                  value={fuelVehicleId}
                  onChange={(e) => setFuelVehicleId(e.target.value)}
                  className="w-full h-8 px-3 border border-outline-variant rounded focus:outline-none"
                >
                  <option value="">Select vehicle...</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name_model} ({v.registration_number})
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="block text-label-md font-bold text-secondary uppercase">Quantity (Liters)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={liters}
                  onChange={(e) => setLiters(e.target.value)}
                  placeholder="e.g. 45.2"
                  className="w-full h-8 px-3 border border-outline-variant rounded focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-label-md font-bold text-secondary uppercase">Total Cost (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={fuelCost}
                  onChange={(e) => setFuelCost(e.target.value)}
                  placeholder="0.00"
                  className="w-full h-8 px-3 border border-outline-variant rounded focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-label-md font-bold text-secondary uppercase">Date of Fill-up</label>
                <input
                  type="date"
                  required
                  value={fuelLogDate}
                  onChange={(e) => setFuelLogDate(e.target.value)}
                  className="w-full h-8 px-3 border border-outline-variant rounded focus:outline-none"
                />
              </div>
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsFuelModalOpen(false)}
                  className="flex-1 bg-secondary-container text-on-secondary-container font-label-md py-2.5 rounded hover:opacity-90"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-primary text-on-primary font-label-md py-2.5 rounded hover:opacity-95"
                >
                  Log Purchase
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Expense Modal */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm" onClick={() => setIsExpenseModalOpen(false)}></div>
          <div className="relative bg-surface-container-lowest border border-outline-variant w-full max-w-md shadow-xl rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-outline-variant flex items-center justify-between bg-surface-container-low">
              <h3 className="font-title-md text-title-md text-on-surface">Record General Expense</h3>
              <button className="text-on-surface-variant" onClick={() => setIsExpenseModalOpen(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleCreateExpense} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="block text-label-md font-bold text-secondary uppercase">Category</label>
                <select
                  required
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full h-8 px-3 border border-outline-variant rounded focus:outline-none"
                >
                  <option value="toll">Tolls &amp; Weighing</option>
                  <option value="maintenance">Maintenance &amp; Spares</option>
                  <option value="other">Other fee</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="block text-label-md font-bold text-secondary uppercase">Associated Vehicle (Optional)</label>
                <select
                  value={expVehicleId}
                  onChange={(e) => setExpVehicleId(e.target.value)}
                  className="w-full h-8 px-3 border border-outline-variant rounded focus:outline-none"
                >
                  <option value="">None / Fleet Global</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name_model} ({v.registration_number})
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="block text-label-md font-bold text-secondary uppercase">Amount (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full h-8 px-3 border border-outline-variant rounded focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-label-md font-bold text-secondary uppercase">Description / Comments</label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Austin South Toll gate payment"
                  className="w-full h-8 px-3 border border-outline-variant rounded focus:outline-none"
                />
              </div>
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="flex-1 bg-secondary-container text-on-secondary-container font-label-md py-2.5 rounded hover:opacity-90"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-primary text-on-primary font-label-md py-2.5 rounded hover:opacity-95"
                >
                  Log Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FuelExpenses;
