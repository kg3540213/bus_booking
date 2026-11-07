const express = require('express');
const router = express.Router();
const busesController = require('./buses.controller');
const { requireAuth } = require('../../middleware/auth');
const { requireRole } = require('../../middleware/rbac');

router.get('/', busesController.getAllBuses);
router.get('/:id', busesController.getBusById);
router.post('/', requireAuth, requireRole('ADMIN', 'OPERATOR'), busesController.createBus);

module.exports = router;
