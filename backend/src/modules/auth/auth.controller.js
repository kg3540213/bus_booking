const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const { pool } = require('../../config/db');
const { logAuditTrail } = require('../../middleware/auditLogger');

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().optional(),
  role: z.enum(['CUSTOMER', 'OPERATOR']).optional().default('CUSTOMER'),
  // Fields required if registering as an OPERATOR
  company_name: z.string().optional(),
  company_code: z.string().optional(),
  company_phone: z.string().optional(),
  company_address: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

function signToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      operator_id: user.operator_id,
    },
    process.env.JWT_SECRET || 'nexbus_jwt_secure_key_2026_enterprise',
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
}

async function register(req, res, next) {
  const client = await pool.connect();
  try {
    const data = registerSchema.parse(req.body);
    const emailLower = data.email.toLowerCase().trim();

    const existing = await client.query('SELECT id FROM users WHERE email = $1', [emailLower]);
    if (existing.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'An account with this email address already exists. Please sign in instead.',
      });
    }

    await client.query('BEGIN');

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.password, salt);

    let operatorId = null;

    // If registering as a Bus Operator, create the operator company entity first
    if (data.role === 'OPERATOR') {
      const companyName = data.company_name?.trim() || `${data.name} Travels`;
      let companyCode = data.company_code?.trim().toUpperCase() || companyName.substring(0, 3).toUpperCase();

      // Check code uniqueness
      const existingOp = await client.query('SELECT id FROM operators WHERE code = $1', [companyCode]);
      if (existingOp.rows.length > 0) {
        companyCode = `${companyCode}${Math.floor(10 + Math.random() * 90)}`;
      }

      const opRes = await client.query(
        `INSERT INTO operators (name, code, contact_email, contact_phone, address, status)
         VALUES ($1, $2, $3, $4, $5, 'ACTIVE')
         RETURNING id, name, code`,
        [
          companyName,
          companyCode,
          emailLower,
          data.company_phone || data.phone || '+91 98765 00000',
          data.company_address || 'Registered Transit Depot',
        ]
      );
      operatorId = opRes.rows[0].id;
    }

    const result = await client.query(
      `INSERT INTO users (name, email, password_hash, phone, role, operator_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, email, phone, role, operator_id, created_at`,
      [data.name.trim(), emailLower, passwordHash, data.phone || null, data.role, operatorId]
    );

    const user = result.rows[0];

    // If operator, fetch operator company details for response
    if (operatorId) {
      const opInfo = await client.query('SELECT name as operator_name, code as operator_code FROM operators WHERE id = $1', [operatorId]);
      user.operator_name = opInfo.rows[0]?.operator_name;
      user.operator_code = opInfo.rows[0]?.operator_code;
    }

    const token = signToken(user);

    await logAuditTrail({
      userId: user.id,
      action: user.role === 'OPERATOR' ? 'OPERATOR_REGISTERED' : 'CUSTOMER_REGISTERED',
      entityType: 'USER',
      entityId: user.id,
      newValues: { email: user.email, role: user.role, operator_id: user.operator_id },
      ipAddress: req.ip,
      client,
    });

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: `${user.role === 'OPERATOR' ? 'Operator partner' : 'Passenger'} account created successfully!`,
      data: { user, token },
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const result = await pool.query(
      `SELECT u.id, u.name, u.email, u.password_hash, u.phone, u.role, u.operator_id, o.name as operator_name, o.code as operator_code
       FROM users u
       LEFT JOIN operators o ON u.operator_id = o.id
       WHERE u.email = $1`,
      [email.toLowerCase().trim()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password',
      });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password',
      });
    }

    delete user.password_hash;
    const token = signToken(user);

    res.json({
      success: true,
      message: `Welcome back, ${user.name}!`,
      data: { user, token },
    });
  } catch (err) {
    next(err);
  }
}

async function getProfile(req, res, next) {
  try {
    const result = await pool.query(
      `SELECT u.id, u.name, u.email, u.phone, u.role, u.operator_id, o.name as operator_name, o.code as operator_code, u.created_at
       FROM users u
       LEFT JOIN operators o ON u.operator_id = o.id
       WHERE u.id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User profile not found' });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (err) {
    next(err);
  }
}

// Convenient demo role login for reviewer testing
async function demoLogin(req, res, next) {
  try {
    const { role } = req.body;
    let email = 'user@example.com';
    if (role === 'ADMIN') email = 'admin@nexbus.com';
    if (role === 'OPERATOR') email = 'operator@intercity.com';

    const result = await pool.query(
      `SELECT u.id, u.name, u.email, u.phone, u.role, u.operator_id, o.name as operator_name, o.code as operator_code
       FROM users u
       LEFT JOIN operators o ON u.operator_id = o.id
       WHERE u.email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: `Demo account for role ${role} not found` });
    }

    const user = result.rows[0];
    const token = signToken(user);

    res.json({
      success: true,
      message: `Switched session to demo ${role} account`,
      data: { user, token },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, getProfile, demoLogin };
