const { pool } = require('../config/db');

async function logAuditTrail({
  userId = null,
  action,
  entityType,
  entityId,
  oldValues = null,
  newValues = null,
  ipAddress = '127.0.0.1',
  client = null, // if passed, run within existing transaction
}) {
  const queryRunner = client || pool;
  const sql = `
    INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values, new_values, ip_address)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING id;
  `;
  const params = [
    userId,
    action,
    entityType,
    String(entityId),
    oldValues ? JSON.stringify(oldValues) : null,
    newValues ? JSON.stringify(newValues) : null,
    ipAddress,
  ];

  try {
    const res = await queryRunner.query(sql, params);
    return res.rows[0].id;
  } catch (err) {
    console.error('Failed to log audit trail:', err);
    // Don't fail the whole request if standalone audit log fails
    return null;
  }
}

module.exports = { logAuditTrail };

