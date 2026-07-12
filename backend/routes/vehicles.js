const express = require('express');
const router = express.Router();
const vehicleController = require('../controllers/vehicleController');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');

// All vehicle routes require authentication
router.use(auth);

router.get('/', vehicleController.getAll);
router.get('/:id', vehicleController.getById);

// Only FleetManager or SafetyOfficer can create, update, or delete vehicles
router.post('/', requireRole(['FleetManager', 'SafetyOfficer']), vehicleController.create);
router.put('/:id', requireRole(['FleetManager', 'SafetyOfficer']), vehicleController.update);
router.delete('/:id', requireRole(['FleetManager']), vehicleController.delete);

module.exports = router;
