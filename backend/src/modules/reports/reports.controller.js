const { pool } = require('../../config/db');

/**
 * Passenger Manifest for a specific trip schedule
 * Acceptance Test 5 Requirement
 */
async function getTripPassengerManifest(req, res, next) {
  try {
    const { tripId } = req.params;

    // 1. Fetch trip metadata
    const tripRes = await pool.query(`
      SELECT 
        t.id as trip_id,
        t.departure_time,
        t.arrival_time,
        t.status as trip_status,
        r.source_city,
        r.destination_city,
        r.distance_km,
        b.bus_number,
        b.model as bus_model,
        b.bus_type,
        b.total_seats,
        o.id as operator_id,
        o.name as operator_name,
        o.code as operator_code
      FROM trips t
      JOIN routes r ON t.route_id = r.id
      JOIN buses b ON t.bus_id = b.id
      JOIN operators o ON b.operator_id = o.id
      WHERE t.id = $1
    `, [tripId]);

    if (tripRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Trip schedule not found' });
    }

    const trip = tripRes.rows[0];

    // Check operator tenant isolation
    if (req.user.role === 'OPERATOR' && req.user.operator_id !== trip.operator_id) {
      return res.status(403).json({ success: false, error: 'Cannot view manifests of other operators' });
    }

    // 2. Fetch all confirmed passengers for this trip
    const manifestRes = await pool.query(`
      SELECT 
        bp.id as passenger_id,
        bp.seat_number,
        bp.passenger_name,
        bp.passenger_age,
        bp.passenger_gender,
        bp.seat_fare,
        bp.status as passenger_status,
        b.pnr,
        b.primary_contact_name,
        b.primary_contact_phone,
        b.primary_contact_email,
        b.created_at as booked_at,
        bstop.stop_name as boarding_stop,
        bstop.time_offset_mins as boarding_time_offset,
        dstop.stop_name as dropping_stop,
        dstop.time_offset_mins as dropping_time_offset
      FROM booking_passengers bp
      JOIN bookings b ON bp.booking_id = b.id
      LEFT JOIN route_stops bstop ON b.boarding_stop_id = bstop.id
      LEFT JOIN route_stops dstop ON b.dropping_stop_id = dstop.id
      WHERE b.trip_id = $1 AND b.status = 'CONFIRMED' AND bp.status = 'CONFIRMED'
      ORDER BY bp.seat_number ASC
    `, [tripId]);

    // 3. Occupancy summary for this trip
    const seatsRes = await pool.query(`
      SELECT 
        COUNT(*)::int as total_seats,
        COUNT(CASE WHEN status = 'BOOKED' THEN 1 END)::int as booked_seats,
        COUNT(CASE WHEN status = 'AVAILABLE' THEN 1 END)::int as available_seats
      FROM trip_seats
      WHERE trip_id = $1
    `, [tripId]);

    const seatStats = seatsRes.rows[0];
    const occupancyPercentage = seatStats.total_seats > 0
      ? Math.round((seatStats.booked_seats / seatStats.total_seats) * 10000) / 100
      : 0;

    res.json({
      success: true,
      data: {
        trip,
        occupancy: {
          total_capacity: seatStats.total_seats,
          confirmed_passengers: manifestRes.rows.length,
          booked_seats: seatStats.booked_seats,
          available_seats: seatStats.available_seats,
          occupancy_percentage: occupancyPercentage,
          reconciled: seatStats.booked_seats === manifestRes.rows.length,
        },
        passengers: manifestRes.rows,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Occupancy report across trips & routes
 * Acceptance Test 5 Requirement
 */
async function getOccupancyReport(req, res, next) {
  try {
    const { operator_id, route_id, from_date, to_date } = req.query;

    let sql = `
      SELECT 
        t.id as trip_id,
        t.departure_time,
        t.arrival_time,
        t.status as trip_status,
        r.source_city,
        r.destination_city,
        b.bus_number,
        b.bus_type,
        b.total_seats,
        o.id as operator_id,
        o.name as operator_name,
        (SELECT COUNT(*) FROM trip_seats ts WHERE ts.trip_id = t.id AND ts.status = 'BOOKED')::int as booked_seats,
        (SELECT COUNT(*) FROM trip_seats ts WHERE ts.trip_id = t.id AND ts.status = 'AVAILABLE')::int as available_seats,
        COALESCE((SELECT SUM(b.total_fare) FROM bookings b WHERE b.trip_id = t.id AND b.status = 'CONFIRMED'), 0)::numeric as confirmed_revenue
      FROM trips t
      JOIN routes r ON t.route_id = r.id
      JOIN buses b ON t.bus_id = b.id
      JOIN operators o ON b.operator_id = o.id
      WHERE 1=1
    `;

    const params = [];

    // Role filtering: operators see only their buses
    if (req.user.role === 'OPERATOR') {
      params.push(req.user.operator_id);
      sql += ` AND o.id = $${params.length}`;
    } else if (operator_id) {
      params.push(operator_id);
      sql += ` AND o.id = $${params.length}`;
    }

    if (route_id) {
      params.push(route_id);
      sql += ` AND r.id = $${params.length}`;
    }

    if (from_date) {
      params.push(from_date);
      sql += ` AND DATE(t.departure_time) >= $${params.length}::date`;
    }

    if (to_date) {
      params.push(to_date);
      sql += ` AND DATE(t.departure_time) <= $${params.length}::date`;
    }

    sql += ' ORDER BY t.departure_time DESC LIMIT 50';

    const result = await pool.query(sql, params);

    const formatted = result.rows.map(row => {
      const occPct = row.total_seats > 0
        ? Math.round((row.booked_seats / row.total_seats) * 10000) / 100
        : 0;
      return {
        ...row,
        occupancy_percentage: occPct,
      };
    });

    res.json({
      success: true,
      count: formatted.length,
      data: formatted,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * System-wide / Operator Executive Dashboard metrics
 */
async function getDashboardSummary(req, res, next) {
  try {
    let operatorFilter = '';
    const params = [];

    if (req.user.role === 'OPERATOR') {
      params.push(req.user.operator_id);
      operatorFilter = ` WHERE o.id = $${params.length}`;
    }

    // 1. Totals
    const statsRes = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM buses b JOIN operators o ON b.operator_id = o.id ${operatorFilter})::int as total_buses,
        (SELECT COUNT(*) FROM trips t JOIN buses b ON t.bus_id = b.id JOIN operators o ON b.operator_id = o.id ${operatorFilter})::int as total_trips,
        (SELECT COUNT(*) FROM bookings b JOIN trips t ON b.trip_id = t.id JOIN buses bus ON t.bus_id = bus.id JOIN operators o ON bus.operator_id = o.id WHERE b.status = 'CONFIRMED' ${operatorFilter ? ` AND o.id = $1` : ''})::int as confirmed_bookings,
        (SELECT COUNT(*) FROM bookings b JOIN trips t ON b.trip_id = t.id JOIN buses bus ON t.bus_id = bus.id JOIN operators o ON bus.operator_id = o.id WHERE b.status = 'CANCELLED' ${operatorFilter ? ` AND o.id = $1` : ''})::int as cancelled_bookings,
        COALESCE((SELECT SUM(b.total_fare) FROM bookings b JOIN trips t ON b.trip_id = t.id JOIN buses bus ON t.bus_id = bus.id JOIN operators o ON bus.operator_id = o.id WHERE b.status = 'CONFIRMED' ${operatorFilter ? ` AND o.id = $1` : ''}), 0)::numeric as gross_revenue,
        COALESCE((SELECT SUM(ref.refund_amount) FROM refunds ref JOIN bookings b ON ref.booking_id = b.id JOIN trips t ON b.trip_id = t.id JOIN buses bus ON t.bus_id = bus.id JOIN operators o ON bus.operator_id = o.id ${operatorFilter ? ` WHERE o.id = $1` : ''}), 0)::numeric as total_refunds
    `, params);

    // 2. Recent Bookings
    const recentRes = await pool.query(`
      SELECT 
        b.id,
        b.pnr,
        b.total_fare,
        b.status,
        b.primary_contact_name,
        b.primary_contact_phone,
        b.created_at,
        r.source_city,
        r.destination_city,
        t.departure_time,
        op.name as operator_name
      FROM bookings b
      JOIN trips t ON b.trip_id = t.id
      JOIN routes r ON t.route_id = r.id
      JOIN buses bus ON t.bus_id = bus.id
      JOIN operators op ON bus.operator_id = op.id
      ${operatorFilter ? ` WHERE op.id = $1` : ''}
      ORDER BY b.created_at DESC
      LIMIT 10
    `, params);

    const stats = statsRes.rows[0];
    const netRevenue = Number(stats.gross_revenue) - Number(stats.total_refunds);

    res.json({
      success: true,
      data: {
        summary: {
          total_buses: stats.total_buses,
          total_trips: stats.total_trips,
          confirmed_bookings: stats.confirmed_bookings,
          cancelled_bookings: stats.cancelled_bookings,
          gross_revenue: Number(stats.gross_revenue),
          total_refunds: Number(stats.total_refunds),
          net_revenue: Math.round(netRevenue * 100) / 100,
        },
        recent_bookings: recentRes.rows,
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getTripPassengerManifest,
  getOccupancyReport,
  getDashboardSummary,
};
