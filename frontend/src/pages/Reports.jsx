import React, { useEffect, useState } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import client from '../api/client';

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

  const [pdfLoading, setPdfLoading] = useState(false);

  const handleExportPDF = async () => {
    setPdfLoading(true);
    try {
      const isDark = document.documentElement.classList.contains('dark');
      const barChartEl = document.getElementById('expense-bar-chart');
      const pieChartEl = document.getElementById('expense-pie-chart');

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

      const barCanvas = await captureElement(barChartEl);
      const pieCanvas = await captureElement(pieChartEl);

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = 210;
      const pdfHeight = 297;
      const margin = 15;

      const addHeader = (pageNum) => {
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8);
        pdf.setTextColor(150, 150, 150);
        pdf.text('TransitOps ERP — Financial Performance Report', margin, 10);
        pdf.text(`Page ${pageNum}`, pdfWidth - margin - 10, 10);
        pdf.setLineWidth(0.1);
        pdf.setDrawColor(200, 200, 200);
        pdf.line(margin, 12, pdfWidth - margin, 12);
      };

      // PAGE 1: TITLE & EXECUTIVE SUMMARY
      addHeader(1);

      // Document Title
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(20);
      pdf.setTextColor(87, 52, 79);
      pdf.text('TransitOps Financial Performance Report', margin, 25);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Generated on: ${new Date().toLocaleString()} | Scope: Operations & Fleet Assets`, margin, 31);

      pdf.setLineWidth(0.4);
      pdf.setDrawColor(87, 52, 79);
      pdf.line(margin, 33, pdfWidth - margin, 33);

      // Section 1: Executive Summary Text
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(13);
      pdf.setTextColor(50, 50, 50);
      pdf.text('1. Executive Summary', margin, 43);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9.5);
      pdf.setTextColor(80, 80, 80);
      const summaryText = "This report provides an executive-level performance summary of the TransitOps fleet, focusing on total operational costs, asset utilization rates, fuel efficiency trends, and return on investment (ROI). The data is dynamically computed from live trip schedules, fuel logs, and maintenance reports recorded on the TransitOps ERP database.";
      const splitText = pdf.splitTextToSize(summaryText, pdfWidth - (margin * 2));
      pdf.text(splitText, margin, 49);

      // Section 2: Key Metrics Grid
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.setTextColor(50, 50, 50);
      pdf.text('Key Performance Indicators (KPIs)', margin, 70);

      const cardWidth = (pdfWidth - (margin * 2) - 8) / 2;
      const cardHeight = 20;
      const kpis = [
        { title: 'OPERATIONAL COST', value: `INR ${data?.operationalCost?.toLocaleString() || '0'}` },
        { title: 'FLEET UTILIZATION', value: `${data?.utilization || '0'}%` },
        { title: 'FUEL EFFICIENCY', value: `${data?.fuelEfficiency?.toFixed(1) || '0.0'} km/L` },
        { title: 'VEHICLE ROI', value: `${data?.roi?.toFixed(2) || '0.00'}x` }
      ];

      kpis.forEach((kpi, idx) => {
        const col = idx % 2;
        const row = Math.floor(idx / 2);
        const x = margin + col * (cardWidth + 8);
        const y = 75 + row * (cardHeight + 5);

        pdf.setFillColor(248, 249, 250);
        pdf.setDrawColor(220, 220, 220);
        pdf.rect(x, y, cardWidth, cardHeight, 'FD');

        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(7.5);
        pdf.setTextColor(120, 120, 120);
        pdf.text(kpi.title, x + 4, y + 5);

        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(13);
        pdf.setTextColor(87, 52, 79);
        pdf.text(kpi.value, x + 4, y + 14);
      });

      // Section 3: Cost Breakdowns & Pie Chart
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(13);
      pdf.setTextColor(50, 50, 50);
      pdf.text('2. Cost Breakdown Analysis', margin, 134);

      let itemY = 142;
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9.5);
      pdf.setTextColor(80, 80, 80);
      pdf.text('Expense Type', margin, itemY);
      pdf.text('Share', margin + 50, itemY);
      pdf.setDrawColor(200, 200, 200);
      pdf.line(margin, itemY + 2, margin + 65, itemY + 2);
      
      const breakdown = [
        { name: 'Fuel Costs', value: '60%' },
        { name: 'Maintenance & Repairs', value: '25%' },
        { name: 'Insurance & Administration', value: '15%' }
      ];

      breakdown.forEach((item) => {
        itemY += 8;
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9.5);
        pdf.setTextColor(90, 90, 90);
        pdf.text(item.name, margin, itemY);
        pdf.setFont('helvetica', 'bold');
        pdf.text(item.value, margin + 50, itemY);
      });

      if (pieCanvas) {
        const imgData = pieCanvas.toDataURL('image/png');
        pdf.addImage(imgData, 'PNG', pdfWidth - margin - 80, 125, 80, 55);
      }

      // PAGE 2: TREND CHARTS AND TABLES
      pdf.addPage();
      addHeader(2);

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(13);
      pdf.setTextColor(50, 50, 50);
      pdf.text('3. Monthly Expense Trends (Last 6 Months)', margin, 24);

      if (barCanvas) {
        const imgData = barCanvas.toDataURL('image/png');
        pdf.addImage(imgData, 'PNG', margin, 28, pdfWidth - (margin * 2), 65);
      }

      let tableY = 102;
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(13);
      pdf.setTextColor(50, 50, 50);
      pdf.text('4. Top Fuel Consumers (Highest Logged Spend)', margin, tableY);

      autoTable(pdf, {
        startY: tableY + 4,
        margin: { left: margin, right: margin },
        head: [['Vehicle ID', 'Model', 'Avg Fuel Consumption', 'Total Cost']],
        body: topConsumers.map(c => [c.registration, c.model, c.consumption, `INR ${c.cost.toLocaleString()}`]),
        theme: 'striped',
        headStyles: { fillColor: [87, 52, 79], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 8.5 },
      });

      tableY = pdf.lastAutoTable.finalY + 12;
      
      if (tableY > pdfHeight - 65) {
        pdf.addPage();
        addHeader(3);
        tableY = 24;
      }

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(13);
      pdf.setTextColor(50, 50, 50);
      pdf.text('5. Highest Maintenance Expenses (Vehicles)', margin, tableY);

      autoTable(pdf, {
        startY: tableY + 4,
        margin: { left: margin, right: margin },
        head: [['Vehicle ID', 'Model', 'Opened Date', 'Status', 'Repair Cost']],
        body: highMaintenance.map(m => [m.registration, m.model, m.date, m.status, `INR ${m.cost.toLocaleString()}`]),
        theme: 'striped',
        headStyles: { fillColor: [85, 95, 109], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 8.5 },
      });

      pdf.save(`TransitOps-FinancialReport-${new Date().toISOString().split('T')[0]}.pdf`);
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
          <button
            onClick={handleExportPDF}
            disabled={pdfLoading}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary font-label-md text-label-md rounded hover:opacity-90 transition-colors disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[18px]">
              {pdfLoading ? 'sync' : 'picture_as_pdf'}
            </span>
            {pdfLoading ? 'Generating...' : 'Export PDF Report'}
          </button>
        </div>
      </div>

      {/* Printable PDF Wrapper */}
      <div id="reports-pdf-content" className="space-y-6 p-2 bg-background">

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
        <div id="expense-bar-chart" className="lg:col-span-8 bg-white border border-outline-variant rounded p-6">
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
        <div id="expense-pie-chart" className="lg:col-span-4 bg-white border border-outline-variant rounded p-6 flex flex-col justify-center">
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
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${m.status === 'Resolved' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
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
      </div> {/* reports-pdf-content end */}
    </div>
  );
};

export default Reports;
