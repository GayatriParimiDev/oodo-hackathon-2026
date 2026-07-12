const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');

// All expense routes require authentication
router.use(auth);

router.get('/', expenseController.getAll);

// Drivers, FleetManagers, and FinancialAnalysts can log expenses
router.post('/', requireRole(['FleetManager', 'Driver', 'FinancialAnalyst']), expenseController.create);
router.delete('/:id', requireRole(['FleetManager']), expenseController.delete);

module.exports = router;
