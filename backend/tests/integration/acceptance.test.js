const request = require('supertest');
const app = require('../../src/app');
const { pool } = require('../../src/config/db');

describe('Algions Bus Booking System - Acceptance Test Suite', () => {
  let customerToken;
  let customer2Token;
  let adminToken;
  let operatorToken;
  let targetTripId;
  let targetDate;
  let createdBookingId;
  let createdPNR;

  beforeAll(async () => {
    // Acquire JWT tokens for different roles via demo login endpoint
    const custRes = await request(app).post('/api/auth/demo-login').send({ role: 'CUSTOMER' });
    customerToken = custRes.body.data.token;

    // Login second customer for concurrency conflict test
    const cust2Res = await request(app).post('/api/auth/login').send({
      email: 'priya@example.com',
      password: 'User@123',
    });
    customer2Token = cust2Res.body.data.token;

    const admRes = await request(app).post('/api/auth/demo-login').send({ role: 'ADMIN' });
    adminToken = admRes.body.data.token;

    const opRes = await request(app).post('/api/auth/demo-login').send({ role: 'OPERATOR' });
    operatorToken = opRes.body.data.token;

    // Discover a scheduled trip for Bangalore to Hyderabad
    const tripsRes = await request(app)
      .get('/api/trips/search')
      .query({ source: 'Bangalore', destination: 'Hyderabad' });

    expect(tripsRes.status).toBe(200);
    expect(tripsRes.body.data.length).toBeGreaterThan(0);

    const trip = tripsRes.body.data[0];
    targetTripId = trip.id;
    targetDate = trip.departure_time.split('T')[0];
  });

  afterAll(async () => {
    await pool.end();
  });

  // Acceptance Test 1: Passenger can search valid trip and book available seat
  test('Acceptance Test 1: Passenger can search a valid trip and book an available seat', async () => {
    // 1. Search trip
    const searchRes = await request(app)
      .get('/api/trips/search')
      .query({
        source: 'Bangalore',
        destination: 'Hyderabad',
        date: targetDate,
      });

    expect(searchRes.status).toBe(200);
    expect(searchRes.body.data.length).toBeGreaterThan(0);

    // 2. Inspect seat layout to pick available seat
    const tripDetailRes = await request(app).get(`/api/trips/${targetTripId}`);
    expect(tripDetailRes.status).toBe(200);

    const availableSeat = tripDetailRes.body.data.seats.find(s => s.status === 'AVAILABLE' && s.seat_number !== 'L3' && s.seat_number !== 'L4');
    expect(availableSeat).toBeDefined();

    const chosenSeatNumber = availableSeat.seat_number;

    // 3. Book the seat
    const bookRes = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        trip_id: targetTripId,
        selected_seats: [chosenSeatNumber],
        passengers: [
          {
            seat_number: chosenSeatNumber,
            passenger_name: 'Test Passenger One',
            passenger_age: 26,
            passenger_gender: 'FEMALE',
          },
        ],
        primary_contact_name: 'Test Passenger One',
        primary_contact_email: 'testpassenger1@example.com',
        primary_contact_phone: '+91 98888 77777',
      });

    expect(bookRes.status).toBe(201);
    expect(bookRes.body.success).toBe(true);
    expect(bookRes.body.data.pnr).toMatch(/^PNR-ALG-/);
    expect(bookRes.body.data.status).toBe('CONFIRMED');

    createdBookingId = bookRes.body.data.id;
    createdPNR = bookRes.body.data.pnr;
  });

  // Acceptance Test 2: Concurrency & Seat Integrity (Simultaneous booking requests)
  test('Acceptance Test 2: Two users cannot confirm the same seat on one trip (Concurrency & Seat Integrity)', async () => {
    // Pick an available seat for conflict testing
    const tripDetailRes = await request(app).get(`/api/trips/${targetTripId}`);
    const availableSeat = tripDetailRes.body.data.seats.find(s => s.status === 'AVAILABLE');
    expect(availableSeat).toBeDefined();
    const conflictSeatNumber = availableSeat.seat_number;

    // Prepare two simultaneous booking requests for the exact same seat
    const req1 = request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        trip_id: targetTripId,
        selected_seats: [conflictSeatNumber],
        passengers: [
          {
            seat_number: conflictSeatNumber,
            passenger_name: 'User Alpha',
            passenger_age: 30,
            passenger_gender: 'MALE',
          },
        ],
        primary_contact_name: 'User Alpha',
        primary_contact_email: 'user.alpha@example.com',
        primary_contact_phone: '+91 91111 22222',
      });

    const req2 = request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${customer2Token}`)
      .send({
        trip_id: targetTripId,
        selected_seats: [conflictSeatNumber],
        passengers: [
          {
            seat_number: conflictSeatNumber,
            passenger_name: 'User Beta',
            passenger_age: 28,
            passenger_gender: 'FEMALE',
          },
        ],
        primary_contact_name: 'User Beta',
        primary_contact_email: 'user.beta@example.com',
        primary_contact_phone: '+91 93333 44444',
      });

    // Execute concurrently using Promise.all
    const [res1, res2] = await Promise.all([req1, req2]);

    const statuses = [res1.status, res2.status].sort();
    // Exactly one must succeed (201) and the second must be rejected with 409 Conflict!
    expect(statuses).toEqual([201, 409]);

    const conflictResponse = res1.status === 409 ? res1 : res2;
    expect(conflictResponse.body.success).toBe(false);
    expect(conflictResponse.body.error).toContain('Seat collision');
  });

  // Acceptance Test 3: PNR includes correct passenger, route, date and seat details
  test('Acceptance Test 3: The PNR includes correct passenger, route, date and seat details', async () => {
    expect(createdPNR).toBeDefined();

    const res = await request(app).get(`/api/bookings/pnr/${createdPNR}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const ticket = res.body.data;
    expect(ticket.pnr).toBe(createdPNR);
    expect(ticket.source_city).toBe('Bangalore');
    expect(ticket.destination_city).toBe('Hyderabad');
    expect(ticket.passengers).toBeDefined();
    expect(ticket.passengers.length).toBeGreaterThan(0);
    expect(ticket.passengers[0].passenger_name).toBe('Test Passenger One');
    expect(ticket.passengers[0].status).toBe('CONFIRMED');
    expect(ticket.departure_time).toBeDefined();
  });

  // Acceptance Test 4: Cancellation changes seat availability and refund status
  test('Acceptance Test 4: Cancellation changes seat availability and refund status according to policy', async () => {
    expect(createdBookingId).toBeDefined();

    // 1. Preview refund quote
    const quoteRes = await request(app)
      .get(`/api/bookings/${createdBookingId}/cancellation-quote`)
      .set('Authorization', `Bearer ${customerToken}`);

    expect(quoteRes.status).toBe(200);
    expect(quoteRes.body.data.quote.canCancel).toBe(true);
    expect(quoteRes.body.data.quote.refundPercentage).toBeGreaterThanOrEqual(0);

    // 2. Perform cancellation
    const cancelRes = await request(app)
      .post(`/api/bookings/${createdBookingId}/cancel`)
      .set('Authorization', `Bearer ${customerToken}`);

    expect(cancelRes.status).toBe(200);
    expect(cancelRes.body.success).toBe(true);
    expect(cancelRes.body.data.refund.status).toBe('PROCESSED');
    expect(cancelRes.body.data.released_seats.length).toBeGreaterThan(0);

    const releasedSeat = cancelRes.body.data.released_seats[0];

    // 3. Verify seat status in trip_seats has reverted back to AVAILABLE
    const seatCheck = await pool.query(
      'SELECT status FROM trip_seats WHERE trip_id = $1 AND seat_number = $2',
      [targetTripId, releasedSeat]
    );
    expect(seatCheck.rows[0].status).toBe('AVAILABLE');

    // 4. Verify booking status in database is CANCELLED
    const bookingCheck = await pool.query('SELECT status FROM bookings WHERE id = $1', [createdBookingId]);
    expect(bookingCheck.rows[0].status).toBe('CANCELLED');
  });

  // Acceptance Test 5: Operator manifest and occupancy summaries reconcile with confirmed tickets
  test('Acceptance Test 5: Operator manifest and occupancy summaries reconcile with confirmed tickets', async () => {
    // Fetch passenger manifest for target trip as operator
    const manifestRes = await request(app)
      .get(`/api/reports/trips/${targetTripId}/manifest`)
      .set('Authorization', `Bearer ${operatorToken}`);

    expect(manifestRes.status).toBe(200);
    expect(manifestRes.body.success).toBe(true);

    const { occupancy, passengers } = manifestRes.body.data;

    // Reconcile: booked seats count must match confirmed passenger list count exactly
    expect(occupancy.booked_seats).toBe(passengers.length);
    expect(occupancy.reconciled).toBe(true);
    expect(occupancy.total_capacity).toBe(occupancy.booked_seats + occupancy.available_seats);

    // Verify system-wide occupancy report
    const occReportRes = await request(app)
      .get('/api/reports/occupancy')
      .set('Authorization', `Bearer ${operatorToken}`);

    expect(occReportRes.status).toBe(200);
    expect(occReportRes.body.data.length).toBeGreaterThan(0);
  });

  // Test 6: Server-side RBAC enforcement (Negative security test)
  test('Security Test: Customer is forbidden from accessing Admin-only audit logs', async () => {
    const res = await request(app)
      .get('/api/audit')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('Forbidden');
  });
});
