const express = require('express');
const router = express.Router();
const maintenanceController = require('../controllers/maintenanceController');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');

// All maintenance routes require authentication
router.use(auth);

router.get('/', maintenanceController.getAll);
router.get('/:id', maintenanceController.getById);

// Only FleetManager or SafetyOfficer can create, update, or delete maintenance records
router.post('/', requireRole(['FleetManager', 'SafetyOfficer']), maintenanceController.create);
router.put('/:id', requireRole(['FleetManager', 'SafetyOfficer']), maintenanceController.update);
router.delete('/:id', requireRole(['FleetManager']), maintenanceController.delete);

module.exports = router;
