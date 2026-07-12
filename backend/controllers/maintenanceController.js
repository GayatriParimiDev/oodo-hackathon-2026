const prisma = require('../prisma/client');

exports.getAll = async (req, res) => {
  try {
    const { status, vehicleId } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (vehicleId) filter.vehicle_id = vehicleId;

    const logs = await prisma.maintenanceLog.findMany({
      where: filter,
      include: {
        vehicle: true,
      },
    });
    return res.json(logs);
  } catch (error) {
    console.error('Fetch maintenance logs error:', error);
    return res.status(500).json({ error: 'Failed to retrieve maintenance logs.' });
  }
};

exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const log = await prisma.maintenanceLog.findUnique({
      where: { id },
      include: {
        vehicle: true,
      },
    });

    if (!log) {
      return res.status(404).json({ error: 'Maintenance log not found.' });
    }
    return res.json(log);
  } catch (error) {
    console.error('Fetch maintenance log by ID error:', error);
    return res.status(500).json({ error: 'Failed to retrieve maintenance log details.' });
  }
};

exports.create = async (req, res) => {
  try {
    const { vehicle_id, description, cost, status } = req.body;

    if (!vehicle_id || !description || cost === undefined) {
      return res.status(400).json({ error: 'vehicle_id, description, and cost are required.' });
    }

    // Verify vehicle exists
    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicle_id } });
    if (!vehicle) {
      return res.status(400).json({ error: 'Vehicle not found.' });
    }

    const data = {
      vehicle_id,
      description,
      cost: parseFloat(cost),
      status: status || 'Active',
    };

    if (status === 'Closed') {
      data.closed_at = new Date();
    }

    const log = await prisma.maintenanceLog.create({
      data,
      include: { vehicle: true },
    });

    return res.status(201).json(log);
  } catch (error) {
    console.error('Create maintenance log error:', error);
    return res.status(500).json({ error: 'Failed to create maintenance log.' });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { vehicle_id, description, cost, status } = req.body;

    const existingLog = await prisma.maintenanceLog.findUnique({ where: { id } });
    if (!existingLog) {
      return res.status(404).json({ error: 'Maintenance log not found.' });
    }

    const data = {};
    if (vehicle_id !== undefined) data.vehicle_id = vehicle_id;
    if (description !== undefined) data.description = description;
    if (cost !== undefined) data.cost = parseFloat(cost);
    
    if (status !== undefined && status !== existingLog.status) {
      data.status = status;
      if (status === 'Closed') {
        data.closed_at = new Date();
      } else if (status === 'Active') {
        data.closed_at = null;
      }
    }

    const log = await prisma.maintenanceLog.update({
      where: { id },
      data,
      include: { vehicle: true },
    });

    return res.json(log);
  } catch (error) {
    console.error('Update maintenance log error:', error);
    return res.status(500).json({ error: 'Failed to update maintenance log.' });
  }
};

exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.maintenanceLog.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Maintenance log not found.' });
    }

    await prisma.maintenanceLog.delete({ where: { id } });
    return res.json({ message: 'Maintenance log deleted successfully.' });
  } catch (error) {
    console.error('Delete maintenance log error:', error);
    return res.status(500).json({ error: 'Failed to delete maintenance log.' });
  }
};
