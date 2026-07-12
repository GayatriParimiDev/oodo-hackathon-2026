const express = require('express');
const router = express.Router();
const driverController = require('../controllers/driverController');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');

// All driver routes require authentication
router.use(auth);

router.get('/', driverController.getAll);
router.get('/:id', driverController.getById);

// Only FleetManager or SafetyOfficer can create, update, or delete drivers
router.post('/', requireRole(['FleetManager', 'SafetyOfficer']), driverController.create);
router.put('/:id', requireRole(['FleetManager', 'SafetyOfficer']), driverController.update);
router.delete('/:id', requireRole(['FleetManager']), driverController.delete);

module.exports = router;
