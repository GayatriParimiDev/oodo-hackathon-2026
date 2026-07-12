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

const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [topConsumers, setTopConsumers] = useState([]);
  const [highMaintenance, setHighMaintenance] = useState([]);

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      try {
        const [statsRes, vehiclesRes, maintenanceRes, chartsRes] = await Promise.all([
          client.get('/dashboard/stats'),
          client.get('/vehicles'),
          client.get('/maintenance'),
          client.get('/dashboard/charts')
        ]);

        // Calculate dynamic values
        let totalFuelCost = 0;
        let totalMaintenanceCost = 0;
        let totalRevenue = 0;
        let totalAcquisition = 0;
        let totalDistance = 0;
        let totalFuelLiters = 0;

        vehiclesRes.data.forEach(v => {
          totalAcquisition += parseFloat(v.acquisition_cost || 0);
          
          v.fuelLogs.forEach(f => {
            totalFuelCost += parseFloat(f.cost || 0);
            totalFuelLiters += parseFloat(f.liters || 0);
          });
          
          v.maintenances.forEach(m => {
            totalMaintenanceCost += parseFloat(m.cost || 0);
          });

          v.trips.forEach(t => {
            if (t.status === 'Completed') {
              totalRevenue += parseFloat(t.revenue || 0);
              totalDistance += parseFloat(t.planned_distance || 0);
              totalFuelLiters += parseFloat(t.fuel_consumed || 0);
            }
          });
        });

        const totalOperationalCost = totalFuelCost + totalMaintenanceCost;
        const utilizationRate = chartsRes.data?.fleetUtilization?.utilizationRate || 0;
        const fuelEfficiency = totalFuelLiters > 0 ? (totalDistance / totalFuelLiters) : 0;
        const roi = totalAcquisition > 0 ? ((totalRevenue - totalOperationalCost) / totalAcquisition) : 0;

        setData({
          operationalCost: totalOperationalCost,
          utilization: utilizationRate,
          fuelEfficiency: fuelEfficiency,
          roi: roi,
        });

        // Top Fuel Consumers list based on actual logged costs
        const consumers = vehiclesRes.data.map((v) => {
          const fuelCostSum = v.fuelLogs.reduce((acc, f) => acc + parseFloat(f.cost || 0), 0);
          const fuelLitersSum = v.fuelLogs.reduce((acc, f) => acc + parseFloat(f.liters || 0), 0);
          const distanceSum = v.trips.filter(t => t.status === 'Completed').reduce((acc, t) => acc + parseFloat(t.planned_distance || 0), 0);
          
          return {
            id: v.id,
            registration: v.registration_number,
            model: v.name_model,
            consumption: fuelLitersSum > 0 ? `${(distanceSum / fuelLitersSum).toFixed(1)} km/L` : '—',
            cost: fuelCostSum
          };
        }).sort((a, b) => b.cost - a.cost).slice(0, 3);
        setTopConsumers(consumers);

        // Highest Maintenance Cost list
        const mCosts = maintenanceRes.data.map(m => ({
          registration: m.vehicle.registration_number,
          model: m.vehicle.name_model,
          date: new Date(m.opened_at).toLocaleDateString(),
          status: m.status === 'Closed' ? 'Resolved' : 'In Shop',
          cost: parseFloat(m.cost || 0)
        })).sort((a, b) => b.cost - a.cost).slice(0, 3);
        setHighMaintenance(mCosts);

        setLoading(false);
      } catch (err) {
        console.error('Error loading reports:', err);
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  const handleExportCSV = async () => {
    try {
      const response = await client.get('/dashboard/export-trips', {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'trips-export.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Failed to export CSV:', err);
      alert('Failed to download CSV export. Please make sure database is running.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-120px)]">
        <p className="text-secondary text-title-md font-bold">Loading reports and analytics...</p>
      </div>
    );
  }

  // Predefined chart data from reports.html spec
  const expenseTrends = [
    { name: 'JAN', Fuel: 4500, Maintenance: 2400 },
    { name: 'FEB', Fuel: 5200, Maintenance: 2000 },
    { name: 'MAR', Fuel: 3800, Maintenance: 3100 },
    { name: 'APR', Fuel: 6800, Maintenance: 1500 },
    { name: 'MAY', Fuel: 4100, Maintenance: 3500 },
    { name: 'JUN', Fuel: 7200, Maintenance: 1200 },
  ];

  const breakdownData = [
    { name: 'Fuel', value: 60 },
    { name: 'Maintenance', value: 25 },
    { name: 'Insurance/Admin', value: 15 },
  ];

  const COLORS = ['#57344f', '#555f6d', '#d1c3ca'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between py-2 border-b border-outline-variant">
        <div>
          <nav className="flex items-center gap-2 text-outline mb-1">
            <span className="text-label-sm font-label-sm">Operations</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-label-sm font-label-sm text-primary">Financial Reports</span>
          </nav>
          <h2 className="font-display text-display text-on-surface">Financial Performance</h2>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-surface-container border border-outline-variant text-on-surface-variant font-label-md text-label-md rounded hover:bg-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            Export Trips CSV
          </button>
        </div>
      </div>

      {/* Bento Grid Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-outline-variant p-5 rounded relative overflow-hidden group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-secondary-container rounded text-primary">
              <span className="material-symbols-outlined">account_balance_wallet</span>
            </div>
            <span className="text-[10px] font-bold text-tertiary-container bg-tertiary-fixed px-1.5 py-0.5 rounded">+12.5%</span>
          </div>
          <p className="text-outline font-label-md text-label-md uppercase tracking-wide">Operational Cost</p>
          <p className="text-[28px] font-bold text-on-surface mt-1">₹{data.operationalCost.toLocaleString()}</p>
          <p className="text-body-sm text-outline mt-2 italic">vs. ₹429,248 last month</p>
        </div>

        <div className="bg-white border border-outline-variant p-5 rounded relative overflow-hidden group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-secondary-container rounded text-primary">
              <span className="material-symbols-outlined">route</span>
            </div>
            <span className="text-[10px] font-bold text-tertiary-container bg-tertiary-fixed px-1.5 py-0.5 rounded">+3.2%</span>
          </div>
          <p className="text-outline font-label-md text-label-md uppercase tracking-wide">Fleet Utilization</p>
          <p className="text-[28px] font-bold text-on-surface mt-1">{data.utilization}%</p>
          <p className="text-body-sm text-outline mt-2 italic">Target: 85.0%</p>
        </div>

        <div className="bg-white border border-outline-variant p-5 rounded relative overflow-hidden group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-secondary-container rounded text-primary">
              <span className="material-symbols-outlined">ev_station</span>
            </div>
            <span className="text-[10px] font-bold text-error bg-error-container px-1.5 py-0.5 rounded">-1.4%</span>
          </div>
          <p className="text-outline font-label-md text-label-md uppercase tracking-wide">Fuel Efficiency</p>
          <p className="text-[28px] font-bold text-on-surface mt-1">{data.fuelEfficiency.toFixed(1)} km/L</p>
          <p className="text-body-sm text-outline mt-2 italic">Fleet average</p>
        </div>

        <div className="bg-white border border-outline-variant p-5 rounded relative overflow-hidden group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-secondary-container rounded text-primary">
              <span className="material-symbols-outlined">trending_up</span>
            </div>
            <span className="text-[10px] font-bold text-tertiary-container bg-tertiary-fixed px-1.5 py-0.5 rounded">+8.7%</span>
          </div>
          <p className="text-outline font-label-md text-label-md uppercase tracking-wide">Vehicle ROI</p>
          <p className="text-[28px] font-bold text-on-surface mt-1">{data.roi.toFixed(2)}x</p>
          <p className="text-body-sm text-outline mt-2 italic">Estimated lifecycle</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Trend Bar Chart */}
        <div className="lg:col-span-8 bg-white border border-outline-variant rounded p-6">
          <h3 className="font-title-md text-title-md mb-6">Expense Trends</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={expenseTrends}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#edeeef" />
                <XAxis dataKey="name" stroke="#80747a" fontSize={11} />
                <YAxis stroke="#80747a" fontSize={11} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Fuel" fill="#57344f" radius={[2, 2, 0, 0]} />
                <Bar dataKey="Maintenance" fill="#555f6d" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Donut Chart */}
        <div className="lg:col-span-4 bg-white border border-outline-variant rounded p-6 flex flex-col justify-center">
          <h3 className="font-title-md text-title-md mb-4">Expense Breakdown</h3>
          <div className="h-44 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={breakdownData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={65}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {breakdownData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value}%`} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute flex flex-col items-center">
              <span className="text-[10px] text-outline font-bold">COSTS</span>
              <span className="font-bold text-title-md">100%</span>
            </div>
          </div>
          <ul className="mt-4 space-y-2">
            {breakdownData.map((item, index) => (
              <li key={item.name} className="flex items-center justify-between text-body-sm">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                  <span>{item.name}</span>
                </div>
                <span className="font-bold">{item.value}%</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Tables grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Top Fuel Consumers */}
        <div className="bg-white border border-outline-variant rounded overflow-hidden">
          <div className="p-4 border-b border-outline-variant bg-surface-container-low flex justify-between items-center">
            <h3 className="font-title-md text-title-md">Top Fuel Consumers</h3>
          </div>
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant text-[10px] font-bold text-outline uppercase tracking-wider">
                <th className="px-gutter py-3">Vehicle ID</th>
                <th className="px-gutter py-3">Model</th>
                <th className="px-gutter py-3 text-right">Consumption</th>
                <th className="px-gutter py-3 text-right">Est. Fuel Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant text-body-sm">
              {topConsumers.length === 0 ? (
                <tr>
                  <td colSpan="4" className="p-4 text-center text-secondary">No vehicles loaded.</td>
                </tr>
              ) : (
                topConsumers.map((c) => (
                  <tr key={c.id} className="hover:bg-surface-container-low/50">
                    <td className="px-gutter py-3 font-code font-bold text-primary">{c.registration}</td>
                    <td className="px-gutter py-3">{c.model}</td>
                    <td className="px-gutter py-3 text-right">{c.consumption}</td>
                    <td className="px-gutter py-3 text-right font-bold text-on-surface">₹{c.cost.toFixed(2)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Highest Maintenance Cost */}
        <div className="bg-white border border-outline-variant rounded overflow-hidden">
          <div className="p-4 border-b border-outline-variant bg-surface-container-low flex justify-between items-center">
            <h3 className="font-title-md text-title-md">Highest Maintenance Spend</h3>
          </div>
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant text-[10px] font-bold text-outline uppercase tracking-wider">
                <th className="px-gutter py-3">Vehicle ID</th>
                <th className="px-gutter py-3">Opened Date</th>
                <th className="px-gutter py-3">Status</th>
                <th className="px-gutter py-3 text-right">Total Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant text-body-sm">
              {highMaintenance.length === 0 ? (
                <tr>
                  <td colSpan="4" className="p-4 text-center text-secondary">No maintenance history recorded.</td>
                </tr>
              ) : (
                highMaintenance.map((m, idx) => (
                  <tr key={idx} className="hover:bg-surface-container-low/50">
                    <td className="px-gutter py-3 font-code font-bold text-primary">{m.registration}</td>
                    <td className="px-gutter py-3">{m.date}</td>
                    <td className="px-gutter py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        m.status === 'Resolved' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {m.status}
                      </span>
                    </td>
                    <td className="px-gutter py-3 text-right font-bold text-on-surface">₹{m.cost.toFixed(2)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;
