const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');

async function seedDatabase() {
  console.log('Starting database seeding...');
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Cancellation Policies
    console.log('Seeding cancellation policies...');
    await client.query(`
      INSERT INTO cancellation_policies 
        (hours_before_departure_min, hours_before_departure_max, refund_percentage, deduction_percentage, description)
      VALUES
        (24, NULL, 90.00, 10.00, 'More than 24 hours prior to departure: 90% refund (10% fee)'),
        (12, 24, 50.00, 50.00, 'Between 12 to 24 hours prior to departure: 50% refund (50% fee)'),
        (2, 12, 25.00, 75.00, 'Between 2 to 12 hours prior to departure: 25% refund (75% fee)'),
        (0, 2, 0.00, 100.00, 'Less than 2 hours prior to departure: Non-refundable (100% fee)')
    `);

    // 2. Bus Operators
    console.log('Seeding operators...');
    const opRes = await client.query(`
      INSERT INTO operators (name, code, contact_email, contact_phone, address, status)
      VALUES
        ('Algions Express Travels', 'ALG', 'ops@algionstravels.com', '+91 98765 00001', 'Koramangala, Bangalore, Karnataka', 'ACTIVE'),
        ('Southern Star Superlines', 'SSL', 'ops@southernstar.com', '+91 98765 00002', 'Hitech City, Hyderabad, Telangana', 'ACTIVE'),
        ('Royal Cruiser Lines', 'RCL', 'ops@royalcruiser.com', '+91 98765 00003', 'Andheri East, Mumbai, Maharashtra', 'ACTIVE')
      RETURNING id, name, code;
    `);

    const opAlgionsId = opRes.rows.find(r => r.code === 'ALG').id;
    const opStarId = opRes.rows.find(r => r.code === 'SSL').id;
    const opRoyalId = opRes.rows.find(r => r.code === 'RCL').id;

    // 3. Demo Users (Admin, Operator, Customer)
    console.log('Seeding demo users...');
    const salt = await bcrypt.genSalt(10);
    const adminPass = await bcrypt.hash('Admin@123', salt);
    const opPass = await bcrypt.hash('Operator@123', salt);
    const userPass = await bcrypt.hash('User@123', salt);

    await client.query(`
      INSERT INTO users (name, email, password_hash, phone, role, operator_id)
      VALUES
        ('Algions System Admin', 'admin@algions.com', $1, '+91 99999 11111', 'ADMIN', NULL),
        ('Algions Fleet Manager', 'operator@intercity.com', $2, '+91 99999 22222', 'OPERATOR', $4),
        ('John Doe Passenger', 'user@example.com', $3, '+91 99999 33333', 'CUSTOMER', NULL),
        ('Priya Sharma Passenger', 'priya@example.com', $3, '+91 99999 44444', 'CUSTOMER', NULL)
    `, [adminPass, opPass, userPass, opAlgionsId]);

    // 4. Fleet Buses
    console.log('Seeding buses...');
    const busRes = await client.query(`
      INSERT INTO buses (operator_id, bus_number, model, bus_type, total_seats, amenities, status)
      VALUES
        ($1, 'KA-01-AG-2026', 'Volvo 9600 Multi-Axle Luxury Sleeper', 'AC_SLEEPER', 30, 
         '["AC", "WiFi", "Charging Point", "Blanket", "Water Bottle", "Reading Light", "Emergency Exit"]'::jsonb, 'ACTIVE'),
        ($1, 'KA-01-AG-5050', 'Scania Metrolink Multi-Axle High Deck', 'AC_SEATER', 40, 
         '["AC", "Charging Point", "Water Bottle", "Reading Light", "Live GPS Tracking"]'::jsonb, 'ACTIVE'),
        ($2, 'TS-09-SS-1122', 'BharatBenz AC Sleeper 2+1', 'AC_SLEEPER', 30, 
         '["AC", "Charging Point", "Blanket", "Pillow", "Water Bottle"]'::jsonb, 'ACTIVE'),
        ($3, 'MH-02-RC-8899', 'Mercedes-Benz Super Cruiser 2+2', 'AC_SEATER', 40, 
         '["AC", "WiFi", "Pushback Seats", "Charging Point", "Movie Screen"]'::jsonb, 'ACTIVE')
      RETURNING id, bus_number, bus_type, total_seats;
    `, [opAlgionsId, opStarId, opRoyalId]);

    const busVolvoSleeper = busRes.rows.find(b => b.bus_number === 'KA-01-AG-2026').id;
    const busScaniaSeater = busRes.rows.find(b => b.bus_number === 'KA-01-AG-5050').id;
    const busBharatSleeper = busRes.rows.find(b => b.bus_number === 'TS-09-SS-1122').id;
    const busMercedesSeater = busRes.rows.find(b => b.bus_number === 'MH-02-RC-8899').id;

    // Helper: Generate Sleeper 30 layout (15 Lower, 15 Upper)
    const generateSleeperLayout = async (busId) => {
      // 5 rows, col 1 (Single berth window), col 2 & 3 (Double berth)
      for (const deck of ['LOWER', 'UPPER']) {
        const prefix = deck === 'LOWER' ? 'L' : 'U';
        let seatNum = 1;
        for (let row = 1; row <= 5; row++) {
          // Single berth
          await client.query(`
            INSERT INTO seat_layouts (bus_id, seat_number, deck, row_num, col_num, seat_type, is_ladies_quota, price_multiplier)
            VALUES ($1, $2, $3, $4, 1, 'SLEEPER', $5, 1.10)
          `, [busId, `${prefix}${seatNum}`, deck, row, row === 1]);
          seatNum++;

          // Double berths
          await client.query(`
            INSERT INTO seat_layouts (bus_id, seat_number, deck, row_num, col_num, seat_type, is_ladies_quota, price_multiplier)
            VALUES ($1, $2, $3, $4, 2, 'SLEEPER', $5, 1.00)
          `, [busId, `${prefix}${seatNum}`, deck, row, row === 1]);
          seatNum++;

          await client.query(`
            INSERT INTO seat_layouts (bus_id, seat_number, deck, row_num, col_num, seat_type, is_ladies_quota, price_multiplier)
            VALUES ($1, $2, $3, $4, 3, 'SLEEPER', false, 1.00)
          `, [busId, `${prefix}${seatNum}`, deck, row]);
          seatNum++;
        }
      }
    };

    // Helper: Generate Seater 40 layout (10 rows of 4: 2x2)
    const generateSeaterLayout = async (busId) => {
      let seatNum = 1;
      for (let row = 1; row <= 10; row++) {
        for (let col = 1; col <= 4; col++) {
          const isWindow = col === 1 || col === 4;
          const isLadies = row === 1 && (col === 1 || col === 2);
          await client.query(`
            INSERT INTO seat_layouts (bus_id, seat_number, deck, row_num, col_num, seat_type, is_ladies_quota, price_multiplier)
            VALUES ($1, $2, 'LOWER', $3, $4, 'SEATER', $5, $6)
          `, [busId, `S${seatNum}`, row, col, isLadies, isWindow ? 1.05 : 1.00]);
          seatNum++;
        }
      }
    };

    console.log('Seeding seat layouts...');
    await generateSleeperLayout(busVolvoSleeper);
    await generateSeaterLayout(busScaniaSeater);
    await generateSleeperLayout(busBharatSleeper);
    await generateSeaterLayout(busMercedesSeater);

    // 5. Routes
    console.log('Seeding routes...');
    const routeRes = await client.query(`
      INSERT INTO routes (source_city, destination_city, distance_km, estimated_duration_mins, status)
      VALUES
        ('Bangalore', 'Hyderabad', 570.00, 540, 'ACTIVE'),
        ('Hyderabad', 'Bangalore', 570.00, 540, 'ACTIVE'),
        ('Mumbai', 'Pune', 150.00, 180, 'ACTIVE'),
        ('Pune', 'Mumbai', 150.00, 180, 'ACTIVE'),
        ('Bangalore', 'Chennai', 350.00, 360, 'ACTIVE')
      RETURNING id, source_city, destination_city;
    `);

    const rBlrHyd = routeRes.rows.find(r => r.source_city === 'Bangalore' && r.destination_city === 'Hyderabad').id;
    const rHydBlr = routeRes.rows.find(r => r.source_city === 'Hyderabad' && r.destination_city === 'Bangalore').id;
    const rMumPun = routeRes.rows.find(r => r.source_city === 'Mumbai' && r.destination_city === 'Pune').id;
    const rPunMum = routeRes.rows.find(r => r.source_city === 'Pune' && r.destination_city === 'Mumbai').id;
    const rBlrChn = routeRes.rows.find(r => r.source_city === 'Bangalore' && r.destination_city === 'Chennai').id;

    // 6. Route Stops (Boarding & Dropping)
    console.log('Seeding route stops...');
    await client.query(`
      INSERT INTO route_stops (route_id, stop_name, stop_type, sequence_order, time_offset_mins, landmark)
      VALUES
        -- Bangalore to Hyderabad
        ($1, 'Majestic Bus Stand', 'BOARDING', 1, 0, 'Platform 18 Kempegowda Terminal'),
        ($1, 'Anand Rao Circle', 'BOARDING', 2, 15, 'Near Flyover Signal'),
        ($1, 'Hebbal Esteem Mall', 'BOARDING', 3, 45, 'Service Road Bus Stop'),
        ($1, 'Shamshabad Airport Toll', 'DROPPING', 4, 480, 'Airport Expressway Junction'),
        ($1, 'Mehdipatnam Pillar 42', 'DROPPING', 5, 510, 'Opposite Pillar 42'),
        ($1, 'Ameerpet Metro Station', 'DROPPING', 6, 540, 'Near Big Bazaar Exit'),

        -- Hyderabad to Bangalore
        ($2, 'Ameerpet Metro Station', 'BOARDING', 1, 0, 'Near Metro Pillar 1045'),
        ($2, 'Gachibowli Outer Ring Road', 'BOARDING', 2, 30, 'ORR Bus Bay'),
        ($2, 'Hebbal Flyover', 'DROPPING', 3, 500, 'Hebbal Junction'),
        ($2, 'Majestic Kempegowda Terminal', 'DROPPING', 4, 540, 'Main Terminal'),

        -- Mumbai to Pune
        ($3, 'Dadar TT Circle', 'BOARDING', 1, 0, 'Asiad Bus Terminal'),
        ($3, 'Vashi Plaza Highway', 'BOARDING', 2, 40, 'Near Center One Mall'),
        ($3, 'Wakad Bridge', 'DROPPING', 3, 150, 'Expressway Wakad Junction'),
        ($3, 'Swargate Bus Stand', 'DROPPING', 4, 180, 'Opposite Police Station')
    `, [rBlrHyd, rHydBlr, rMumPun]);

    // 7. Trips Schedules & Trip Seats
    console.log('Seeding trips and trip seats for next 7 days...');
    
    // Create trips across dates: today, tomorrow, and subsequent days
    const now = new Date();
    const schedules = [
      // Bangalore to Hyderabad
      { routeId: rBlrHyd, busId: busVolvoSleeper, hour: 21, min: 0, duration: 540, fare: 1250 },
      { routeId: rBlrHyd, busId: busScaniaSeater, hour: 22, min: 30, duration: 540, fare: 850 },
      // Hyderabad to Bangalore
      { routeId: rHydBlr, busId: busBharatSleeper, hour: 21, min: 30, duration: 540, fare: 1200 },
      // Mumbai to Pune
      { routeId: rMumPun, busId: busMercedesSeater, hour: 8, min: 0, duration: 180, fare: 450 },
      { routeId: rMumPun, busId: busMercedesSeater, hour: 17, min: 0, duration: 180, fare: 480 },
    ];

    let createdTripIds = [];

    for (let dayOffset = 0; dayOffset <= 7; dayOffset++) {
      for (const sched of schedules) {
        const dep = new Date(now);
        dep.setDate(dep.getDate() + dayOffset);
        dep.setHours(sched.hour, sched.min, 0, 0);

        const arr = new Date(dep.getTime() + sched.duration * 60000);

        const tripInsert = await client.query(`
          INSERT INTO trips (bus_id, route_id, departure_time, arrival_time, base_fare, status)
          VALUES ($1, $2, $3, $4, $5, 'SCHEDULED')
          RETURNING id, bus_id, base_fare;
        `, [sched.busId, sched.routeId, dep.toISOString(), arr.toISOString(), sched.fare]);

        const tripId = tripInsert.rows[0].id;
        createdTripIds.push(tripId);

        // Populate trip_seats from seat_layouts
        await client.query(`
          INSERT INTO trip_seats (trip_id, seat_number, deck, seat_type, is_ladies_quota, fare, status)
          SELECT 
            $1, 
            sl.seat_number, 
            sl.deck, 
            sl.seat_type, 
            sl.is_ladies_quota, 
            ROUND($2 * sl.price_multiplier, 2),
            'AVAILABLE'
          FROM seat_layouts sl
          WHERE sl.bus_id = $3
        `, [tripId, sched.fare, sched.busId]);
      }
    }

    // 8. Create a sample confirmed booking to demonstrate manifests & analytics
    console.log('Seeding sample confirmed booking and audit log...');
    const sampleTripId = createdTripIds[0];
    const customerUser = (await client.query(`SELECT id FROM users WHERE email = 'user@example.com'`)).rows[0].id;
    const boardingStop = (await client.query(`SELECT id FROM route_stops WHERE route_id = $1 AND stop_type = 'BOARDING' LIMIT 1`, [rBlrHyd])).rows[0]?.id || null;
    const droppingStop = (await client.query(`SELECT id FROM route_stops WHERE route_id = $1 AND stop_type = 'DROPPING' LIMIT 1`, [rBlrHyd])).rows[0]?.id || null;

    const samplePnr = 'PNR-ALG-984210';
    const bookingRes = await client.query(`
      INSERT INTO bookings (
        pnr, user_id, trip_id, total_fare, status, 
        boarding_stop_id, dropping_stop_id, 
        primary_contact_name, primary_contact_email, primary_contact_phone,
        idempotency_key
      )
      VALUES (
        $1, $2, $3, 2750.00, 'CONFIRMED',
        $4, $5,
        'John Doe', 'user@example.com', '+91 99999 33333',
        'seed-idempotency-key-001'
      )
      RETURNING id;
    `, [samplePnr, customerUser, sampleTripId, boardingStop, droppingStop]);

    const bookingId = bookingRes.rows[0].id;

    // Add 2 passengers for L3 and L4
    await client.query(`
      INSERT INTO booking_passengers (booking_id, seat_number, passenger_name, passenger_age, passenger_gender, seat_fare, status)
      VALUES
        ($1, 'L3', 'John Doe', 32, 'MALE', 1375.00, 'CONFIRMED'),
        ($1, 'L4', 'Alice Doe', 29, 'FEMALE', 1375.00, 'CONFIRMED')
    `, [bookingId]);

    // Update trip_seats to BOOKED
    await client.query(`
      UPDATE trip_seats
      SET status = 'BOOKED', booking_id = $1
      WHERE trip_id = $2 AND seat_number IN ('L3', 'L4')
    `, [bookingId, sampleTripId]);

    // 9. Initial Audit Log
    await client.query(`
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_values, ip_address)
      VALUES
        ($1, 'BOOKING_CREATED', 'BOOKING', $2, '{"pnr": "PNR-ALG-984210", "seats": ["L3", "L4"], "total": 2750}'::jsonb, '127.0.0.1'),
        (1, 'SYSTEM_INIT', 'SYSTEM', '1', '{"message": "Database seeded with operators, routes, schedules, and policies"}'::jsonb, '127.0.0.1')
    `, [customerUser, bookingId.toString()]);

    await client.query('COMMIT');
    console.log('Database seeding successfully completed!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Seeding failed:', err);
    throw err;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { seedDatabase };
