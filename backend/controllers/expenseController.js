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
    const { vehicle_id, category, amount, expense_date, notes } = req.body;

    if (!vehicle_id || !category || amount === undefined || !expense_date) {
      return res.status(400).json({ error: 'vehicle_id, category, amount, and expense_date are required.' });
    }

    // Verify vehicle
    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicle_id } });
    if (!vehicle) {
      return res.status(400).json({ error: 'Vehicle not found.' });
    }

    const expense = await prisma.expense.create({
      data: {
        vehicle_id,
        category,
        amount: parseFloat(amount),
        expense_date: new Date(expense_date),
        notes: notes || null,
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
