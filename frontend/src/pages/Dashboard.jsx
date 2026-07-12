import React, { useEffect, useState } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import client from '../api/client';
import { formatCurrency, formatFuelEfficiency, getCurrencySymbol, getDistanceUnit, getFuelEfficiencyUnit } from '../utils/format';

// Helper to convert Tailwind CSS v4 oklch() and oklab() colors to rgb() for html2canvas support
const replaceOklchInString = (str) => {
  if (!str) return str;
  // Replace oklch
  let result = str.replace(/oklch\(\s*([\d.]+%?)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+%?))?\s*\)/g, (match, lStr, cStr, hStr, alphaStr) => {
    let l = lStr.endsWith('%') ? parseFloat(lStr) / 100 : parseFloat(lStr);
    let c = parseFloat(cStr);
    let h = parseFloat(hStr);
    
    const hRad = (h * Math.PI) / 180;
    const aLab = c * Math.cos(hRad);
    const bLab = c * Math.sin(hRad);

    const l_ = l + 0.3963377774 * aLab + 0.2158037573 * bLab;
    const m_ = l - 0.1055613458 * aLab - 0.0638541728 * bLab;
    const s_ = l - 0.0894841775 * aLab - 1.291485548 * bLab;

    const l_3 = l_ * l_ * l_;
    const m_3 = m_ * m_ * m_;
    const s_3 = s_ * s_ * s_;

    const rL = +4.0767416621 * l_3 - 3.3077115913 * m_3 + 0.2309699292 * s_3;
    const gL = -1.2684380046 * l_3 + 2.6097574011 * m_3 - 0.3413193965 * s_3;
    const bL = -0.0041960863 * l_3 - 0.7034186147 * m_3 + 1.707614701 * s_3;

    const f = (x) => (x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055);
    
    const r = Math.round(Math.max(0, Math.min(1, f(rL))) * 255);
    const g = Math.round(Math.max(0, Math.min(1, f(gL))) * 255);
    const b = Math.round(Math.max(0, Math.min(1, f(bL))) * 255);

    if (alphaStr) {
      const alpha = alphaStr.endsWith('%') ? parseFloat(alphaStr) / 100 : parseFloat(alphaStr);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    return `rgb(${r}, ${g}, ${b})`;
  });

  // Replace oklab
  result = result.replace(/oklab\(\s*([\d.]+%?)\s+(-?[\d.]+)\s+(-?[\d.]+)(?:\s*\/\s*([\d.]+%?))?\s*\)/g, (match, lStr, aStr, bStr, alphaStr) => {
    let l = lStr.endsWith('%') ? parseFloat(lStr) / 100 : parseFloat(lStr);
    let aLab = parseFloat(aStr);
    let bLab = parseFloat(bStr);

    const l_ = l + 0.3963377774 * aLab + 0.2158037573 * bLab;
    const m_ = l - 0.1055613458 * aLab - 0.0638541728 * bLab;
    const s_ = l - 0.0894841775 * aLab - 1.291485548 * bLab;

    const l_3 = l_ * l_ * l_;
    const m_3 = m_ * m_ * m_;
    const s_3 = s_ * s_ * s_;

    const rL = +4.0767416621 * l_3 - 3.3077115913 * m_3 + 0.2309699292 * s_3;
    const gL = -1.2684380046 * l_3 + 2.6097574011 * m_3 - 0.3413193965 * s_3;
    const bL = -0.0041960863 * l_3 - 0.7034186147 * m_3 + 1.707614701 * s_3;

    const f = (x) => (x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055);
    
    const r = Math.round(Math.max(0, Math.min(1, f(rL))) * 255);
    const g = Math.round(Math.max(0, Math.min(1, f(gL))) * 255);
    const b = Math.round(Math.max(0, Math.min(1, f(bL))) * 255);

    if (alphaStr) {
      const alpha = alphaStr.endsWith('%') ? parseFloat(alphaStr) / 100 : parseFloat(alphaStr);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    return `rgb(${r}, ${g}, ${b})`;
  });

  return result;
};
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

  const [pdfLoading, setPdfLoading] = useState(false);

  const handleExportPDF = async () => {
    setPdfLoading(true);
    try {
      const isDark = document.documentElement.classList.contains('dark');
      const fleetChartEl = document.getElementById('dashboard-fleet-chart');
      const expenseChartEl = document.getElementById('dashboard-expense-chart');
      const fuelChartEl = document.getElementById('dashboard-fuel-chart');

      // Helper to capture specific chart elements cleanly
      const captureElement = async (el) => {
        if (!el) return null;
        return await html2canvas(el, {
          scale: 1.5,
          useCORS: true,
          backgroundColor: isDark ? '#161320' : '#ffffff',
          logging: false,
          onclone: (clonedDoc) => {
            const styles = clonedDoc.getElementsByTagName('style');
            for (let i = 0; i < styles.length; i++) {
              const style = styles[i];
              if (style.innerHTML && (style.innerHTML.includes('oklch') || style.innerHTML.includes('oklab'))) {
                style.innerHTML = replaceOklchInString(style.innerHTML);
              }
            }
          }
        });
      };

      const fleetCanvas = await captureElement(fleetChartEl);
      const expenseCanvas = await captureElement(expenseChartEl);
      const fuelCanvas = await captureElement(fuelChartEl);

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = 210;
      const pdfHeight = 297;
      const margin = 15;

      const addHeader = (pageNum) => {
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8);
        pdf.setTextColor(150, 150, 150);
        pdf.text('TransitOps ERP — Operations Dashboard Report', margin, 10);
        pdf.text(`Page ${pageNum}`, pdfWidth - margin - 10, 10);
        pdf.setLineWidth(0.1);
        pdf.setDrawColor(200, 200, 200);
        pdf.line(margin, 12, pdfWidth - margin, 12);
      };

      // PAGE 1: TITLE & OPERATIONS SUMMARY
      addHeader(1);

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(20);
      pdf.setTextColor(87, 52, 79);
      pdf.text('TransitOps Fleet Operations Report', margin, 25);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Generated on: ${new Date().toLocaleString()} | Scope: Live Fleet Dispatches & Compliance`, margin, 31);

      pdf.setLineWidth(0.4);
      pdf.setDrawColor(87, 52, 79);
      pdf.line(margin, 33, pdfWidth - margin, 33);

      // Section 1: Executive Overview Text
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(13);
      pdf.setTextColor(50, 50, 50);
      pdf.text('1. Operations Summary', margin, 43);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9.5);
      pdf.setTextColor(80, 80, 80);
      const summaryText = "This live dispatch and fleet operations report provides a real-time status summary of TransitOps assets. It includes fleet-wide availability metrics, active maintenance tasks, real-time trip dispatches, fuel efficiency progress tracking, and driver compliance status.";
      const splitText = pdf.splitTextToSize(summaryText, pdfWidth - (margin * 2));
      pdf.text(splitText, margin, 49);

      // Section 2: Metrics Grid (6 KPI cards)
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.setTextColor(50, 50, 50);
      pdf.text('Operational Key Metrics', margin, 70);

      const cardWidth = (pdfWidth - (margin * 2) - 16) / 3;
      const cardHeight = 18;
      const kpis = [
        { title: 'TOTAL FLEET UNITS', value: `${summary.totalVehicles} units` },
        { title: 'AVAILABLE UNITS', value: `${stats?.vehiclesByStatus?.find(v => v.status === 'Available')?._count || 0} units` },
        { title: 'IN SHOP (MAINT.)', value: `${summary.activeMaintenance} units` },
        { title: 'ACTIVE DISPATCH', value: `${stats?.tripsByStatus?.find(t => t.status === 'Dispatched')?._count || 0} trips` },
        { title: 'UTILIZATION %', value: `${utilization}%` },
        { title: 'TOTAL DRIVERS', value: `${summary.totalDrivers} staff` }
      ];

      kpis.forEach((kpi, idx) => {
        const col = idx % 3;
        const row = Math.floor(idx / 3);
        const x = margin + col * (cardWidth + 8);
        const y = 75 + row * (cardHeight + 4);

        pdf.setFillColor(248, 249, 250);
        pdf.setDrawColor(220, 220, 220);
        pdf.rect(x, y, cardWidth, cardHeight, 'FD');

        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(7);
        pdf.setTextColor(120, 120, 120);
        pdf.text(kpi.title, x + 3, y + 4.5);

        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(11);
        pdf.setTextColor(idx === 2 ? 180 : 87, idx === 2 ? 50 : 52, idx === 2 ? 50 : 79);
        pdf.text(kpi.value, x + 3, y + 12);
      });

      // Section 3: Live Load Status Chart
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(13);
      pdf.setTextColor(50, 50, 50);
      pdf.text('2. Fleet Status Breakdown (Live Hours)', margin, 128);

      if (fleetCanvas) {
        const imgData = fleetCanvas.toDataURL('image/png');
        pdf.addImage(imgData, 'PNG', margin, 132, pdfWidth - (margin * 2), 52);
      }

      // PAGE 2: CHARTS & TABLES
      pdf.addPage();
      addHeader(2);

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(13);
      pdf.setTextColor(50, 50, 50);
      pdf.text('3. Expense Mix & Efficiency Analysis', margin, 24);

      if (expenseCanvas) {
        const imgData = expenseCanvas.toDataURL('image/png');
        pdf.addImage(imgData, 'PNG', margin, 28, 85, 55);
      }

      if (fuelCanvas) {
        const imgData = fuelCanvas.toDataURL('image/png');
        pdf.addImage(imgData, 'PNG', margin + 95, 28, 85, 55);
      }

      // Section 5: Recent Dispatched Trips Table
      let tableY = 92;
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(13);
      pdf.setTextColor(50, 50, 50);
      pdf.text('4. Recent Dispatched Trips Schedule', margin, tableY);

      autoTable(pdf, {
        startY: tableY + 4,
        margin: { left: margin, right: margin },
        head: [['Trip No', 'Vehicle Model', 'Route (Source -> Destination)', 'Status']],
        body: recentTrips.map(t => [t.trip_number, t.vehicle.name_model, `${t.source} -> ${t.destination}`, t.status]),
        theme: 'striped',
        headStyles: { fillColor: [87, 52, 79], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 8.5 },
      });

      // Section 6: Driver Compliance Warnings
      tableY = pdf.lastAutoTable.finalY + 12;

      if (tableY > pdfHeight - 65) {
        pdf.addPage();
        addHeader(3);
        tableY = 24;
      }

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(13);
      pdf.setTextColor(50, 50, 50);
      pdf.text('5. Compliance & Licensing Alerts', margin, tableY);

      autoTable(pdf, {
        startY: tableY + 4,
        margin: { left: margin, right: margin },
        head: [['Driver Name', 'License Category', 'Alert Status / Reason']],
        body: expiredLicenses.map(d => {
          const isExpired = new Date(d.license_expiry_date) < new Date();
          return [d.name, d.license_category, d.status === 'Suspended' ? 'Suspended' : isExpired ? 'Expired License' : 'Expiring Soon'];
        }),
        theme: 'striped',
        headStyles: { fillColor: [180, 50, 50], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 8.5 },
      });

      pdf.save(`TransitOps-DashboardReport-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      console.error('Failed to export PDF:', err);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setPdfLoading(false);
    }
  };

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
          <button
            onClick={handleExportPDF}
            disabled={pdfLoading}
            className="h-8 px-4 bg-surface-container border border-outline-variant text-on-surface-variant font-label-md text-label-md rounded flex items-center gap-2 hover:bg-surface-container-high transition-colors disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[18px]">
              {pdfLoading ? 'sync' : 'picture_as_pdf'}
            </span>
            {pdfLoading ? 'Generating...' : 'Export PDF'}
          </button>
          <button className="h-8 px-4 bg-primary text-white font-label-md text-label-md rounded flex items-center gap-2 hover:opacity-90">
            <span className="material-symbols-outlined text-[18px]">add</span>
            New Dispatch
          </button>
        </div>
      </div>

      {/* Printable PDF Wrapper */}
      <div id="dashboard-pdf-content" className="space-y-6 bg-background p-1">

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
        <div id="dashboard-fleet-chart" className="col-span-12 lg:col-span-8 p-6 border border-outline-variant rounded bg-white">
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
        <div id="dashboard-expense-chart" className="col-span-12 lg:col-span-4 p-6 border border-outline-variant rounded bg-white flex flex-col">
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
                <Tooltip formatter={(value) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute flex flex-col items-center">
              <span className="text-[10px] text-outline font-bold">TOTAL EXP</span>
              <span className="font-display text-title-md text-on-surface">
                {getCurrencySymbol()}{donutData.reduce((acc, curr) => acc + curr.totalAmount, 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
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
                <span className="font-bold">{formatCurrency(item.totalAmount)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Fuel Efficiency Chart */}
        <div id="dashboard-fuel-chart" className="col-span-12 lg:col-span-6 p-6 border border-outline-variant rounded bg-white">
          <h3 className="font-title-md text-title-md text-on-surface mb-6 font-bold">Fuel Efficiency — Fleet vs Target ({getFuelEfficiencyUnit()})</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={fuelEfficiencyTrend} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#edeeef" />
                <XAxis dataKey="week" stroke="#80747a" fontSize={11} />
                <YAxis stroke="#80747a" fontSize={11} domain={['auto', 'auto']} />
                <Tooltip formatter={(v) => formatFuelEfficiency(v)} />
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
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${trip.status === 'Dispatched' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
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
      </div> {/* dashboard-pdf-content end */}
    </div>
  );
};

export default Dashboard;
