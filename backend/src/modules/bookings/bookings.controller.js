const { z } = require('zod');
const { pool } = require('../../config/db');
const { generatePNR } = require('../../utils/pnrGenerator');
const { calculateCancellationRefund } = require('../../utils/cancellationCalc');
const { logAuditTrail } = require('../../middleware/auditLogger');

const passengerSchema = z.preprocess((val) => {
  if (typeof val !== 'object' || val === null) return val;
  const name = (val.passenger_name || val.name || '').trim();
  const age = Number(val.passenger_age ?? val.age ?? 25);
  const genderRaw = String(val.passenger_gender || val.gender || 'MALE').toUpperCase();
  const gender = ['MALE', 'FEMALE', 'OTHER'].includes(genderRaw) ? genderRaw : 'MALE';

  return {
    seat_number: String(val.seat_number || '').trim(),
    passenger_name: name || 'Passenger',
    passenger_age: isNaN(age) || age < 1 ? 25 : age,
    passenger_gender: gender,
  };
}, z.object({
  seat_number: z.string().min(1),
  passenger_name: z.string().min(1),
  passenger_age: z.number().int().min(1).max(120),
  passenger_gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
}));

const createBookingSchema = z.preprocess((val) => {
  if (typeof val !== 'object' || val === null) return val;
  const rawPassengers = Array.isArray(val.passengers) ? val.passengers : [];
  const firstPassengerName = rawPassengers[0]?.passenger_name || rawPassengers[0]?.name || 'Passenger';

  const contactName = (val.primary_contact_name || val.contact_name || firstPassengerName || '').trim();
  const contactEmail = (val.primary_contact_email || val.contact_email || 'user@example.com').trim();
  const contactPhone = (val.primary_contact_phone || val.contact_phone || '+91 98765 43210').trim();

  return {
    ...val,
    trip_id: Number(val.trip_id),
    primary_contact_name: contactName || 'Passenger',
    primary_contact_email: contactEmail || 'user@example.com',
    primary_contact_phone: contactPhone || '+91 98765 43210',
    boarding_stop_id: val.boarding_stop_id ? Number(val.boarding_stop_id) : null,
    dropping_stop_id: val.dropping_stop_id ? Number(val.dropping_stop_id) : null,
  };
}, z.object({
  trip_id: z.number().int().positive(),
  selected_seats: z.array(z.string()).min(1, 'At least one seat must be selected'),
  passengers: z.array(passengerSchema).min(1),
  primary_contact_name: z.string().min(1),
  primary_contact_email: z.string().email(),
  primary_contact_phone: z.string().min(5),
  boarding_stop_id: z.number().int().positive().optional().nullable(),
  dropping_stop_id: z.number().int().positive().optional().nullable(),
  idempotency_key: z.string().optional().nullable(),
  payment_method: z.string().optional(),
  discount_amount: z.number().optional(),
}));

/**
 * Create a new booking with ACID transaction and pessimistic row locking
 * Acceptance Test 1 & 2
 */
