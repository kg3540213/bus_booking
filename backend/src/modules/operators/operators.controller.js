const { z } = require('zod');
const { pool } = require('../../config/db');
const { logAuditTrail } = require('../../middleware/auditLogger');

const operatorSchema = z.object({
  name: z.string().min(2, 'Operator name required'),
  code: z.string().min(2).max(10).toUpperCase(),
  contact_email: z.string().email(),
  contact_phone: z.string().min(8),
  address: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
});

async function getAllOperators(req, res, next) {
  try {
    const result = await pool.query(`
      SELECT o.*, COUNT(b.id) as total_buses
      FROM operators o
      LEFT JOIN buses b ON o.id = b.operator_id
      GROUP BY o.id
      ORDER BY o.name ASC
    `);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (err) {
    next(err);
  }
}

async function getOperatorById(req, res, next) {
  try {
    const { id } = req.params;
    const opRes = await pool.query('SELECT * FROM operators WHERE id = $1', [id]);
    if (opRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Operator not found' });
    }

    const busesRes = await pool.query('SELECT * FROM buses WHERE operator_id = $1 ORDER BY bus_number ASC', [id]);

    res.json({
      success: true,
      data: {
        ...opRes.rows[0],
        buses: busesRes.rows,
      },
    });
  } catch (err) {
    next(err);
  }
}

async function createOperator(req, res, next) {
  try {
    const parsed = operatorSchema.parse(req.body);

    const result = await pool.query(
      `INSERT INTO operators (name, code, contact_email, contact_phone, address, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [parsed.name, parsed.code, parsed.contact_email, parsed.contact_phone, parsed.address || null, parsed.status || 'ACTIVE']
    );

    const operator = result.rows[0];

    await logAuditTrail({
      userId: req.user.id,
      action: 'OPERATOR_CREATED',
      entityType: 'OPERATOR',
      entityId: operator.id,
      newValues: operator,
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      data: operator,
    });
  } catch (err) {
    next(err);
  }
}

async function updateOperator(req, res, next) {
  try {
    const { id } = req.params;
    const parsed = operatorSchema.partial().parse(req.body);

    // If operator role, ensure user belongs to this operator
    if (req.user.role === 'OPERATOR' && req.user.operator_id !== parseInt(id, 10)) {
      return res.status(403).json({ success: false, error: 'Cannot update other operators' });
    }

    const existing = await pool.query('SELECT * FROM operators WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Operator not found' });
    }

    const current = existing.rows[0];
    const updated = {
      name: parsed.name ?? current.name,
      code: parsed.code ?? current.code,
      contact_email: parsed.contact_email ?? current.contact_email,
      contact_phone: parsed.contact_phone ?? current.contact_phone,
      address: parsed.address ?? current.address,
      status: parsed.status ?? current.status,
    };

    const result = await pool.query(
      `UPDATE operators
       SET name = $1, code = $2, contact_email = $3, contact_phone = $4, address = $5, status = $6
       WHERE id = $7
       RETURNING *`,
      [updated.name, updated.code, updated.contact_email, updated.contact_phone, updated.address, updated.status, id]
    );

    await logAuditTrail({
      userId: req.user.id,
      action: 'OPERATOR_UPDATED',
      entityType: 'OPERATOR',
      entityId: id,
      oldValues: current,
      newValues: result.rows[0],
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAllOperators, getOperatorById, createOperator, updateOperator };

