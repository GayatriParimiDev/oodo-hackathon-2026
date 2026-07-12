const path = require('path');
const fs = require('fs');
const { createObjectCsvWriter } = require('csv-writer');
const prisma = require('../prisma/client');

exports.getStats = async (req, res) => {
  try {
    const totalVehicles = await prisma.vehicle.count();
    const totalDrivers = await prisma.driver.count();
    const totalTrips = await prisma.trip.count();
    const activeMaintenance = await prisma.maintenanceLog.count({
      where: { status: 'Active' },
    });

    const vehiclesByStatus = await prisma.vehicle.groupBy({
      by: ['status'],
      _count: true,
    });

    const tripsByStatus = await prisma.trip.groupBy({
      by: ['status'],
      _count: true,
    });

    return res.json({
      summary: {
        totalVehicles,
        totalDrivers,
        totalTrips,
        activeMaintenance,
      },
      vehiclesByStatus,
      tripsByStatus,
    });
  } catch (error) {
    console.error('Fetch dashboard stats error:', error);
    return res.status(500).json({ error: 'Failed to retrieve dashboard stats.' });
  }
};

exports.getChartsData = async (req, res) => {
  try {
    // 1. Fleet Utilization (OnTrip / Total Active)
    const totalActiveVehicles = await prisma.vehicle.count({
      where: { status: { not: 'Retired' } },
    });
    const onTripVehicles = await prisma.vehicle.count({
      where: { status: 'OnTrip' },
    });
    const utilizationRate = totalActiveVehicles > 0 ? (onTripVehicles / totalActiveVehicles) * 100 : 0;

    // 2. Expenses breakdown by category
    const expenses = await prisma.expense.groupBy({
      by: ['category'],
      _sum: {
        amount: true,
      },
    });

    // 3. Driver Safety Scores
    const drivers = await prisma.driver.findMany({
      select: {
        name: true,
        safety_score: true,
      },
    });

    // 4. Trip Status Counts
    const tripStatusCounts = await prisma.trip.groupBy({
      by: ['status'],
      _count: true,
    });

    return res.json({
      fleetUtilization: {
        totalActiveVehicles,
        onTripVehicles,
        utilizationRate: parseFloat(utilizationRate.toFixed(2)),
      },
      expensesBreakdown: expenses.map(e => ({
        category: e.category,
        totalAmount: parseFloat(e._sum.amount || 0),
      })),
      driverSafetyScores: drivers.map(d => ({
        name: d.name,
        safetyScore: parseFloat(d.safety_score),
      })),
      tripStatusCounts: tripStatusCounts.map(t => ({
        status: t.status,
        count: t._count,
      })),
    });
  } catch (error) {
    console.error('Fetch charts data error:', error);
    return res.status(500).json({ error: 'Failed to retrieve charts data.' });
  }
};

exports.exportTripsCsv = async (req, res) => {
  const tempDir = path.join(__dirname, '../temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
  }

  const tempFilePath = path.join(tempDir, `trips-${Date.now()}.csv`);

  try {
    const trips = await prisma.trip.findMany({
      include: {
        vehicle: true,
        driver: true,
      },
    });

    const csvWriter = createObjectCsvWriter({
      path: tempFilePath,
      header: [
        { id: 'trip_number', title: 'Trip Number' },
        { id: 'source', title: 'Source' },
        { id: 'destination', title: 'Destination' },
        { id: 'vehicle_reg', title: 'Vehicle Reg' },
        { id: 'vehicle_model', title: 'Vehicle Model' },
        { id: 'driver_name', title: 'Driver Name' },
        { id: 'cargo_weight', title: 'Cargo Weight (kg)' },
        { id: 'planned_distance', title: 'Planned Distance (km)' },
        { id: 'status', title: 'Status' },
        { id: 'revenue', title: 'Revenue (₹)' },
        { id: 'created_at', title: 'Created At' },
      ],
    });

    const records = trips.map(t => ({
      trip_number: t.trip_number,
      source: t.source,
      destination: t.destination,
      vehicle_reg: t.vehicle.registration_number,
      vehicle_model: t.vehicle.name_model,
      driver_name: t.driver.name,
      cargo_weight: parseFloat(t.cargo_weight),
      planned_distance: parseFloat(t.planned_distance),
      status: t.status,
      revenue: t.revenue ? parseFloat(t.revenue) : 0,
      created_at: t.created_at.toISOString(),
    }));

    await csvWriter.writeRecords(records);

    return res.download(tempFilePath, 'trips-export.csv', (err) => {
      // Delete temporary file after download completes (success or failure)
      try {
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }
      } catch (unlinkErr) {
        console.error('Failed to delete temporary CSV file:', unlinkErr);
      }
      if (err) {
        console.error('CSV Download error:', err);
      }
    });
  } catch (error) {
    console.error('Export CSV error:', error);
    try {
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
    } catch (e) {}
    return res.status(500).json({ error: 'Failed to generate CSV export.' });
  }
};
