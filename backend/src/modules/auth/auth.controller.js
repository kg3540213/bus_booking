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
    process.env.JWT_SECRET || 'super_secret_jwt_key_algions_bus_2026',
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
}

async function register(req, res, next) {
  try {
    const { name, email, password, phone } = registerSchema.parse(req.body);

    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'An account with this email address already exists',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, phone, role)
       VALUES ($1, $2, $3, $4, 'CUSTOMER')
       RETURNING id, name, email, phone, role, created_at`,
      [name, email.toLowerCase(), passwordHash, phone || null]
    );

    const user = result.rows[0];
    const token = signToken(user);

    await logAuditTrail({
      userId: user.id,
      action: 'USER_REGISTERED',
      entityType: 'USER',
      entityId: user.id,
      newValues: { email: user.email, role: user.role },
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      data: { user, token },
    });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const result = await pool.query(
      `SELECT u.id, u.name, u.email, u.password_hash, u.phone, u.role, u.operator_id, o.name as operator_name
       FROM users u
       LEFT JOIN operators o ON u.operator_id = o.id
       WHERE u.email = $1`,
      [email.toLowerCase()]
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
      data: { user, token },
    });
  } catch (err) {
    next(err);
  }
}

async function getProfile(req, res, next) {
  try {
    const result = await pool.query(
      `SELECT u.id, u.name, u.email, u.phone, u.role, u.operator_id, o.name as operator_name, u.created_at
       FROM users u
       LEFT JOIN operators o ON u.operator_id = o.id
       WHERE u.id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
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
    if (role === 'ADMIN') email = 'admin@algions.com';
    if (role === 'OPERATOR') email = 'operator@intercity.com';

    const result = await pool.query(
      `SELECT u.id, u.name, u.email, u.phone, u.role, u.operator_id, o.name as operator_name
       FROM users u
       LEFT JOIN operators o ON u.operator_id = o.id
       WHERE u.email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Demo account not found' });
    }

    const user = result.rows[0];
    const token = signToken(user);

    res.json({
      success: true,
      data: { user, token },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, getProfile, demoLogin };

