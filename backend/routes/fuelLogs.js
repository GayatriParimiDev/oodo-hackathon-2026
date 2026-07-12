const express = require('express');
const router = express.Router();
const fuelLogController = require('../controllers/fuelLogController');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');

// All fuel routes require authentication
router.use(auth);

router.get('/', fuelLogController.getAll);

// Drivers, FleetManagers can log fuel
router.post('/', requireRole(['FleetManager', 'Driver']), fuelLogController.create);
router.delete('/:id', requireRole(['FleetManager']), fuelLogController.delete);

module.exports = router;
