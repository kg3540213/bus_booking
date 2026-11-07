const express = require('express');
const router = express.Router();
const auditController = require('./audit.controller');
const { requireAuth } = require('../../middleware/auth');
const { requireRole } = require('../../middleware/rbac');

router.get('/', requireAuth, requireRole('ADMIN'), auditController.getAuditLogs);

module.exports = router;
