const prisma = require('../prisma/client');

exports.getAll = async (req, res) => {
  try {
    const { status, vehicleId, driverId } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (vehicleId) filter.vehicle_id = vehicleId;
    if (driverId) filter.driver_id = driverId;

    const trips = await prisma.trip.findMany({
      where: filter,
      include: {
        vehicle: true,
        driver: true,
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });
    return res.json(trips);
  } catch (error) {
    console.error('Fetch trips error:', error);
    return res.status(500).json({ error: 'Failed to retrieve trips.' });
  }
};

exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const trip = await prisma.trip.findUnique({
      where: { id },
      include: {
        vehicle: true,
        driver: true,
        user: {
          select: { id: true, name: true, email: true },
        },
        fuelLogs: true,
      },
    });

    if (!trip) {
      return res.status(404).json({ error: 'Trip not found.' });
    }
    return res.json(trip);
  } catch (error) {
    console.error('Fetch trip by ID error:', error);
    return res.status(500).json({ error: 'Failed to retrieve trip details.' });
  }
};

exports.create = async (req, res) => {
  try {
    const {
      trip_number,
      source,
      destination,
      vehicle_id,
      driver_id,
      cargo_weight,
      planned_distance,
      start_odometer,
      status,
    } = req.body;

    if (!trip_number || !source || !destination || !vehicle_id || !driver_id || cargo_weight === undefined || planned_distance === undefined) {
      return res.status(400).json({ error: 'Required fields: trip_number, source, destination, vehicle_id, driver_id, cargo_weight, planned_distance' });
    }

    const existing = await prisma.trip.findUnique({ where: { trip_number } });
    if (existing) {
      return res.status(400).json({ error: 'Trip number already exists.' });
    }

    // Verify driver and vehicle exist
    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicle_id } });
    if (!vehicle) {
      return res.status(400).json({ error: 'Vehicle not found.' });
    }

    const driver = await prisma.driver.findUnique({ where: { id: driver_id } });
    if (!driver) {
      return res.status(400).json({ error: 'Driver not found.' });
    }

    const data = {
      trip_number,
      source,
      destination,
      vehicle_id,
      driver_id,
      created_by: req.user.userId,
      cargo_weight: parseFloat(cargo_weight),
      planned_distance: parseFloat(planned_distance),
      start_odometer: start_odometer !== undefined && start_odometer !== null ? parseFloat(start_odometer) : null,
      status: status || 'Draft',
    };

    if (status === 'Dispatched') {
      data.dispatched_at = new Date();
    }

    const trip = await prisma.trip.create({
      data,
      include: { vehicle: true, driver: true },
    });

    return res.status(201).json(trip);
  } catch (error) {
    console.error('Create trip error:', error);
    return res.status(500).json({ error: 'Failed to create trip.' });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      trip_number,
      source,
      destination,
      vehicle_id,
      driver_id,
      cargo_weight,
      planned_distance,
      start_odometer,
      final_odometer,
      fuel_consumed,
      revenue,
      status,
    } = req.body;

    const existingTrip = await prisma.trip.findUnique({ where: { id } });
    if (!existingTrip) {
      return res.status(404).json({ error: 'Trip not found.' });
    }

    if (trip_number && trip_number !== existingTrip.trip_number) {
      const duplicateTripNum = await prisma.trip.findUnique({ where: { trip_number } });
      if (duplicateTripNum) {
        return res.status(400).json({ error: 'Trip number already in use.' });
      }
    }

    const data = {};
    if (trip_number !== undefined) data.trip_number = trip_number;
    if (source !== undefined) data.source = source;
    if (destination !== undefined) data.destination = destination;
    if (vehicle_id !== undefined) data.vehicle_id = vehicle_id;
    if (driver_id !== undefined) data.driver_id = driver_id;
    if (cargo_weight !== undefined) data.cargo_weight = parseFloat(cargo_weight);
    if (planned_distance !== undefined) data.planned_distance = parseFloat(planned_distance);
    
    if (start_odometer !== undefined) data.start_odometer = start_odometer !== null ? parseFloat(start_odometer) : null;
    if (final_odometer !== undefined) data.final_odometer = final_odometer !== null ? parseFloat(final_odometer) : null;
    if (fuel_consumed !== undefined) data.fuel_consumed = fuel_consumed !== null ? parseFloat(fuel_consumed) : null;
    if (revenue !== undefined) data.revenue = revenue !== null ? parseFloat(revenue) : null;

    if (status !== undefined && status !== existingTrip.status) {
      data.status = status;
      if (status === 'Dispatched') {
        data.dispatched_at = new Date();
      } else if (status === 'Completed') {
        data.completed_at = new Date();
      } else if (status === 'Cancelled') {
        data.cancelled_at = new Date();
      }
    }

    const trip = await prisma.trip.update({
      where: { id },
      data,
      include: { vehicle: true, driver: true },
    });

    return res.json(trip);
  } catch (error) {
    console.error('Update trip error:', error);
    return res.status(500).json({ error: 'Failed to update trip.' });
  }
};

exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.trip.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Trip not found.' });
    }

    await prisma.trip.delete({ where: { id } });
    return res.json({ message: 'Trip deleted successfully.' });
  } catch (error) {
    console.error('Delete trip error:', error);
    return res.status(500).json({ error: 'Failed to delete trip.' });
  }
};
