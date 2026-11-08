const { z } = require('zod');
const { pool } = require('../../config/db');
const { logAuditTrail } = require('../../middleware/auditLogger');

const busSchema = z.object({
  operator_id: z.number().int().positive(),
  bus_number: z.string().min(3),
  model: z.string().min(2),
  bus_type: z.enum(['AC_SLEEPER', 'AC_SEATER', 'NON_AC_SEATER', 'NON_AC_SLEEPER', 'VOLVO_MULTI_AXLE']),
  total_seats: z.number().int().min(10).max(60),
  amenities: z.array(z.string()).optional(),
  status: z.enum(['ACTIVE', 'MAINTENANCE', 'DECOMMISSIONED']).optional(),
});

async function getAllBuses(req, res, next) {
  try {
    const { operator_id, bus_type } = req.query;
    let sql = `
      SELECT b.*, o.name as operator_name, o.code as operator_code
      FROM buses b
      JOIN operators o ON b.operator_id = o.id
      WHERE 1=1
    `;
    const params = [];

    if (operator_id) {
      params.push(operator_id);
      sql += ` AND b.operator_id = $${params.length}`;
    }

    if (bus_type) {
      params.push(bus_type);
      sql += ` AND b.bus_type = $${params.length}`;
    }

    sql += ' ORDER BY b.id DESC';

    const result = await pool.query(sql, params);
    res.json({
      success: true,
      data: result.rows,
    });
  } catch (err) {
    next(err);
  }
}

async function getBusById(req, res, next) {
  try {
    const { id } = req.params;
    const busRes = await pool.query(
      `SELECT b.*, o.name as operator_name, o.code as operator_code
       FROM buses b
       JOIN operators o ON b.operator_id = o.id
       WHERE b.id = $1`,
      [id]
    );

    if (busRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Bus not found' });
    }

    const seatsRes = await pool.query(
      `SELECT * FROM seat_layouts WHERE bus_id = $1 ORDER BY deck ASC, row_num ASC, col_num ASC`,
      [id]
    );

    res.json({
      success: true,
      data: {
        ...busRes.rows[0],
        seats: seatsRes.rows,
      },
    });
  } catch (err) {
    next(err);
  }
}

async function createBus(req, res, next) {
  const client = await pool.connect();
  try {
    const parsed = busSchema.parse(req.body);

    if (req.user.role === 'OPERATOR' && req.user.operator_id !== parsed.operator_id) {
      return res.status(403).json({ success: false, error: 'Cannot create bus for another operator' });
    }

    await client.query('BEGIN');

    const busRes = await client.query(
      `INSERT INTO buses (operator_id, bus_number, model, bus_type, total_seats, amenities, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        parsed.operator_id,
        parsed.bus_number.toUpperCase(),
        parsed.model,
        parsed.bus_type,
        parsed.total_seats,
        JSON.stringify(parsed.amenities || ['Charging Point', 'Reading Light', 'Water Bottle']),
        parsed.status || 'ACTIVE',
      ]
    );

    const bus = busRes.rows[0];

    // Automatically generate default seat layout
    const isSleeper = bus.bus_type.includes('SLEEPER');
    if (isSleeper) {
      // 2 decks, 15 each = 30 seats standard or proportional
      const seatsPerDeck = Math.floor(bus.total_seats / 2);
      for (const deck of ['LOWER', 'UPPER']) {
        const prefix = deck === 'LOWER' ? 'L' : 'U';
        let seatCount = 1;
        const rows = Math.ceil(seatsPerDeck / 3);
        for (let r = 1; r <= rows; r++) {
          for (let c = 1; c <= 3; c++) {
            if (seatCount > seatsPerDeck) break;
            const seatNum = `${prefix}${seatCount}`;
            await client.query(
              `INSERT INTO seat_layouts (bus_id, seat_number, deck, row_num, col_num, seat_type, is_ladies_quota, price_multiplier)
               VALUES ($1, $2, $3, $4, $5, 'SLEEPER', $6, $7)`,
              [bus.id, seatNum, deck, r, c, r === 1 && c <= 2, c === 1 ? 1.10 : 1.00]
            );
            seatCount++;
          }
        }
      }
    } else {
      // 2x2 Seater layout
      const rows = Math.ceil(bus.total_seats / 4);
      let seatCount = 1;
      for (let r = 1; r <= rows; r++) {
        for (let c = 1; c <= 4; c++) {
          if (seatCount > bus.total_seats) break;
          const seatNum = `S${seatCount}`;
          const isWindow = c === 1 || c === 4;
          await client.query(
            `INSERT INTO seat_layouts (bus_id, seat_number, deck, row_num, col_num, seat_type, is_ladies_quota, price_multiplier)
             VALUES ($1, $2, 'LOWER', $3, $4, 'SEATER', $5, $6)`,
            [bus.id, seatNum, r, c, r === 1 && c <= 2, isWindow ? 1.05 : 1.00]
          );
          seatCount++;
        }
      }
    }

    await logAuditTrail({
      userId: req.user.id,
      action: 'BUS_CREATED',
      entityType: 'BUS',
      entityId: bus.id,
      newValues: bus,
      ipAddress: req.ip,
      client,
    });

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      data: bus,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}

module.exports = { getAllBuses, getBusById, createBus };

