const { z } = require('zod');
const { pool } = require('../../config/db');
const { logAuditTrail } = require('../../middleware/auditLogger');

const stopSchema = z.object({
  stop_name: z.string().min(2),
  stop_type: z.enum(['BOARDING', 'DROPPING', 'BOTH']),
  sequence_order: z.number().int().positive(),
  time_offset_mins: z.number().int().min(0),
  landmark: z.string().optional(),
});

const routeSchema = z.object({
  source_city: z.string().min(2),
  destination_city: z.string().min(2),
  distance_km: z.number().positive(),
  estimated_duration_mins: z.number().int().positive(),
  stops: z.array(stopSchema).optional(),
});

async function getAllRoutes(req, res, next) {
  try {
    const { source, destination } = req.query;
    let sql = `
      SELECT r.*, 
        (SELECT json_agg(rs ORDER BY rs.sequence_order) FROM route_stops rs WHERE rs.route_id = r.id) as stops
      FROM routes r
      WHERE r.status = 'ACTIVE'
    `;
    const params = [];

    if (source) {
      params.push(`%${source.trim().toLowerCase()}%`);
      sql += ` AND LOWER(r.source_city) LIKE $${params.length}`;
    }

    if (destination) {
      params.push(`%${destination.trim().toLowerCase()}%`);
      sql += ` AND LOWER(r.destination_city) LIKE $${params.length}`;
    }

    sql += ' ORDER BY r.source_city, r.destination_city';

    const result = await pool.query(sql, params);
    res.json({
      success: true,
      data: result.rows,
    });
  } catch (err) {
    next(err);
  }
}

async function getDistinctCities(req, res, next) {
  try {
    const result = await pool.query(`
      SELECT DISTINCT source_city as city FROM routes WHERE status = 'ACTIVE'
      UNION
      SELECT DISTINCT destination_city as city FROM routes WHERE status = 'ACTIVE'
      ORDER BY city ASC
    `);

    res.json({
      success: true,
      data: result.rows.map(r => r.city),
    });
  } catch (err) {
    next(err);
  }
}

async function getRouteById(req, res, next) {
  try {
    const { id } = req.params;
    const routeRes = await pool.query('SELECT * FROM routes WHERE id = $1', [id]);
    if (routeRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Route not found' });
    }

    const stopsRes = await pool.query(
      'SELECT * FROM route_stops WHERE route_id = $1 ORDER BY sequence_order ASC',
      [id]
    );

    res.json({
      success: true,
      data: {
        ...routeRes.rows[0],
        stops: stopsRes.rows,
      },
    });
  } catch (err) {
    next(err);
  }
}

async function createRoute(req, res, next) {
  const client = await pool.connect();
  try {
    const parsed = routeSchema.parse(req.body);

    await client.query('BEGIN');

    const routeRes = await client.query(
      `INSERT INTO routes (source_city, destination_city, distance_km, estimated_duration_mins, status)
       VALUES ($1, $2, $3, $4, 'ACTIVE')
       RETURNING *`,
      [parsed.source_city, parsed.destination_city, parsed.distance_km, parsed.estimated_duration_mins]
    );

    const route = routeRes.rows[0];

    const stops = parsed.stops || [
      { stop_name: `${parsed.source_city} Main Station`, stop_type: 'BOARDING', sequence_order: 1, time_offset_mins: 0, landmark: 'Main Stand' },
      { stop_name: `${parsed.destination_city} Main Terminal`, stop_type: 'DROPPING', sequence_order: 2, time_offset_mins: parsed.estimated_duration_mins, landmark: 'Central Terminal' },
    ];

    for (const stop of stops) {
      await client.query(
        `INSERT INTO route_stops (route_id, stop_name, stop_type, sequence_order, time_offset_mins, landmark)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [route.id, stop.stop_name, stop.stop_type, stop.sequence_order, stop.time_offset_mins, stop.landmark || null]
      );
    }

    await logAuditTrail({
      userId: req.user.id,
      action: 'ROUTE_CREATED',
      entityType: 'ROUTE',
      entityId: route.id,
      newValues: { route, stops },
      ipAddress: req.ip,
      client,
    });

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      data: {
        ...route,
        stops,
      },
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}

module.exports = { getAllRoutes, getDistinctCities, getRouteById, createRoute };
