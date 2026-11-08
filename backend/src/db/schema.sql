-- Bus Booking Management System - Relational Schema DDL
-- Database: PostgreSQL 14+

-- Drop existing tables in reverse dependency order for clean migrations
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS refunds CASCADE;
DROP TABLE IF EXISTS booking_passengers CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS cancellation_policies CASCADE;
DROP TABLE IF EXISTS trip_seats CASCADE;
DROP TABLE IF EXISTS trips CASCADE;
DROP TABLE IF EXISTS route_stops CASCADE;
DROP TABLE IF EXISTS routes CASCADE;
DROP TABLE IF EXISTS seat_layouts CASCADE;
DROP TABLE IF EXISTS buses CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS operators CASCADE;

-- 1. Bus Operators
CREATE TABLE operators (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    contact_email VARCHAR(150) NOT NULL,
    contact_phone VARCHAR(20) NOT NULL,
    address TEXT,
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. System Users (RBAC: ADMIN, OPERATOR, CUSTOMER)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(20) NOT NULL CHECK (role IN ('ADMIN', 'OPERATOR', 'CUSTOMER')),
    operator_id INT NULL REFERENCES operators(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. Buses / Fleet Vehicles
CREATE TABLE buses (
    id SERIAL PRIMARY KEY,
    operator_id INT NOT NULL REFERENCES operators(id) ON DELETE RESTRICT,
    bus_number VARCHAR(50) UNIQUE NOT NULL,
    model VARCHAR(100) NOT NULL,
    bus_type VARCHAR(50) NOT NULL CHECK (bus_type IN ('AC_SLEEPER', 'AC_SEATER', 'NON_AC_SEATER', 'NON_AC_SLEEPER', 'VOLVO_MULTI_AXLE')),
    total_seats INT NOT NULL CHECK (total_seats > 0),
    amenities JSONB DEFAULT '["Charging Point", "Reading Light", "Water Bottle"]'::jsonb,
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'MAINTENANCE', 'DECOMMISSIONED')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4. Bus Seat Layout Templates
CREATE TABLE seat_layouts (
    id SERIAL PRIMARY KEY,
    bus_id INT NOT NULL REFERENCES buses(id) ON DELETE CASCADE,
    seat_number VARCHAR(10) NOT NULL,
    deck VARCHAR(10) DEFAULT 'LOWER' CHECK (deck IN ('LOWER', 'UPPER')),
    row_num INT NOT NULL,
    col_num INT NOT NULL,
    seat_type VARCHAR(20) DEFAULT 'SEATER' CHECK (seat_type IN ('SEATER', 'SLEEPER')),
    is_ladies_quota BOOLEAN DEFAULT FALSE,
    price_multiplier NUMERIC(3,2) DEFAULT 1.00,
    CONSTRAINT uq_bus_seat UNIQUE (bus_id, seat_number)
);

-- 5. Routes
CREATE TABLE routes (
    id SERIAL PRIMARY KEY,
    source_city VARCHAR(100) NOT NULL,
    destination_city VARCHAR(100) NOT NULL,
    distance_km NUMERIC(6,2),
    estimated_duration_mins INT NOT NULL CHECK (estimated_duration_mins > 0),
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 6. Route Intermediate Boarding / Dropping Stops
CREATE TABLE route_stops (
    id SERIAL PRIMARY KEY,
    route_id INT NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
    stop_name VARCHAR(150) NOT NULL,
    stop_type VARCHAR(20) NOT NULL CHECK (stop_type IN ('BOARDING', 'DROPPING', 'BOTH')),
    sequence_order INT NOT NULL,
    time_offset_mins INT NOT NULL DEFAULT 0,
    landmark TEXT,
    CONSTRAINT uq_route_stop_order UNIQUE (route_id, sequence_order)
);

-- 7. Trip Schedules
CREATE TABLE trips (
    id SERIAL PRIMARY KEY,
    bus_id INT NOT NULL REFERENCES buses(id) ON DELETE RESTRICT,
    route_id INT NOT NULL REFERENCES routes(id) ON DELETE RESTRICT,
    departure_time TIMESTAMPTZ NOT NULL,
    arrival_time TIMESTAMPTZ NOT NULL,
    base_fare NUMERIC(10,2) NOT NULL CHECK (base_fare > 0),
    status VARCHAR(20) DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'BOARDING', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_trip_times CHECK (arrival_time > departure_time)
);

-- 8. Trip Seat Instances (Row-level locking and atomic booking control)
CREATE TABLE trip_seats (
    id SERIAL PRIMARY KEY,
    trip_id INT NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    seat_number VARCHAR(10) NOT NULL,
    deck VARCHAR(10) DEFAULT 'LOWER' CHECK (deck IN ('LOWER', 'UPPER')),
    seat_type VARCHAR(20) DEFAULT 'SEATER' CHECK (seat_type IN ('SEATER', 'SLEEPER')),
    is_ladies_quota BOOLEAN DEFAULT FALSE,
    fare NUMERIC(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'BOOKED')),
    booking_id INT NULL,
    CONSTRAINT uq_trip_seat UNIQUE (trip_id, seat_number)
);

-- 9. Configurable Cancellation Policies
CREATE TABLE cancellation_policies (
    id SERIAL PRIMARY KEY,
    hours_before_departure_min INT NOT NULL,
    hours_before_departure_max INT NULL,
    refund_percentage NUMERIC(5,2) NOT NULL CHECK (refund_percentage >= 0 AND refund_percentage <= 100),
    deduction_percentage NUMERIC(5,2) NOT NULL CHECK (deduction_percentage >= 0 AND deduction_percentage <= 100),
    description VARCHAR(255) NOT NULL
);

-- 10. Bookings
CREATE TABLE bookings (
    id SERIAL PRIMARY KEY,
    pnr VARCHAR(30) UNIQUE NOT NULL,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    trip_id INT NOT NULL REFERENCES trips(id) ON DELETE RESTRICT,
    total_fare NUMERIC(10,2) NOT NULL CHECK (total_fare >= 0),
    status VARCHAR(20) DEFAULT 'CONFIRMED' CHECK (status IN ('CONFIRMED', 'CANCELLED')),
    boarding_stop_id INT NULL REFERENCES route_stops(id),
    dropping_stop_id INT NULL REFERENCES route_stops(id),
    primary_contact_name VARCHAR(100) NOT NULL,
    primary_contact_email VARCHAR(150) NOT NULL,
    primary_contact_phone VARCHAR(20) NOT NULL,
    idempotency_key VARCHAR(100) UNIQUE NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    cancelled_at TIMESTAMPTZ NULL
);

-- Add foreign key reference to trip_seats now that bookings table exists
ALTER TABLE trip_seats ADD CONSTRAINT fk_trip_seat_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL;

-- 11. Booking Passenger Items
CREATE TABLE booking_passengers (
    id SERIAL PRIMARY KEY,
    booking_id INT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    seat_number VARCHAR(10) NOT NULL,
    passenger_name VARCHAR(100) NOT NULL,
    passenger_age INT NOT NULL CHECK (passenger_age > 0 AND passenger_age < 120),
    passenger_gender VARCHAR(10) NOT NULL CHECK (passenger_gender IN ('MALE', 'FEMALE', 'OTHER')),
    seat_fare NUMERIC(10,2) NOT NULL CHECK (seat_fare >= 0),
    status VARCHAR(20) DEFAULT 'CONFIRMED' CHECK (status IN ('CONFIRMED', 'CANCELLED'))
);

-- 12. Refunds
CREATE TABLE refunds (
    id SERIAL PRIMARY KEY,
    booking_id INT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    cancellation_policy_id INT NULL REFERENCES cancellation_policies(id),
    total_booking_fare NUMERIC(10,2) NOT NULL,
    cancellation_fee NUMERIC(10,2) NOT NULL,
    refund_amount NUMERIC(10,2) NOT NULL,
    hours_before_departure NUMERIC(6,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'PROCESSED' CHECK (status IN ('INITIATED', 'PROCESSED', 'FAILED')),
    processed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 13. Audit Trail for Material Business Actions
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INT NULL REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(50) NOT NULL,
    old_values JSONB NULL,
    new_values JSONB NULL,
    ip_address VARCHAR(45) NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for Query Performance & Concurrency Integrity
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_buses_operator ON buses(operator_id);
CREATE INDEX idx_routes_cities ON routes(LOWER(source_city), LOWER(destination_city));
CREATE INDEX idx_trips_search ON trips(route_id, departure_time, status);
CREATE INDEX idx_trips_bus ON trips(bus_id);
CREATE INDEX idx_trip_seats_lookup ON trip_seats(trip_id, status);
CREATE INDEX idx_bookings_user ON bookings(user_id);
CREATE INDEX idx_bookings_trip ON bookings(trip_id);
CREATE INDEX idx_bookings_pnr ON bookings(pnr);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);