async function createBooking(req, res, next) {
  const client = await pool.connect();
  try {
    const parsed = createBookingSchema.parse(req.body);
    const userId = req.user.id;

    // 1. Check idempotency if key provided
    if (parsed.idempotency_key) {
      const existing = await client.query(
        'SELECT * FROM bookings WHERE idempotency_key = $1',
        [parsed.idempotency_key]
      );
      if (existing.rows.length > 0) {
        const booking = existing.rows[0];
        return res.status(200).json({
          success: true,
          message: 'Booking retrieved via idempotency key',
          data: booking,
        });
      }
    }

    await client.query('BEGIN');

    // 2. Verify trip exists and is active
    const tripRes = await client.query(
      `SELECT t.*, r.source_city, r.destination_city
       FROM trips t
       JOIN routes r ON t.route_id = r.id
       WHERE t.id = $1`,
      [parsed.trip_id]
    );

    if (tripRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, error: 'Trip not found' });
    }

    const trip = tripRes.rows[0];
    if (trip.status === 'CANCELLED' || trip.status === 'COMPLETED') {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, error: `Trip is not eligible for booking (Status: ${trip.status})` });
    }

    // 3. PESSIMISTIC ROW-LEVEL LOCKING ON SEATS
    // This blocks concurrent requests attempting to book the same seats simultaneously
    const seatLockQuery = `
      SELECT id, seat_number, fare, status
      FROM trip_seats
      WHERE trip_id = $1 AND seat_number = ANY($2::text[])
      FOR UPDATE
    `;
    const seatsRes = await client.query(seatLockQuery, [parsed.trip_id, parsed.selected_seats]);

    // Check if all requested seats exist
    if (seatsRes.rows.length !== parsed.selected_seats.length) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        error: 'One or more requested seat numbers do not exist for this trip',
      });
    }

    // Check if any seat is already booked
    const alreadyBooked = seatsRes.rows.filter(s => s.status !== 'AVAILABLE');
    if (alreadyBooked.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({
        success: false,
        error: `Seat collision: The following seat(s) are already booked: ${alreadyBooked.map(s => s.seat_number).join(', ')}`,
        booked_seats: alreadyBooked.map(s => s.seat_number),
      });
    }

    // Calculate total fare
    const totalFare = seatsRes.rows.reduce((sum, s) => sum + Number(s.fare), 0);

    // 4. Generate unique PNR
    let pnr = generatePNR('NBX');
    let pnrCheck = await client.query('SELECT id FROM bookings WHERE pnr = $1', [pnr]);
    while (pnrCheck.rows.length > 0) {
      pnr = generatePNR('NBX');
      pnrCheck = await client.query('SELECT id FROM bookings WHERE pnr = $1', [pnr]);
    }

    // 5. Insert Booking record
    const bookingRes = await client.query(
      `INSERT INTO bookings (
        pnr, user_id, trip_id, total_fare, status,
        boarding_stop_id, dropping_stop_id,
        primary_contact_name, primary_contact_email, primary_contact_phone,
        idempotency_key
      )
      VALUES ($1, $2, $3, $4, 'CONFIRMED', $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        pnr,
        userId,
        parsed.trip_id,
        totalFare,
        parsed.boarding_stop_id || null,
        parsed.dropping_stop_id || null,
        parsed.primary_contact_name,
        parsed.primary_contact_email,
        parsed.primary_contact_phone,
        parsed.idempotency_key || null,
      ]
    );

    const booking = bookingRes.rows[0];

    // 6. Insert passenger items
    for (const p of parsed.passengers) {
      const seatObj = seatsRes.rows.find(s => s.seat_number === p.seat_number);
      const seatFare = seatObj ? Number(seatObj.fare) : Number(trip.base_fare);

      await client.query(
        `INSERT INTO booking_passengers (
          booking_id, seat_number, passenger_name, passenger_age, passenger_gender, seat_fare, status
        )
        VALUES ($1, $2, $3, $4, $5, $6, 'CONFIRMED')`,
        [booking.id, p.seat_number, p.passenger_name, p.passenger_age, p.passenger_gender, seatFare]
      );
    }

    // 7. Update trip_seats to BOOKED
    await client.query(
      `UPDATE trip_seats
       SET status = 'BOOKED', booking_id = $1
       WHERE trip_id = $2 AND seat_number = ANY($3::text[])`,
      [booking.id, parsed.trip_id, parsed.selected_seats]
    );

    // 8. Log Audit Trail
    await logAuditTrail({
      userId,
      action: 'BOOKING_CREATED',
      entityType: 'BOOKING',
      entityId: booking.id,
      newValues: {
        pnr,
        trip_id: parsed.trip_id,
        seats: parsed.selected_seats,
        total_fare: totalFare,
      },
      ipAddress: req.ip,
      client,
    });

    await client.query('COMMIT');

    // Fetch full confirmed booking details for response
    const fullBooking = await getBookingDetailsById(booking.id);

    res.status(201).json({
      success: true,
      message: 'Booking confirmed successfully!',
      data: fullBooking,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}

/**
 * Helper to fetch complete booking details with relations
 */
async function getBookingDetailsById(bookingId) {
  const res = await pool.query(`
    SELECT 
      b.*,
      t.departure_time,
      t.arrival_time,
      t.base_fare,
      r.source_city,
      r.destination_city,
      r.distance_km,
      bus.bus_number,
      bus.model as bus_model,
      bus.bus_type,
      op.name as operator_name,
      op.code as operator_code,
      bstop.stop_name as boarding_stop_name,
      bstop.time_offset_mins as boarding_time_offset,
      dstop.stop_name as dropping_stop_name,
      dstop.time_offset_mins as dropping_time_offset,
      (SELECT json_agg(bp ORDER BY bp.seat_number) FROM booking_passengers bp WHERE bp.booking_id = b.id) as passengers,
      (SELECT json_agg(ref) FROM refunds ref WHERE ref.booking_id = b.id) as refunds
    FROM bookings b
    JOIN trips t ON b.trip_id = t.id
    JOIN routes r ON t.route_id = r.id
    JOIN buses bus ON t.bus_id = bus.id
    JOIN operators op ON bus.operator_id = op.id
    LEFT JOIN route_stops bstop ON b.boarding_stop_id = bstop.id
    LEFT JOIN route_stops dstop ON b.dropping_stop_id = dstop.id
    WHERE b.id = $1
  `, [bookingId]);

  return res.rows[0] || null;
}

/**
 * Get booking by PNR (Public lookup / Boarding pass view)
 * Acceptance Test 3
 */
async function getBookingByPNR(req, res, next) {
  try {
    const { pnr } = req.params;
    const bookingRes = await pool.query('SELECT id FROM bookings WHERE pnr = $1', [pnr.trim().toUpperCase()]);

    if (bookingRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Booking with specified PNR not found' });
    }

    const fullBooking = await getBookingDetailsById(bookingRes.rows[0].id);

    res.json({
      success: true,
      data: fullBooking,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get current user's bookings list
 */
async function getUserBookings(req, res, next) {
  try {
    const userId = req.user.id;
    const result = await pool.query(`
      SELECT 
        b.id,
        b.pnr,
        b.total_fare,
        b.status,
        b.created_at,
        b.cancelled_at,
        t.departure_time,
        t.arrival_time,
        r.source_city,
        r.destination_city,
        bus.bus_number,
        bus.bus_type,
        op.name as operator_name,
        (SELECT json_agg(bp.seat_number) FROM booking_passengers bp WHERE bp.booking_id = b.id) as booked_seats
      FROM bookings b
      JOIN trips t ON b.trip_id = t.id
      JOIN routes r ON t.route_id = r.id
      JOIN buses bus ON t.bus_id = bus.id
      JOIN operators op ON bus.operator_id = op.id
      WHERE b.user_id = $1
      ORDER BY b.created_at DESC
    `, [userId]);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Preview cancellation fee and refund before confirming cancellation
 */
async function previewCancellationQuote(req, res, next) {
  try {
    const { id } = req.params;

    const bookingRes = await pool.query(`
      SELECT b.*, t.departure_time
      FROM bookings b
      JOIN trips t ON b.trip_id = t.id
      WHERE b.id = $1
    `, [id]);

    if (bookingRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    const booking = bookingRes.rows[0];

    // Authorization check
    if (req.user.role === 'CUSTOMER' && booking.user_id !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Cannot view cancellation details for other users' });
    }

    if (booking.status === 'CANCELLED') {
      return res.status(400).json({ success: false, error: 'Booking is already cancelled' });
    }

    const policiesRes = await pool.query('SELECT * FROM cancellation_policies ORDER BY hours_before_departure_min DESC');
    const quote = calculateCancellationRefund(booking.departure_time, booking.total_fare, policiesRes.rows);

    res.json({
      success: true,
      data: {
        booking_id: booking.id,
        pnr: booking.pnr,
        total_fare: booking.total_fare,
        departure_time: booking.departure_time,
        quote,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Cancel a booking and release seats back to AVAILABLE
 * Acceptance Test 4
 */
async function cancelBooking(req, res, next) {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const userId = req.user.id;

    await client.query('BEGIN');

    // 1. Lock booking row
    const bookingRes = await client.query(`
      SELECT b.*, t.departure_time, t.id as trip_id
      FROM bookings b
      JOIN trips t ON b.trip_id = t.id
      WHERE b.id = $1
      FOR UPDATE
    `, [id]);

    if (bookingRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    const booking = bookingRes.rows[0];

    // Authorization: customer can only cancel own booking
    if (req.user.role === 'CUSTOMER' && booking.user_id !== userId) {
      await client.query('ROLLBACK');
      return res.status(403).json({ success: false, error: 'Cannot cancel another user\'s booking' });
    }

    if (booking.status !== 'CONFIRMED') {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        error: `Booking cannot be cancelled because its current status is ${booking.status}`,
      });
    }

    // 2. Fetch policies & compute refund
    const policiesRes = await client.query('SELECT * FROM cancellation_policies ORDER BY hours_before_departure_min DESC');
    const refundCalc = calculateCancellationRefund(booking.departure_time, booking.total_fare, policiesRes.rows);

    if (!refundCalc.canCancel) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        error: refundCalc.reason || 'Trip has already departed. Cancellation is not allowed.',
      });
    }

    // 3. Update Booking status to CANCELLED
    await client.query(`
      UPDATE bookings
      SET status = 'CANCELLED', cancelled_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [booking.id]);

    // 4. Update passenger records to CANCELLED
    await client.query(`
      UPDATE booking_passengers
      SET status = 'CANCELLED'
      WHERE booking_id = $1
    `, [booking.id]);

    // 5. CRITICAL: Release seats back to AVAILABLE so other passengers can book!
    const releasedSeatsRes = await client.query(`
      UPDATE trip_seats
      SET status = 'AVAILABLE', booking_id = NULL
      WHERE booking_id = $1
      RETURNING seat_number
    `, [booking.id]);

    const releasedSeatNumbers = releasedSeatsRes.rows.map(r => r.seat_number);

    // 6. Record refund record
    const refundRes = await client.query(`
      INSERT INTO refunds (
        booking_id, cancellation_policy_id, total_booking_fare, cancellation_fee, refund_amount, hours_before_departure, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, 'PROCESSED')
      RETURNING *
    `, [
      booking.id,
      refundCalc.policyId,
      booking.total_fare,
      refundCalc.cancellationFee,
      refundCalc.refundAmount,
      refundCalc.hoursBeforeDeparture,
    ]);

    // 7. Audit log
    await logAuditTrail({
      userId,
      action: 'BOOKING_CANCELLED',
      entityType: 'BOOKING',
      entityId: booking.id,
      oldValues: { status: 'CONFIRMED', total_fare: booking.total_fare },
      newValues: {
        status: 'CANCELLED',
        released_seats: releasedSeatNumbers,
        refund: refundRes.rows[0],
      },
      ipAddress: req.ip,
      client,
    });

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Booking cancelled successfully. Seats have been returned to inventory and refund processed.',
      data: {
        booking_id: booking.id,
        pnr: booking.pnr,
        released_seats: releasedSeatNumbers,
        refund: refundRes.rows[0],
      },
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}

module.exports = {
  createBooking,
  getBookingByPNR,
  getUserBookings,
  previewCancellationQuote,
  cancelBooking,
};

