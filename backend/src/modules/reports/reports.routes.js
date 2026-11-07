const express = require('express');
const router = express.Router();
const reportsController = require('./reports.controller');
const { requireAuth } = require('../../middleware/auth');
const { requireRole } = require('../../middleware/rbac');

// Staff/Admin access for reporting & manifests
router.use(requireAuth);
router.use(requireRole('ADMIN', 'OPERATOR'));

router.get('/dashboard', reportsController.getDashboardSummary);
router.get('/occupancy', reportsController.getOccupancyReport);
router.get('/trips/:tripId/manifest', reportsController.getTripPassengerManifest);

module.exports = router;
