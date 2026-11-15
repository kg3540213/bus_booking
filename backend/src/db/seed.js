const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');

async function seedDatabase() {
  console.log('Starting database seeding...');
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 0. Clean slate for idempotent seeding
    console.log('Truncating existing tables with RESTART IDENTITY...');
    await client.query(`
      TRUNCATE TABLE 
        audit_logs, 
        refunds, 
        booking_passengers, 
        bookings, 
        trip_seats, 
        trips, 
        route_stops, 
        routes, 
        seat_layouts, 
        buses, 
        users, 
        operators, 
        cancellation_policies 
      RESTART IDENTITY CASCADE;
    `);

    // 1. Cancellation Policies
    console.log('Seeding cancellation policies...');
    const polRes = await client.query(`
      INSERT INTO cancellation_policies 
        (hours_before_departure_min, hours_before_departure_max, refund_percentage, deduction_percentage, description)
      VALUES
        (24, NULL, 90.00, 10.00, 'More than 24 hours prior to departure: 90% refund (10% fee)'),
        (12, 24, 50.00, 50.00, 'Between 12 to 24 hours prior to departure: 50% refund (50% fee)'),
        (2, 12, 25.00, 75.00, 'Between 2 to 12 hours prior to departure: 25% refund (75% fee)'),
        (0, 2, 0.00, 100.00, 'Less than 2 hours prior to departure: Non-refundable (100% fee)')
      RETURNING id, refund_percentage;
    `);
    const policy24Id = polRes.rows[0].id;

    // 2. Bus Operators
    console.log('Seeding operators...');
    const opRes = await client.query(`
      INSERT INTO operators (name, code, contact_email, contact_phone, address, status)
      VALUES
        ('NexBus Premier Travels', 'NBX', 'ops@nexbustravels.com', '+91 98765 00001', 'Koramangala Transit Hub, Bangalore, Karnataka', 'ACTIVE'),
        ('Southern Star Superlines', 'SSL', 'ops@southernstar.com', '+91 98765 00002', 'Hitech City, Hyderabad, Telangana', 'ACTIVE'),
        ('Royal Cruiser Lines', 'RCL', 'ops@royalcruiser.com', '+91 98765 00003', 'Andheri East, Mumbai, Maharashtra', 'ACTIVE')
      RETURNING id, name, code;
    `);

    const opNexBusId = opRes.rows.find(r => r.code === 'NBX').id;
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
        ('NexBus System Administrator', 'admin@nexbus.com', $1, '+91 99999 11111', 'ADMIN', NULL),
        ('Intercity Fleet Dispatcher', 'operator@intercity.com', $2, '+91 99999 22222', 'OPERATOR', $4),
        ('John Doe Passenger', 'user@example.com', $3, '+91 99999 33333', 'CUSTOMER', NULL),
        ('Priya Sharma Passenger', 'priya@example.com', $3, '+91 99999 44444', 'CUSTOMER', NULL)
    `, [adminPass, opPass, userPass, opNexBusId]);

    // 4. Fleet Buses
    console.log('Seeding buses...');
    const busRes = await client.query(`
      INSERT INTO buses (operator_id, bus_number, model, bus_type, total_seats, amenities, status)
      VALUES
        ($1, 'KA-01-NB-2026', 'Volvo 9600 B11R Multi-Axle Luxury Sleeper (2+1)', 'AC_SLEEPER', 30, 
         '["AC", "High-Speed WiFi", "Charging Point", "Plush Blanket", "Mineral Water", "Reading Lamp", "GPS Live Tracking", "Emergency Hammer"]'::jsonb, 'ACTIVE'),
        ($1, 'KA-01-NB-5050', 'Scania Metrolink Multi-Axle HD Coach (2+2)', 'AC_SEATER', 40, 
         '["AC", "Individual USB Charger", "Water Bottle", "Reading Light", "Live GPS Tracking", "Pushback Ergonomic Seats"]'::jsonb, 'ACTIVE'),
        ($2, 'TS-09-SS-1122', 'BharatBenz Glider AC Sleeper (2+1)', 'AC_SLEEPER', 30, 
         '["AC", "Charging Point", "Blanket", "Pillow", "Water Bottle", "CCTV Surveillance"]'::jsonb, 'ACTIVE'),
        ($3, 'MH-02-RC-8899', 'Mercedes-Benz Super Cruiser Executive (2+2)', 'AC_SEATER', 40, 
         '["AC", "WiFi", "Pushback Seats", "Charging Point", "Entertainment Screen"]'::jsonb, 'ACTIVE')
      RETURNING id, bus_number, bus_type, total_seats;
    `, [opNexBusId, opStarId, opRoyalId]);

    const busVolvoSleeper = busRes.rows.find(b => b.bus_number === 'KA-01-NB-2026').id;
    const busScaniaSeater = busRes.rows.find(b => b.bus_number === 'KA-01-NB-5050').id;
    const busBharatSleeper = busRes.rows.find(b => b.bus_number === 'TS-09-SS-1122').id;
    const busMercedesSeater = busRes.rows.find(b => b.bus_number === 'MH-02-RC-8899').id;

    // Helper: Fast batch Sleeper layout
    const generateSleeperLayout = async (busId) => {
      const rows = [];
      for (const deck of ['LOWER', 'UPPER']) {
        const prefix = deck === 'LOWER' ? 'L' : 'U';
        let seatNum = 1;
        for (let row = 1; row <= 5; row++) {
          rows.push(`(${busId}, '${prefix}${seatNum}', '${deck}', ${row}, 1, 'SLEEPER', ${row === 1}, 1.10)`);
          seatNum++;
          rows.push(`(${busId}, '${prefix}${seatNum}', '${deck}', ${row}, 2, 'SLEEPER', ${row === 1}, 1.00)`);
          seatNum++;
          rows.push(`(${busId}, '${prefix}${seatNum}', '${deck}', ${row}, 3, 'SLEEPER', false, 1.00)`);
          seatNum++;
        }
      }
      await client.query(`
        INSERT INTO seat_layouts (bus_id, seat_number, deck, row_num, col_num, seat_type, is_ladies_quota, price_multiplier)
        VALUES ${rows.join(',')}
      `);
    };

    // Helper: Fast batch Seater layout
    const generateSeaterLayout = async (busId) => {
      const rows = [];
      let seatNum = 1;
      for (let row = 1; row <= 10; row++) {
        for (let col = 1; col <= 4; col++) {
          const isWindow = col === 1 || col === 4;
          const isLadies = row === 1 && (col === 1 || col === 2);
          rows.push(`(${busId}, 'S${seatNum}', 'LOWER', ${row}, ${col}, 'SEATER', ${isLadies}, ${isWindow ? 1.05 : 1.00})`);
          seatNum++;
        }
      }
      await client.query(`
        INSERT INTO seat_layouts (bus_id, seat_number, deck, row_num, col_num, seat_type, is_ladies_quota, price_multiplier)
        VALUES ${rows.join(',')}
      `);
    };

    console.log('Seeding seat layouts (batch mode)...');
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
        ('Bangalore', 'Chennai', 350.00, 360, 'ACTIVE'),
        ('Chennai', 'Bangalore', 350.00, 360, 'ACTIVE')
      RETURNING id, source_city, destination_city;
    `);

    const rBlrHyd = routeRes.rows.find(r => r.source_city === 'Bangalore' && r.destination_city === 'Hyderabad').id;
    const rHydBlr = routeRes.rows.find(r => r.source_city === 'Hyderabad' && r.destination_city === 'Bangalore').id;
    const rMumPun = routeRes.rows.find(r => r.source_city === 'Mumbai' && r.destination_city === 'Pune').id;
    const rPunMum = routeRes.rows.find(r => r.source_city === 'Pune' && r.destination_city === 'Mumbai').id;
    const rBlrChn = routeRes.rows.find(r => r.source_city === 'Bangalore' && r.destination_city === 'Chennai').id;
    const rChnBlr = routeRes.rows.find(r => r.source_city === 'Chennai' && r.destination_city === 'Bangalore').id;

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
        ($3, 'Swargate Bus Stand', 'DROPPING', 4, 180, 'Opposite Police Station'),

        -- Pune to Mumbai
        ($4, 'Swargate Bus Stand', 'BOARDING', 1, 0, 'Platform 2 Intercity Terminal'),
        ($4, 'Wakad Bridge Bypass', 'BOARDING', 2, 30, 'Expressway Wakad Flyover'),
        ($4, 'Vashi Plaza Toll', 'DROPPING', 3, 150, 'Navi Mumbai Highway Exit'),
        ($4, 'Dadar TT Circle', 'DROPPING', 4, 180, 'Main Terminal Dadar'),

        -- Bangalore to Chennai
        ($5, 'Majestic Kempegowda Terminal', 'BOARDING', 1, 0, 'Terminal 2 Intercity Bay'),
        ($5, 'Indiranagar 100ft Road', 'BOARDING', 2, 25, 'Near CMH Hospital Junction'),
        ($5, 'Hosur Sipcot Phase 1', 'BOARDING', 3, 75, 'Sipcot Highway Stop'),
        ($5, 'Sriperumbudur Toll Plaza', 'DROPPING', 4, 300, 'Bangalore-Chennai NH4 Junction'),
        ($5, 'Koyambedu CMBT Terminal', 'DROPPING', 5, 360, 'Platform 4 Omnibus Terminal'),

        -- Chennai to Bangalore
        ($6, 'Koyambedu CMBT Terminal', 'BOARDING', 1, 0, 'Platform 7 Private Omnibus Bay'),
        ($6, 'Poonamallee Bypass', 'BOARDING', 2, 30, 'Poonamallee Highway Junction'),
        ($6, 'Hosur Bus Stand', 'DROPPING', 3, 290, 'Hosur Central Circle'),
        ($6, 'Electronic City Toll', 'DROPPING', 4, 330, 'Toll Gate Service Road'),
        ($6, 'Majestic Kempegowda Terminal', 'DROPPING', 5, 360, 'Terminal 2 Intercity Arrival')
    `, [rBlrHyd, rHydBlr, rMumPun, rPunMum, rBlrChn, rChnBlr]);

    // 7. Trips Schedules & Trip Seats
    console.log('Seeding trips and trip seats for next 7 days...');
    
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
      // Pune to Mumbai
      { routeId: rPunMum, busId: busMercedesSeater, hour: 8, min: 30, duration: 180, fare: 450 },
      { routeId: rPunMum, busId: busMercedesSeater, hour: 17, min: 30, duration: 180, fare: 480 },
      // Bangalore to Chennai
      { routeId: rBlrChn, busId: busScaniaSeater, hour: 6, min: 30, duration: 360, fare: 750 },
      { routeId: rBlrChn, busId: busVolvoSleeper, hour: 14, min: 0, duration: 360, fare: 950 },
      // Chennai to Bangalore
      { routeId: rChnBlr, busId: busVolvoSleeper, hour: 7, min: 0, duration: 360, fare: 950 },
      { routeId: rChnBlr, busId: busScaniaSeater, hour: 15, min: 30, duration: 360, fare: 750 },
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

        // Fast batch populate trip_seats from seat_layouts
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

    // 8. Create sample confirmed and cancelled bookings
    console.log('Seeding sample bookings and audit logs...');
    const sampleTripId = createdTripIds[0];
    const customerUser = (await client.query(`SELECT id FROM users WHERE email = 'user@example.com'`)).rows[0].id;
    const priyaUser = (await client.query(`SELECT id FROM users WHERE email = 'priya@example.com'`)).rows[0].id;

    const blrBoardingStop = (await client.query(`SELECT id FROM route_stops WHERE route_id = $1 AND stop_type = 'BOARDING' LIMIT 1`, [rBlrHyd])).rows[0]?.id || null;
    const hydDroppingStop = (await client.query(`SELECT id FROM route_stops WHERE route_id = $1 AND stop_type = 'DROPPING' LIMIT 1`, [rBlrHyd])).rows[0]?.id || null;

    // Booking 1: Confirmed booking for John Doe
    const samplePnr = 'PNR-NBX-984210';
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
    `, [samplePnr, customerUser, sampleTripId, blrBoardingStop, hydDroppingStop]);

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

    // Booking 2: Confirmed booking for Priya Sharma (Bangalore -> Chennai)
    const tripChn = createdTripIds.find(tid => tid !== sampleTripId) || createdTripIds[1];
    const chnBoardingStop = (await client.query(`SELECT id FROM route_stops WHERE route_id = $1 AND stop_type = 'BOARDING' LIMIT 1`, [rBlrChn])).rows[0]?.id || null;
    const chnDroppingStop = (await client.query(`SELECT id FROM route_stops WHERE route_id = $1 AND stop_type = 'DROPPING' LIMIT 1`, [rBlrChn])).rows[0]?.id || null;

    const priyaPnr = 'PNR-NBX-542190';
    const priyaBookingRes = await client.query(`
      INSERT INTO bookings (
        pnr, user_id, trip_id, total_fare, status,
        boarding_stop_id, dropping_stop_id,
        primary_contact_name, primary_contact_email, primary_contact_phone,
        idempotency_key
      )
      VALUES (
        $1, $2, $3, 1045.00, 'CONFIRMED',
        $4, $5,
        'Priya Sharma', 'priya@example.com', '+91 99999 44444',
        'seed-idempotency-key-002'
      )
      RETURNING id;
    `, [priyaPnr, priyaUser, tripChn, chnBoardingStop, chnDroppingStop]);

    const priyaBookingId = priyaBookingRes.rows[0].id;

    await client.query(`
      INSERT INTO booking_passengers (booking_id, seat_number, passenger_name, passenger_age, passenger_gender, seat_fare, status)
      VALUES ($1, 'L1', 'Priya Sharma', 27, 'FEMALE', 1045.00, 'CONFIRMED')
    `, [priyaBookingId]);

    await client.query(`
      UPDATE trip_seats
      SET status = 'BOOKED', booking_id = $1
      WHERE trip_id = $2 AND seat_number = 'L1'
    `, [priyaBookingId, tripChn]);

    // Booking 3: Cancelled booking with refund record
    const cancelledPnr = 'PNR-NBX-778899';
    const cancelledBookingRes = await client.query(`
      INSERT INTO bookings (
        pnr, user_id, trip_id, total_fare, status,
        boarding_stop_id, dropping_stop_id,
        primary_contact_name, primary_contact_email, primary_contact_phone,
        idempotency_key, cancelled_at
      )
      VALUES (
        $1, $2, $3, 1250.00, 'CANCELLED',
        $4, $5,
        'John Doe', 'user@example.com', '+91 99999 33333',
        'seed-idempotency-key-003',
        NOW() - INTERVAL '2 hours'
      )
      RETURNING id;
    `, [cancelledPnr, customerUser, sampleTripId, blrBoardingStop, hydDroppingStop]);

    const cancelledBookingId = cancelledBookingRes.rows[0].id;

    await client.query(`
      INSERT INTO booking_passengers (booking_id, seat_number, passenger_name, passenger_age, passenger_gender, seat_fare, status)
      VALUES ($1, 'L5', 'John Doe', 32, 'MALE', 1250.00, 'CANCELLED')
    `, [cancelledBookingId]);

    await client.query(`
      INSERT INTO refunds (
        booking_id, cancellation_policy_id, total_booking_fare, cancellation_fee, refund_amount, hours_before_departure, status, processed_at
      )
      VALUES ($1, $2, 1250.00, 125.00, 1125.00, 36.50, 'PROCESSED', NOW() - INTERVAL '2 hours')
    `, [cancelledBookingId, policy24Id]);

    // 9. Initial Audit Logs
    await client.query(`
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_values, ip_address)
      VALUES
        ($1, 'BOOKING_CREATED', 'BOOKING', $2, '{"pnr": "PNR-NBX-984210", "seats": ["L3", "L4"], "total": 2750}'::jsonb, '127.0.0.1'),
        ($3, 'BOOKING_CREATED', 'BOOKING', $4, '{"pnr": "PNR-NBX-542190", "seats": ["L1"], "total": 1045}'::jsonb, '127.0.0.1'),
        ($1, 'BOOKING_CANCELLED', 'BOOKING', $5, '{"pnr": "PNR-NBX-778899", "refund": 1125, "fee": 125}'::jsonb, '127.0.0.1'),
        (1, 'SYSTEM_INIT', 'SYSTEM', '1', '{"message": "Database seeded with operators, routes, schedules, cancellation policies, and demo bookings"}'::jsonb, '127.0.0.1')
    `, [customerUser, bookingId.toString(), priyaUser, priyaBookingId.toString(), cancelledBookingId.toString()]);

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
