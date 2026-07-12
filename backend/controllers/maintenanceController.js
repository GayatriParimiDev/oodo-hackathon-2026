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
    const { vehicle_id, description, cost, status, service_type, estimated_cost } = req.body;

    // Support both 'cost' and 'estimated_cost' for creation
    const costValue = estimated_cost !== undefined ? estimated_cost : cost;

    if (!vehicle_id || !description || costValue === undefined) {
      return res.status(400).json({ error: 'vehicle_id, description, and cost/estimated_cost are required.' });
    }

    // Verify vehicle exists
    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicle_id } });
    if (!vehicle) {
      return res.status(400).json({ error: 'Vehicle not found.' });
    }

    const logStatus = status || 'Active';
    const data = {
      vehicle_id,
      description: service_type ? `[${service_type}] ${description}` : description,
      cost: parseFloat(costValue),
      status: logStatus,
    };

    if (logStatus === 'Closed') {
      data.closed_at = new Date();
    }

    // Create log and update vehicle status in a single transaction
    const log = await prisma.$transaction(async (tx) => {
      const createdLog = await tx.maintenanceLog.create({
        data,
      });

      // If log is active, transition vehicle status to InShop
      if (logStatus === 'Active') {
        await tx.vehicle.update({
          where: { id: vehicle_id },
          data: { status: 'InShop' },
        });
      }

      return createdLog;
    });

    const fullLog = await prisma.maintenanceLog.findUnique({
      where: { id: log.id },
      include: { vehicle: true },
    });

    return res.status(201).json(fullLog);
  } catch (error) {
    console.error('Create maintenance log error:', error);
    return res.status(500).json({ error: 'Failed to create maintenance log.' });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { vehicle_id, description, cost, status } = req.body;

    const existingLog = await prisma.maintenanceLog.findUnique({
      where: { id },
      include: { vehicle: true },
    });

    if (!existingLog) {
      return res.status(404).json({ error: 'Maintenance log not found.' });
    }

    const data = {};
    if (vehicle_id !== undefined) data.vehicle_id = vehicle_id;
    if (description !== undefined) data.description = description;
    
    // Support both 'cost' and 'actual_cost' for update
    const { actual_cost, resolution } = req.body;
    const costUpdate = actual_cost !== undefined ? actual_cost : req.body.cost;
    if (costUpdate !== undefined) data.cost = parseFloat(costUpdate);
    
    // Append resolution notes to description if provided
    if (resolution && resolution.trim()) {
      const existingDesc = existingLog.description || '';
      data.description = `${existingDesc}\n[Resolution]: ${resolution.trim()}`;
    }
    
    const oldStatus = existingLog.status;
    const newStatus = status;

    if (newStatus !== undefined && newStatus !== oldStatus) {
      data.status = newStatus;
      if (newStatus === 'Closed') {
        data.closed_at = new Date();
      } else if (newStatus === 'Active') {
        data.closed_at = null;
      }
    }

    const log = await prisma.$transaction(async (tx) => {
      const updatedLog = await tx.maintenanceLog.update({
        where: { id },
        data,
      });

      // Transition vehicle status
      if (newStatus !== undefined && newStatus !== oldStatus) {
        const targetVehicleId = vehicle_id || existingLog.vehicle_id;
        
        // Check if new status is Active -> set to InShop
        if (newStatus === 'Active') {
          await tx.vehicle.update({
            where: { id: targetVehicleId },
            data: { status: 'InShop' },
          });
        } 
        // If status becomes Closed -> restore to Available (unless retired)
        else if (newStatus === 'Closed') {
          const currentVehicle = await tx.vehicle.findUnique({ where: { id: targetVehicleId } });
          if (currentVehicle && currentVehicle.status !== 'Retired') {
            await tx.vehicle.update({
              where: { id: targetVehicleId },
              data: { status: 'Available' },
            });
          }
        }
      }

      return updatedLog;
    });

    const fullLog = await prisma.maintenanceLog.findUnique({
      where: { id: log.id },
      include: { vehicle: true },
    });

    return res.json(fullLog);
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

    // If deleting active maintenance, optionally restore vehicle to Available
    await prisma.$transaction(async (tx) => {
      await tx.maintenanceLog.delete({ where: { id } });
      
      if (existing.status === 'Active') {
        const currentVehicle = await tx.vehicle.findUnique({ where: { id: existing.vehicle_id } });
        if (currentVehicle && currentVehicle.status !== 'Retired') {
          await tx.vehicle.update({
            where: { id: existing.vehicle_id },
            data: { status: 'Available' },
          });
        }
      }
    });

    return res.json({ message: 'Maintenance log deleted successfully.' });
  } catch (error) {
    console.error('Delete maintenance log error:', error);
    return res.status(500).json({ error: 'Failed to delete maintenance log.' });
  }
};
