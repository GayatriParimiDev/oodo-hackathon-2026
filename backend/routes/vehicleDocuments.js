const express = require('express');
const router = express.Router();
const vehicleDocumentController = require('../controllers/vehicleDocumentController');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');

// All vehicle document routes require authentication
router.use(auth);

router.get('/', vehicleDocumentController.getAll);
router.get('/:id', vehicleDocumentController.getById);

// Creating, updating, and deleting requires FleetManager or SafetyOfficer roles
router.post('/', requireRole(['FleetManager', 'SafetyOfficer']), vehicleDocumentController.create);
router.put('/:id', requireRole(['FleetManager', 'SafetyOfficer']), vehicleDocumentController.update);
router.delete('/:id', requireRole(['FleetManager', 'SafetyOfficer']), vehicleDocumentController.delete);

module.exports = router;
