const express = require('express');
const router = express.Router();
const routesController = require('./routes.controller');
const { requireAuth } = require('../../middleware/auth');
const { requireRole } = require('../../middleware/rbac');

router.get('/cities', routesController.getDistinctCities);
router.get('/', routesController.getAllRoutes);
router.get('/:id', routesController.getRouteById);
router.post('/', requireAuth, requireRole('ADMIN', 'OPERATOR'), routesController.createRoute);

module.exports = router;

