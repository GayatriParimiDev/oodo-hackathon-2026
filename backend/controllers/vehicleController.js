const prisma = require('../prisma/client');

exports.getAll = async (req, res) => {
  try {
    const { status, region } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (region) filter.region = region;

    const vehicles = await prisma.vehicle.findMany({
      where: filter,
      include: {
      trips: true,
      maintenances: true,
      fuelLogs: true,
      expenses: true,
    }
    });
    return res.json(vehicles);
  } catch (error) {
    console.error('Fetch vehicles error:', error);
    return res.status(500).json({ error: 'Failed to retrieve vehicles.' });
  }
};

exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
      include: {
        trips: true,
        maintenances: true,
        fuelLogs: true,
        expenses: true,
      },
    });

    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found.' });
    }
    return res.json(vehicle);
  } catch (error) {
    console.error('Fetch vehicle by ID error:', error);
    return res.status(500).json({ error: 'Failed to retrieve vehicle details.' });
  }
};

exports.create = async (req, res) => {
  try {
    const {
      registration_number,
      name_model,
      type,
      max_load_capacity,
      odometer,
      acquisition_cost,
      status,
      region,
      driverId,
    } = req.body;

    if (!registration_number || !name_model || !type || !max_load_capacity || !odometer || !acquisition_cost || !status || !region) {
      return res.status(400).json({ error: 'All fields (registration_number, name_model, type, max_load_capacity, odometer, acquisition_cost, status, region) are required.' });
    }

    const existing = await prisma.vehicle.findUnique({ where: { registration_number } });
    if (existing) {
      return res.status(400).json({ error: 'Registration number already exists.' });
    }

    const data = {
      registration_number,
      name_model,
      type,
      max_load_capacity: parseFloat(max_load_capacity),
      odometer: parseFloat(odometer),
      acquisition_cost: parseFloat(acquisition_cost),
      status,
      region,
    };

    const vehicle = await prisma.vehicle.create({
      data,
    });

    return res.status(201).json(vehicle);
  } catch (error) {
    console.error('Create vehicle error:', error);
    return res.status(500).json({ error: 'Failed to create vehicle.' });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      registration_number,
      name_model,
      type,
      max_load_capacity,
      odometer,
      acquisition_cost,
      status,
      region,
      driverId,
    } = req.body;

    const existingVehicle = await prisma.vehicle.findUnique({ where: { id } });
    if (!existingVehicle) {
      return res.status(404).json({ error: 'Vehicle not found.' });
    }

    if (registration_number && registration_number !== existingVehicle.registration_number) {
      const duplicateReg = await prisma.vehicle.findUnique({ where: { registration_number } });
      if (duplicateReg) {
        return res.status(400).json({ error: 'Registration number already in use by another vehicle.' });
      }
    }

    const data = {};
    if (registration_number !== undefined) data.registration_number = registration_number;
    if (name_model !== undefined) data.name_model = name_model;
    if (type !== undefined) data.type = type;
    if (max_load_capacity !== undefined) data.max_load_capacity = parseFloat(max_load_capacity);
    if (odometer !== undefined) data.odometer = parseFloat(odometer);
    if (acquisition_cost !== undefined) data.acquisition_cost = parseFloat(acquisition_cost);
    if (status !== undefined) data.status = status;
    if (region !== undefined) data.region = region;
    
    if (driverId !== undefined) {
      // Vehicle model doesn't have driverId relation in schema.prisma, skip
    }

    const vehicle = await prisma.vehicle.update({
      where: { id },
      data,
    });

    return res.json(vehicle);
  } catch (error) {
    console.error('Update vehicle error:', error);
    return res.status(500).json({ error: 'Failed to update vehicle.' });
  }
};

exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.vehicle.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Vehicle not found.' });
    }

    await prisma.vehicle.delete({ where: { id } });
    return res.json({ message: 'Vehicle deleted successfully.' });
  } catch (error) {
    console.error('Delete vehicle error:', error);
    return res.status(500).json({ error: 'Failed to delete vehicle. Make sure it does not have associated trips, maintenance logs, or expenses.' });
  }
};
