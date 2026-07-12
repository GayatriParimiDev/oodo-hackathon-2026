const prisma = require('../prisma/client');

exports.getAll = async (req, res) => {
  try {
    const { vehicleId, category } = req.query;
    const filter = {};
    if (vehicleId) filter.vehicle_id = vehicleId;
    if (category) filter.category = category;

    const expenses = await prisma.expense.findMany({
      where: filter,
      include: {
        vehicle: true,
      },
    });
    return res.json(expenses);
  } catch (error) {
    console.error('Fetch expenses error:', error);
    return res.status(500).json({ error: 'Failed to retrieve expenses.' });
  }
};

exports.create = async (req, res) => {
  try {
    const { vehicle_id, category, amount, expense_date, notes, description } = req.body;

    if (!category || amount === undefined) {
      return res.status(400).json({ error: 'category and amount are required.' });
    }

    // Support both 'notes' and 'description' as the same field
    const noteText = notes || description || null;
    // Default expense_date to today if not provided
    const expDate = expense_date ? new Date(expense_date) : new Date();

    let vehicleId = vehicle_id || null;

    // Verify vehicle if provided
    if (vehicleId) {
      const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
      if (!vehicle) {
        return res.status(400).json({ error: 'Vehicle not found.' });
      }
    }

    // If no vehicleId provided, pick the first vehicle as a placeholder (Expense requires vehicle_id in schema)
    if (!vehicleId) {
      const firstVehicle = await prisma.vehicle.findFirst();
      if (!firstVehicle) {
        return res.status(400).json({ error: 'No vehicles exist in the system. Please register a vehicle first before logging expenses.' });
      }
      vehicleId = firstVehicle.id;
    }

    const expense = await prisma.expense.create({
      data: {
        vehicle_id: vehicleId,
        category,
        amount: parseFloat(amount),
        expense_date: expDate,
        notes: noteText,
      },
      include: { vehicle: true },
    });

    return res.status(201).json(expense);
  } catch (error) {
    console.error('Create expense error:', error);
    return res.status(500).json({ error: 'Failed to record expense.' });
  }
};

exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.expense.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Expense not found.' });
    }

    await prisma.expense.delete({ where: { id } });
    return res.json({ message: 'Expense deleted successfully.' });
  } catch (error) {
    console.error('Delete expense error:', error);
    return res.status(500).json({ error: 'Failed to delete expense.' });
  }
};
