const express = require('express');
const router = express.Router();
const tripsController = require('./trips.controller');
const { requireAuth } = require('../../middleware/auth');
const { requireRole } = require('../../middleware/rbac');

router.get('/search', tripsController.searchTrips);
router.get('/:id', tripsController.getTripById);
router.post('/', requireAuth, requireRole('ADMIN', 'OPERATOR'), tripsController.createTrip);
router.patch('/:id/status', requireAuth, requireRole('ADMIN', 'OPERATOR'), tripsController.updateTripStatus);

module.exports = router;
