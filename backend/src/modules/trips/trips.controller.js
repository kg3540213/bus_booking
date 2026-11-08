const { z } = require('zod');
const { pool } = require('../../config/db');
const { logAuditTrail } = require('../../middleware/auditLogger');

const tripCreateSchema = z.object({
  bus_id: z.number().int().positive(),
  route_id: z.number().int().positive(),
  departure_time: z.string().datetime(),
  arrival_time: z.string().datetime(),
  base_fare: z.number().positive(),
});

/**
 * Search trips by source, destination, date and optional filters
 * Acceptance Test 1 Requirement
 */
async function searchTrips(req, res, next) {
  try {
    const {
      source,
      destination,
      date,
      bus_type,
      operator_id,
      min_price,
      max_price,
      departure_time_of_day, // morning (6-12), afternoon (12-18), evening (18-24), night (0-6)
      sort_by, // price_asc, price_desc, departure_asc, duration_asc
    } = req.query;

    let sql = `
      SELECT 
        t.id,
        t.departure_time,
        t.arrival_time,
        t.base_fare,
        t.status,
        ROUND(EXTRACT(EPOCH FROM (t.arrival_time - t.departure_time)) / 60) as duration_mins,
        r.id as route_id,
        r.source_city,
        r.destination_city,
        r.distance_km,
        b.id as bus_id,
        b.bus_number,
        b.model as bus_model,
        b.bus_type,
        b.amenities,
        o.id as operator_id,
        o.name as operator_name,
        o.code as operator_code,
        (SELECT COUNT(*) FROM trip_seats ts WHERE ts.trip_id = t.id AND ts.status = 'AVAILABLE')::int as available_seats,
        (SELECT COUNT(*) FROM trip_seats ts WHERE ts.trip_id = t.id)::int as total_seats,
        (SELECT MIN(ts.fare) FROM trip_seats ts WHERE ts.trip_id = t.id) as starting_fare,
        (SELECT json_agg(rs ORDER BY rs.sequence_order) 
         FROM route_stops rs 
         WHERE rs.route_id = r.id) as stops
      FROM trips t
      JOIN routes r ON t.route_id = r.id
      JOIN buses b ON t.bus_id = b.id
      JOIN operators o ON b.operator_id = o.id
      WHERE t.status != 'CANCELLED'
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

    if (date) {
      params.push(date);
      sql += ` AND DATE(t.departure_time) = $${params.length}::date`;
    }

    if (bus_type) {
      params.push(bus_type);
      sql += ` AND b.bus_type = $${params.length}`;
    }

    if (operator_id) {
      params.push(operator_id);
      sql += ` AND o.id = $${params.length}`;
    }

    if (min_price) {
      params.push(min_price);
      sql += ` AND t.base_fare >= $${params.length}`;
    }

    if (max_price) {
      params.push(max_price);
      sql += ` AND t.base_fare <= $${params.length}`;
    }

    if (departure_time_of_day) {
      if (departure_time_of_day === 'morning') {
        sql += ` AND EXTRACT(HOUR FROM t.departure_time) >= 6 AND EXTRACT(HOUR FROM t.departure_time) < 12`;
      } else if (departure_time_of_day === 'afternoon') {
        sql += ` AND EXTRACT(HOUR FROM t.departure_time) >= 12 AND EXTRACT(HOUR FROM t.departure_time) < 18`;
      } else if (departure_time_of_day === 'evening') {
        sql += ` AND EXTRACT(HOUR FROM t.departure_time) >= 18 AND EXTRACT(HOUR FROM t.departure_time) < 24`;
      } else if (departure_time_of_day === 'night') {
        sql += ` AND EXTRACT(HOUR FROM t.departure_time) >= 0 AND EXTRACT(HOUR FROM t.departure_time) < 6`;
      }
    }

    // Sorting
    if (sort_by === 'price_asc') {
      sql += ' ORDER BY t.base_fare ASC';
    } else if (sort_by === 'price_desc') {
      sql += ' ORDER BY t.base_fare DESC';
    } else if (sort_by === 'duration_asc') {
      sql += ' ORDER BY (t.arrival_time - t.departure_time) ASC';
    } else {
      sql += ' ORDER BY t.departure_time ASC';
    }

    const result = await pool.query(sql, params);

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get trip details including interactive seat layout with real-time status
 */
async function getTripById(req, res, next) {
  try {
    const { id } = req.params;

    const tripRes = await pool.query(`
      SELECT 
        t.*,
        ROUND(EXTRACT(EPOCH FROM (t.arrival_time - t.departure_time)) / 60) as duration_mins,
        r.source_city,
        r.destination_city,
        r.distance_km,
        b.bus_number,
        b.model as bus_model,
        b.bus_type,
        b.amenities,
        o.id as operator_id,
        o.name as operator_name,
        o.code as operator_code,
        o.contact_phone as operator_phone
      FROM trips t
      JOIN routes r ON t.route_id = r.id
      JOIN buses b ON t.bus_id = b.id
      JOIN operators o ON b.operator_id = o.id
      WHERE t.id = $1
    `, [id]);

    if (tripRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Trip not found' });
    }

    const trip = tripRes.rows[0];

    // Fetch seats for this trip joined with seat_layouts coordinates
    const seatsRes = await pool.query(`
      SELECT 
        ts.id as trip_seat_id,
        ts.seat_number,
        ts.deck,
        ts.seat_type,
        ts.is_ladies_quota,
        ts.fare,
        ts.status,
        sl.row_num,
        sl.col_num
      FROM trip_seats ts
      LEFT JOIN seat_layouts sl ON sl.bus_id = $1 AND sl.seat_number = ts.seat_number
      WHERE ts.trip_id = $2
      ORDER BY ts.deck ASC, sl.row_num ASC, sl.col_num ASC, ts.seat_number ASC
    `, [trip.bus_id, id]);

    // Fetch route stops
    const stopsRes = await pool.query(`
      SELECT * FROM route_stops
      WHERE route_id = $1
      ORDER BY sequence_order ASC
    `, [trip.route_id]);

    res.json({
      success: true,
      data: {
        ...trip,
        seats: seatsRes.rows,
        stops: stopsRes.rows,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Schedule a new trip and populate trip_seats from bus seat layout
 */
async function createTrip(req, res, next) {
  const client = await pool.connect();
  try {
    const parsed = tripCreateSchema.parse(req.body);

    // Departure must be in future and arrival after departure
    const dep = new Date(parsed.departure_time);
    const arr = new Date(parsed.arrival_time);
    if (arr <= dep) {
      return res.status(400).json({ success: false, error: 'Arrival time must be after departure time' });
    }

    await client.query('BEGIN');

    // Check bus exists and check role if operator
    const busRes = await client.query('SELECT * FROM buses WHERE id = $1', [parsed.bus_id]);
    if (busRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Bus not found' });
    }

    const bus = busRes.rows[0];
    if (req.user.role === 'OPERATOR' && req.user.operator_id !== bus.operator_id) {
      return res.status(403).json({ success: false, error: 'Cannot schedule trips for another operator' });
    }

    const tripRes = await client.query(`
      INSERT INTO trips (bus_id, route_id, departure_time, arrival_time, base_fare, status)
      VALUES ($1, $2, $3, $4, $5, 'SCHEDULED')
      RETURNING *
    `, [parsed.bus_id, parsed.route_id, parsed.departure_time, parsed.arrival_time, parsed.base_fare]);

    const trip = tripRes.rows[0];

    // Populate trip_seats from bus's seat_layouts
    await client.query(`
      INSERT INTO trip_seats (trip_id, seat_number, deck, seat_type, is_ladies_quota, fare, status)
      SELECT 
        $1,
        seat_number,
        deck,
        seat_type,
        is_ladies_quota,
        ROUND($2 * price_multiplier, 2),
        'AVAILABLE'
      FROM seat_layouts
      WHERE bus_id = $3
    `, [trip.id, parsed.base_fare, parsed.bus_id]);

    await logAuditTrail({
      userId: req.user.id,
      action: 'TRIP_SCHEDULED',
      entityType: 'TRIP',
      entityId: trip.id,
      newValues: trip,
      ipAddress: req.ip,
      client,
    });

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      data: trip,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}

/**
 * Update trip status (e.g. SCHEDULED -> BOARDING -> IN_TRANSIT -> COMPLETED)
 */
async function updateTripStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['SCHEDULED', 'BOARDING', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, error: `Invalid status. Must be one of [${validStatuses.join(', ')}]` });
    }

    const oldRes = await pool.query('SELECT * FROM trips WHERE id = $1', [id]);
    if (oldRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Trip not found' });
    }

    const result = await pool.query(`
      UPDATE trips SET status = $1 WHERE id = $2 RETURNING *
    `, [status, id]);

    await logAuditTrail({
      userId: req.user.id,
      action: 'TRIP_STATUS_UPDATED',
      entityType: 'TRIP',
      entityId: id,
      oldValues: { status: oldRes.rows[0].status },
      newValues: { status },
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

module.exports = { searchTrips, getTripById, createTrip, updateTripStatus };

