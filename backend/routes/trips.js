const express = require('express');
const router = express.Router();
const tripController = require('../controllers/tripController');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');

// All trip routes require authentication
router.use(auth);

router.get('/', tripController.getAll);
router.get('/:id', tripController.getById);

// FleetManager or Driver can update (e.g. driver logging trip details)
// Only FleetManager can create or delete trips
router.post('/', requireRole(['FleetManager']), tripController.create);
router.put('/:id', requireRole(['FleetManager', 'Driver']), tripController.update);
router.delete('/:id', requireRole(['FleetManager']), tripController.delete);

module.exports = router;
