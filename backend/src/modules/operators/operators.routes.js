const express = require('express');
const router = express.Router();
const operatorsController = require('./operators.controller');
const { requireAuth } = require('../../middleware/auth');
const { requireRole } = require('../../middleware/rbac');

router.get('/', operatorsController.getAllOperators);
router.get('/:id', operatorsController.getOperatorById);
router.post('/', requireAuth, requireRole('ADMIN'), operatorsController.createOperator);
router.put('/:id', requireAuth, requireRole('ADMIN', 'OPERATOR'), operatorsController.updateOperator);

module.exports = router;
