const prisma = require('../prisma/client');

// Helper to run validations on vehicle & driver
async function validateTripDetails({ vehicleId, driverId, cargoWeight, tripId = null }) {
  if (vehicleId) {
    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle) {
      throw new Error('Vehicle not found.');
    }
    if (vehicle.status === 'Retired' || vehicle.status === 'InShop') {
      throw new Error('Vehicle is In Shop or Retired and cannot be dispatched.');
    }
    // Only throw OnTrip if it's assigned to *another* active trip
    if (vehicle.status === 'OnTrip') {
      // Check if this vehicle is currently on a different trip
      const activeTrip = await prisma.trip.findFirst({
        where: {
          vehicle_id: vehicleId,
          status: 'Dispatched',
          id: { not: tripId },
        },
      });
      if (activeTrip) {
        throw new Error('Vehicle is already assigned to another active trip.');
      }
    }
    if (cargoWeight !== undefined && parseFloat(cargoWeight) > parseFloat(vehicle.max_load_capacity)) {
      throw new Error(`Cargo weight (${cargoWeight} kg) exceeds vehicle maximum capacity (${vehicle.max_load_capacity} kg).`);
    }
  }

  if (driverId) {
    const driver = await prisma.driver.findUnique({ where: { id: driverId } });
    if (!driver) {
      throw new Error('Driver not found.');
    }
    if (driver.status === 'Suspended') {
      throw new Error('Driver is Suspended and cannot be assigned.');
    }
    if (driver.status === 'OnTrip') {
      const activeTrip = await prisma.trip.findFirst({
        where: {
          driver_id: driverId,
          status: 'Dispatched',
          id: { not: tripId },
        },
      });
      if (activeTrip) {
        throw new Error('Driver is already assigned to another active trip.');
      }
    }
    if (new Date(driver.license_expiry_date) < new Date()) {
      throw new Error('Driver license has expired.');
    }
  }
}

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

    // Run business validation checks
    try {
      await validateTripDetails({
        vehicleId: vehicle_id,
        driverId: driver_id,
        cargoWeight: cargo_weight,
      });
    } catch (validationErr) {
      return res.status(400).json({ error: validationErr.message });
    }

    const tripStatus = status || 'Draft';
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
      status: tripStatus,
    };

    if (tripStatus === 'Dispatched') {
      data.dispatched_at = new Date();
    }

    // Create trip in transaction and update vehicle/driver status if Dispatched
    const trip = await prisma.$transaction(async (tx) => {
      const createdTrip = await tx.trip.create({
        data,
      });

      if (tripStatus === 'Dispatched') {
        await tx.vehicle.update({
          where: { id: vehicle_id },
          data: { status: 'OnTrip' },
        });
        await tx.driver.update({
          where: { id: driver_id },
          data: { status: 'OnTrip' },
        });
      }

      return createdTrip;
    });

    const fullTrip = await prisma.trip.findUnique({
      where: { id: trip.id },
      include: { vehicle: true, driver: true },
    });

    return res.status(201).json(fullTrip);
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

    const existingTrip = await prisma.trip.findUnique({
      where: { id },
      include: { vehicle: true, driver: true },
    });

    if (!existingTrip) {
      return res.status(404).json({ error: 'Trip not found.' });
    }

    if (trip_number && trip_number !== existingTrip.trip_number) {
      const duplicateTripNum = await prisma.trip.findUnique({ where: { trip_number } });
      if (duplicateTripNum) {
        return res.status(400).json({ error: 'Trip number already in use.' });
      }
    }

    // Validations for target vehicle/driver if changed or weight updated
    const targetVehicleId = vehicle_id || existingTrip.vehicle_id;
    const targetDriverId = driver_id || existingTrip.driver_id;
    const targetWeight = cargo_weight !== undefined ? cargo_weight : existingTrip.cargo_weight;

    try {
      await validateTripDetails({
        vehicleId: vehicle_id ? vehicle_id : null, // validate only if changing
        driverId: driver_id ? driver_id : null,    // validate only if changing
        cargoWeight: targetWeight,
        tripId: id,
      });
    } catch (validationErr) {
      return res.status(400).json({ error: validationErr.message });
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

    const oldStatus = existingTrip.status;
    const newStatus = status;

    if (newStatus !== undefined && newStatus !== oldStatus) {
      data.status = newStatus;
      if (newStatus === 'Dispatched') {
        data.dispatched_at = new Date();
      } else if (newStatus === 'Completed') {
        data.completed_at = new Date();
      } else if (newStatus === 'Cancelled') {
        data.cancelled_at = new Date();
      }
    }

    // Run updates in a single database transaction to maintain consistency
    const updatedTrip = await prisma.$transaction(async (tx) => {
      const trip = await tx.trip.update({
        where: { id },
        data,
      });

      // Handle transitions
      if (newStatus && newStatus !== oldStatus) {
        // Dispatching
        if (newStatus === 'Dispatched') {
          await tx.vehicle.update({
            where: { id: targetVehicleId },
            data: { status: 'OnTrip' },
          });
          await tx.driver.update({
            where: { id: targetDriverId },
            data: { status: 'OnTrip' },
          });
        }
        // Completing or Cancelling restores statuses back to Available
        else if (newStatus === 'Completed' || newStatus === 'Cancelled') {
          // Verify vehicle is not Retired
          const currentVehicle = await tx.vehicle.findUnique({ where: { id: targetVehicleId } });
          if (currentVehicle && currentVehicle.status !== 'Retired') {
            await tx.vehicle.update({
              where: { id: targetVehicleId },
              data: { status: 'Available' },
            });
          }

          // Verify driver is not Suspended
          const currentDriver = await tx.driver.findUnique({ where: { id: targetDriverId } });
          if (currentDriver && currentDriver.status !== 'Suspended') {
            await tx.driver.update({
              where: { id: targetDriverId },
              data: { status: 'Available' },
            });
          }
        }
      }

      // If driver/vehicle is changed during an active "Dispatched" trip, swap their statuses
      if (oldStatus === 'Dispatched' && (!newStatus || newStatus === 'Dispatched')) {
        if (vehicle_id && vehicle_id !== existingTrip.vehicle_id) {
          // Free the old vehicle
          await tx.vehicle.update({
            where: { id: existingTrip.vehicle_id },
            data: { status: 'Available' },
          });
          // Occupy new vehicle
          await tx.vehicle.update({
            where: { id: vehicle_id },
            data: { status: 'OnTrip' },
          });
        }

        if (driver_id && driver_id !== existingTrip.driver_id) {
          // Free the old driver
          await tx.driver.update({
            where: { id: existingTrip.driver_id },
            data: { status: 'Available' },
          });
          // Occupy new driver
          await tx.driver.update({
            where: { id: driver_id },
            data: { status: 'OnTrip' },
          });
        }
      }

      return trip;
    });

    const fullTrip = await prisma.trip.findUnique({
      where: { id: updatedTrip.id },
      include: { vehicle: true, driver: true },
    });

    return res.json(fullTrip);
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

    // If deleting a dispatched trip, release the vehicle and driver
    await prisma.$transaction(async (tx) => {
      await tx.trip.delete({ where: { id } });
      if (existing.status === 'Dispatched') {
        await tx.vehicle.update({
          where: { id: existing.vehicle_id },
          data: { status: 'Available' },
        });
        await tx.driver.update({
          where: { id: existing.driver_id },
          data: { status: 'Available' },
        });
      }
    });

    return res.json({ message: 'Trip deleted successfully.' });
  } catch (error) {
    console.error('Delete trip error:', error);
    return res.status(500).json({ error: 'Failed to delete trip.' });
  }
};
