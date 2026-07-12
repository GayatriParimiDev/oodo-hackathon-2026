const prisma = require('../prisma/client');

exports.getAll = async (req, res) => {
  try {
    const { vehicleId, tripId } = req.query;
    const filter = {};
    if (vehicleId) filter.vehicle_id = vehicleId;
    if (tripId) filter.trip_id = tripId;

    const logs = await prisma.fuelLog.findMany({
      where: filter,
      include: {
        vehicle: true,
        trip: true,
      },
    });
    return res.json(logs);
  } catch (error) {
    console.error('Fetch fuel logs error:', error);
    return res.status(500).json({ error: 'Failed to retrieve fuel logs.' });
  }
};

exports.create = async (req, res) => {
  try {
    const { vehicle_id, trip_id, liters, cost, log_date } = req.body;

    if (!vehicle_id || liters === undefined || cost === undefined || !log_date) {
      return res.status(400).json({ error: 'vehicle_id, liters, cost, and log_date are required.' });
    }

    // Verify vehicle
    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicle_id } });
    if (!vehicle) {
      return res.status(400).json({ error: 'Vehicle not found.' });
    }

    if (trip_id) {
      const trip = await prisma.trip.findUnique({ where: { id: trip_id } });
      if (!trip) {
        return res.status(400).json({ error: 'Trip not found.' });
      }
    }

    const fuelLog = await prisma.fuelLog.create({
      data: {
        vehicle_id,
        trip_id: trip_id || null,
        liters: parseFloat(liters),
        cost: parseFloat(cost),
        log_date: new Date(log_date),
      },
      include: { vehicle: true },
    });

    return res.status(201).json(fuelLog);
  } catch (error) {
    console.error('Create fuel log error:', error);
    return res.status(500).json({ error: 'Failed to record fuel log.' });
  }
};

exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.fuelLog.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Fuel log not found.' });
    }

    await prisma.fuelLog.delete({ where: { id } });
    return res.json({ message: 'Fuel log deleted successfully.' });
  } catch (error) {
    console.error('Delete fuel log error:', error);
    return res.status(500).json({ error: 'Failed to delete fuel log.' });
  }
};
