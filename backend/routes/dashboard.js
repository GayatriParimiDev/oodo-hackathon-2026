const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');

// All dashboard endpoints require authentication
router.use(auth);

router.get('/stats', dashboardController.getStats);
router.get('/charts', dashboardController.getChartsData);

// CSV downloads can be accessed by FleetManagers and FinancialAnalysts
router.get('/export-trips', requireRole(['FleetManager', 'FinancialAnalyst']), dashboardController.exportTripsCsv);

module.exports = router;
