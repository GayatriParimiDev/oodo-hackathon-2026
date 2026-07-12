import React, { useEffect, useState } from 'react';
import client from '../api/client';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [chartsData, setChartsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Local State mock records for list previews (since database might start empty)
  const [recentTrips, setRecentTrips] = useState([]);
  const [maintenanceQueue, setMaintenanceQueue] = useState([]);
  const [expiredLicenses, setExpiredLicenses] = useState([]);
  const [realFuelEfficiency, setRealFuelEfficiency] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, chartsRes, tripsRes, maintenanceRes, driversRes, vehiclesRes] = await Promise.all([
          client.get('/dashboard/stats'),
          client.get('/dashboard/charts'),
          client.get('/trips?limit=5'),
          client.get('/maintenance?status=Active'),
          client.get('/drivers'),
          client.get('/vehicles'),
        ]);

        setStats(statsRes.data);
        setChartsData(chartsRes.data);
        setRecentTrips(tripsRes.data.slice(0, 5));
        setMaintenanceQueue(maintenanceRes.data.slice(0, 5));
        
        // Find expired or expiring soon driver licenses
        const today = new Date();
        const flaggedDrivers = driversRes.data
          .filter(d => new Date(d.license_expiry_date) < today || d.status === 'Suspended')
          .slice(0, 5);
        setExpiredLicenses(flaggedDrivers);

        // Build real fuel efficiency from vehicles data
        const vehicleEfficiencies = vehiclesRes.data
          .map(v => {
            const completedTrips = (v.trips || []).filter(t => t.status === 'Completed');
            const totalDist = completedTrips.reduce((a, t) => a + parseFloat(t.planned_distance || 0), 0);
            const totalFuel = completedTrips.reduce((a, t) => a + parseFloat(t.fuel_consumed || 0), 0);
            const fuelFromLogs = (v.fuelLogs || []).reduce((a, f) => a + parseFloat(f.liters || 0), 0);
            const allFuel = totalFuel + fuelFromLogs;
            return allFuel > 0 ? totalDist / allFuel : null;
          })
          .filter(e => e !== null);

        const avgEfficiency = vehicleEfficiencies.length > 0
          ? vehicleEfficiencies.reduce((a, b) => a + b, 0) / vehicleEfficiencies.length
          : 0;
        setRealFuelEfficiency(parseFloat(avgEfficiency.toFixed(2)));
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load live dashboard statistics. Make sure the database is running.');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-120px)]">
        <p className="text-secondary text-title-md font-bold">Loading dashboard data...</p>
      </div>
    );
  }

  // Pre-prepared chart color palette matching TransitOps theme
  const COLORS = ['#57344f', '#34451e', '#555f6d', '#ffd7f1'];

  // Safe fallback counts
  const summary = stats?.summary || {
    totalVehicles: 0,
    totalDrivers: 0,
    totalTrips: 0,
    activeMaintenance: 0
  };

  // Safe fallback utilization
  const utilization = chartsData?.fleetUtilization?.utilizationRate || 0;

  // Formatting donut data
  const donutData = chartsData?.expensesBreakdown || [
    { category: 'toll', totalAmount: 1000 },
    { category: 'maintenance', totalAmount: 2500 },
    { category: 'other', totalAmount: 1500 }
  ];

  // Build real utilization chart from vehiclesByStatus DB data
  const statusOrder = ['Available', 'OnTrip', 'InShop', 'Retired'];
  const utilization24h = statusOrder.map(s => ({
    hour: s,
    rate: stats?.vehiclesByStatus?.find(v => v.status === s)?._count || 0
  }));

  // Real fuel efficiency chart — single data point + trend context
  const fuelEfficiencyTrend = [
    { week: 'Fleet Avg', mpg: realFuelEfficiency },
    { week: 'Target', mpg: 6.5 },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner Message */}
      {error && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-lg text-body-md flex items-center justify-between">
          <span>{error} Showing demo mock previews.</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 py-2 border-b border-outline-variant">
        <div>
          <h2 className="font-display text-display text-on-surface">Operations Dashboard</h2>
          <p className="font-body-md text-secondary mt-1">Real-time status overview of the TransitOps fleet.</p>
        </div>
        <div className="flex items-center gap-2">
          <select className="h-8 px-2 border border-outline-variant rounded bg-white text-body-sm focus:ring-0 focus:border-primary">
            <option>All Regions</option>
            <option>Austin</option>
            <option>Houston</option>
            <option>Dallas</option>
          </select>
          <button className="h-8 px-4 bg-primary text-white font-label-md text-label-md rounded flex items-center gap-2 hover:opacity-90">
            <span className="material-symbols-outlined text-[18px]">add</span>
            New Dispatch
          </button>
        </div>
      </div>

      {/* KPI Summary Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <div className="p-4 border border-outline-variant rounded bg-white">
          <p className="text-secondary font-label-md text-label-md uppercase tracking-tight">Total Fleet</p>
          <div className="flex items-end justify-between mt-1">
            <p className="font-display text-display text-primary">{summary.totalVehicles}</p>
            <span className="text-[10px] text-outline font-bold">UNITS</span>
          </div>
        </div>
        <div className="p-4 border border-outline-variant rounded bg-white">
          <p className="text-secondary font-label-md text-label-md uppercase tracking-tight">Available</p>
          <div className="flex items-end justify-between mt-1">
            <p className="font-display text-display text-secondary">
              {stats?.vehiclesByStatus?.find(v => v.status === 'Available')?._count || 0}
            </p>
            <span className="text-[10px] text-outline font-bold">READY</span>
          </div>
        </div>
        <div className="p-4 border border-outline-variant rounded bg-white">
          <p className="text-secondary font-label-md text-label-md uppercase tracking-tight">In Shop</p>
          <div className="flex items-end justify-between mt-1">
            <p className="font-display text-display text-error">{summary.activeMaintenance}</p>
            <span className="text-[10px] text-error font-bold flex items-center">
              <span className="material-symbols-outlined text-[14px]">warning</span>
            </span>
          </div>
        </div>
        <div className="p-4 border border-outline-variant rounded bg-white">
          <p className="text-secondary font-label-md text-label-md uppercase tracking-tight">Active Trips</p>
          <div className="flex items-end justify-between mt-1">
            <p className="font-display text-display text-primary">
              {stats?.tripsByStatus?.find(t => t.status === 'Dispatched')?._count || 0}
            </p>
            <span className="text-[10px] text-green-600 font-bold">LIVE</span>
          </div>
        </div>
        <div className="p-4 border border-outline-variant rounded bg-white">
          <p className="text-secondary font-label-md text-label-md uppercase tracking-tight">Pending Trips</p>
          <div className="flex items-end justify-between mt-1">
            <p className="font-display text-display text-tertiary">
              {stats?.tripsByStatus?.find(t => t.status === 'Draft')?._count || 0}
            </p>
            <span className="text-[10px] text-outline font-bold">DRAFT</span>
          </div>
        </div>
        <div className="p-4 border border-outline-variant rounded bg-white">
          <p className="text-secondary font-label-md text-label-md uppercase tracking-tight">Total Staff</p>
          <div className="flex items-end justify-between mt-1">
            <p className="font-display text-display text-on-surface">{summary.totalDrivers}</p>
            <span className="text-[10px] text-outline font-bold">DUTY</span>
          </div>
        </div>
        <div className="p-4 border border-outline-variant rounded bg-white bg-primary-container/5">
          <p className="text-primary font-label-md text-label-md uppercase tracking-tight">Utilization %</p>
          <div className="flex items-end justify-between mt-1">
            <p className="font-display text-display text-primary">{utilization}%</p>
            <span className="text-[10px] text-primary font-bold">RATE</span>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Realtime Fleet Load Chart */}
        <div className="col-span-12 lg:col-span-8 p-6 border border-outline-variant rounded bg-white">
          <h3 className="font-title-md text-title-md text-on-surface mb-6">Fleet Status Breakdown (Live)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={utilization24h} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#edeeef" />
                <XAxis dataKey="hour" stroke="#80747a" fontSize={11} tickLine={false} />
                <YAxis stroke="#80747a" fontSize={11} tickLine={false} unit=" veh" />
                <Tooltip cursor={{ fill: '#f3f4f5' }} />
                <Bar dataKey="rate" fill="#57344f" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cost Distribution Chart */}
        <div className="col-span-12 lg:col-span-4 p-6 border border-outline-variant rounded bg-white flex flex-col">
          <h3 className="font-title-md text-title-md text-on-surface mb-6">Operational Expense Mix</h3>
          <div className="h-48 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="totalAmount"
                  nameKey="category"
                >
                  {donutData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `₹${value}`} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute flex flex-col items-center">
              <span className="text-[10px] text-outline font-bold">TOTAL EXP</span>
              <span className="font-display text-title-md text-on-surface">
                ₹{donutData.reduce((acc, curr) => acc + curr.totalAmount, 0).toFixed(0)}
              </span>
            </div>
          </div>
          <div className="mt-4 space-y-2 flex-1 flex flex-col justify-center">
            {donutData.map((item, index) => (
              <div key={item.category} className="flex items-center justify-between text-body-sm">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                  <span className="capitalize">{item.category}</span>
                </div>
                <span className="font-bold">₹{item.totalAmount.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Fuel Efficiency Chart */}
        <div className="col-span-12 lg:col-span-6 p-6 border border-outline-variant rounded bg-white">
          <h3 className="font-title-md text-title-md text-on-surface mb-6 font-bold">Fuel Efficiency — Fleet vs Target (km/L)</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={fuelEfficiencyTrend} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#edeeef" />
                <XAxis dataKey="week" stroke="#80747a" fontSize={11} />
                <YAxis stroke="#80747a" fontSize={11} domain={['auto', 'auto']} />
                <Tooltip formatter={(v) => `${v} km/L`} />
                <Line type="monotone" dataKey="mpg" stroke="#57344f" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Custom Progress Bar for Vehicle Capacity */}
        <div className="col-span-12 lg:col-span-6 p-6 border border-outline-variant rounded bg-white flex flex-col justify-between">
          <h3 className="font-title-md text-title-md text-on-surface mb-4">Capacity Utilization by Category</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-body-sm mb-1">
                <span>Heavy Trucks (Avg Load)</span>
                <span className="font-bold">78%</span>
              </div>
              <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                <div className="bg-primary h-full" style={{ width: '78%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-body-sm mb-1">
                <span>Cargo Vans (Avg Load)</span>
                <span className="font-bold">52%</span>
              </div>
              <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                <div className="bg-primary h-full" style={{ width: '52%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-body-sm mb-1">
                <span>Buses (Passenger Load)</span>
                <span className="font-bold">90%</span>
              </div>
              <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                <div className="bg-primary h-full" style={{ width: '90%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid for preview lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Trips Table */}
        <div className="border border-outline-variant rounded bg-white overflow-hidden">
          <div className="p-4 border-b border-outline-variant bg-surface-container-low flex justify-between items-center">
            <h4 className="font-title-md text-title-md text-on-surface">Recent Dispatched Trips</h4>
            <span className="text-secondary text-xs">Total: {recentTrips.length}</span>
          </div>
          <div className="overflow-x-auto">
            {recentTrips.length === 0 ? (
              <p className="p-4 text-secondary text-body-sm text-center">No dispatched trips currently.</p>
            ) : (
              <table className="w-full text-left">
                <thead className="bg-surface-container-low/50">
                  <tr className="text-[10px] uppercase text-outline border-b border-outline-variant">
                    <th className="px-4 py-2">Trip No</th>
                    <th className="px-4 py-2">Vehicle</th>
                    <th className="px-4 py-2">Source → Dest</th>
                    <th className="px-4 py-2">Status</th>
                  </tr>
                </thead>
                <tbody className="text-body-sm divide-y divide-outline-variant">
                  {recentTrips.map(trip => (
                    <tr key={trip.id} className="hover:bg-surface-container-low/50">
                      <td className="px-4 py-2 font-code text-primary">{trip.trip_number}</td>
                      <td className="px-4 py-2">{trip.vehicle.name_model}</td>
                      <td className="px-4 py-2">{trip.source} → {trip.destination}</td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          trip.status === 'Dispatched' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                        }`}>
                          {trip.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* License Compliance */}
        <div className="border border-outline-variant rounded bg-white overflow-hidden">
          <div className="p-4 border-b border-outline-variant bg-surface-container-low flex justify-between items-center">
            <h4 className="font-title-md text-title-md text-on-surface">Compliance Alerts</h4>
            <span className="text-error text-xs font-bold">{expiredLicenses.length} Flagged</span>
          </div>
          <div className="overflow-x-auto">
            {expiredLicenses.length === 0 ? (
              <p className="p-4 text-secondary text-body-sm text-center">All active drivers are compliant.</p>
            ) : (
              <table className="w-full text-left">
                <thead className="bg-surface-container-low/50">
                  <tr className="text-[10px] uppercase text-outline border-b border-outline-variant">
                    <th className="px-4 py-2">Driver Name</th>
                    <th className="px-4 py-2">License Category</th>
                    <th className="px-4 py-2">Alert Reason</th>
                  </tr>
                </thead>
                <tbody className="text-body-sm divide-y divide-outline-variant">
                  {expiredLicenses.map(driver => {
                    const isExpired = new Date(driver.license_expiry_date) < new Date();
                    return (
                      <tr key={driver.id} className="hover:bg-surface-container-low/50">
                        <td className="px-4 py-2 font-bold">{driver.name}</td>
                        <td className="px-4 py-2">{driver.license_category}</td>
                        <td className="px-4 py-2">
                          <span className="px-2 py-0.5 rounded bg-error-container text-on-error-container text-[10px] font-bold uppercase">
                            {driver.status === 'Suspended' ? 'Suspended' : isExpired ? 'Expired License' : 'Expiring Soon'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
