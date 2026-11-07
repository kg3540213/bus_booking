const { pool } = require('../../config/db');

async function getAuditLogs(req, res, next) {
  try {
    const { action, entity_type, limit = 50, page = 1 } = req.query;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    let sql = `
      SELECT a.*, u.email as user_email, u.role as user_role, u.name as user_name
      FROM audit_logs a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (action) {
      params.push(action);
      sql += ` AND a.action = $${params.length}`;
    }

    if (entity_type) {
      params.push(entity_type);
      sql += ` AND a.entity_type = $${params.length}`;
    }

    params.push(parseInt(limit, 10));
    sql += ` ORDER BY a.created_at DESC LIMIT $${params.length}`;

    params.push(offset);
    sql += ` OFFSET $${params.length}`;

    const result = await pool.query(sql, params);
    const countRes = await pool.query('SELECT COUNT(*)::int as total FROM audit_logs');

    res.json({
      success: true,
      total: countRes.rows[0].total,
      data: result.rows,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAuditLogs };
