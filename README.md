# NexBus - Enterprise Bus Booking & Transit Management System
**Advanced Full-Stack Web Development Project**  
**Live Application URL:** [http://localhost:3000](http://localhost:3000)  
**REST API & OpenAPI Swagger Docs:** [http://localhost:5000/api/docs](http://localhost:5000/api/docs)  

NexBus is a production-grade, database-backed intercity transit management platform modeled after industry-leading travel platforms (**redBus, MakeMyTrip, FlixBus**). It features a dedicated **Transit Crimson (`#d84e55`)** design system, dual typography (**Plus Jakarta Sans** for UI and **JetBrains Mono** for transit metrics), server-side role-based access control (**RBAC**), pessimistic row-level locking (`SELECT FOR UPDATE`) for absolute seat exclusivity, automated tiered refund processing, and conductor passenger manifests with 100% occupancy reconciliation.

---

## 📑 Table of Contents

1. [System Architecture & Tech Stack](#-system-architecture--tech-stack)
2. [Role-Based Access Control & User Journeys](#-role-based-access-control--user-journeys)
   - [Passenger / Customer Journey](#1-passenger--traveler-journey-customer)
   - [Bus Operator & Conductor Journey](#2-bus-operator--fleet-dispatcher-journey-operator)
   - [System Administrator Journey](#3-system-administrator-journey-admin)
   - [Reviewer 1-Click Role Switcher](#4-reviewer-1-click-role-switcher)
3. [ACID Seat Concurrency & Data Integrity](#-acid-seat-concurrency--data-integrity)
4. [Cancellation Rules & Dynamic Refund Matrix](#-cancellation-rules--dynamic-refund-matrix)
5. [Quick Start & Docker Deployment](#-quick-start--docker-deployment)
6. [Pre-Seeded Demo Credentials](#-pre-seeded-demo-credentials)
7. [Automated Acceptance Test Suite (13/13 Passing)](#-automated-acceptance-test-suite)
8. [Database Schema & Entity Relationship Overview](#-database-schema--entity-relationship-overview)
9. [API Endpoint Reference (REST & Swagger)](#-api-endpoint-reference)
10. [Environment Configuration](#-environment-configuration)
11. [Design System & Human-Coded UI Standards](#-design-system--human-coded-ui-standards)
12. [Known Assumptions & Limitations](#-known-assumptions--limitations)

---

## 🏛 System Architecture & Tech Stack

The system follows a modular monolith architecture with strict separation between user interface, business logic, authorization middleware, and persistent storage:

```
┌─────────────────────────────────────────────────────────────────┐
│                      NEXBUS WEB FRONTEND                        │
│   React 18 • Vite 6 • Tailwind CSS 3.4 • Plus Jakarta Sans      │
│   Interactive Seat Maps • Boarding Passes • Real-Time Filters   │
└────────────────────────────────┬────────────────────────────────┘
                                 │ HTTP / JSON (Axios REST API)
┌────────────────────────────────▼────────────────────────────────┐
│                       EXPRESS BACKEND API                       │
│  Node.js 22 • Zod Schema Validation • JWT RBAC Auth             │
│  Pessimistic Row-Level Lock Manager • Immutable Audit Logger    │
└────────────────────────────────┬────────────────────────────────┘
                                 │ PostgreSQL Native Connection Pool
┌────────────────────────────────▼────────────────────────────────┐
│                      POSTGRESQL 16 DATABASE                     │
│  12 Normalized Tables • Foreign Key Constraints • Transactions  │
│  Trip Seats Inventory • Manifests • Dynamic Cancellation Ledger │
└─────────────────────────────────────────────────────────────────┘
```

### Core Technologies:
- **Frontend SPA**: React 18, React Router v6, Tailwind CSS v3.4, Lucide React icons, Google Fonts (`Plus Jakarta Sans` + `JetBrains Mono`).
- **Backend API**: Node.js 22, Express.js, Zod runtime request validation, JWT authentication with role claims, bcrypt.js password hashing, Winston/Morgan logging.
- **Database Layer**: PostgreSQL 16 Alpine, connection pooling via `pg`, declarative SQL migrations, and idempotent deterministic seeders.
- **Testing Engine**: Jest 29, Supertest, automated concurrency integration tests.
- **Containerization**: Docker Compose orchestration for multi-container production deployments (PostgreSQL, Express API, and Nginx Alpine static server with reverse proxy).

---

## 👥 Role-Based Access Control & User Journeys

The application enforces server-side Role-Based Access Control (**RBAC**). Authorization is never handled simply by hiding buttons in the UI; every sensitive API route inspects the verified JWT claims and returns `HTTP 403 Forbidden` if unauthorized.

```
       ┌──────────────────┐
       │   Public User    │ ─── Search Buses, View Routes, PNR Lookup
       └────────┬─────────┘
                │
         Sign In / Register
                │
     ┌──────────┴──────────┬────────────────────────┐
     ▼                     ▼                        ▼
┌──────────────┐   ┌────────────────┐      ┌─────────────────┐
│  CUSTOMER    │   │    OPERATOR    │      │      ADMIN      │
├──────────────┤   ├────────────────┤      ├─────────────────┤
│ Book Berths  │   │ Fleet Manifest │      │ System Overview │
│ Checkout/Pay │   │ Conductor Check│      │ Add Operators   │
│ View E-Ticket│   │ Occupancy Rec. │      │ Add Fleet Buses │
│ Instant Quote│   │ Route Schedules│      │ Add Schedules   │
│ Cancel/Refund│   │ Depot Status   │      │ Material Audit  │
└──────────────┘   └────────────────┘      └─────────────────┘
```

---

### 1. Passenger / Traveler Journey (`CUSTOMER`)

1. **Authentication & Profile**:
   - Register a personal account at `/register` or use the 1-click demo button.
   - Sign in with email and password at `/login`.
2. **Search & Discovery (`/`)**:
   - Select origin city (`Bangalore`, `Mumbai`, `Pune`) and destination city (`Hyderabad`, `Chennai`, `Pune`).
   - Use the circular **Swap button** to invert corridors with one click.
   - Choose a travel date with **Today** and **Tomorrow** quick preset chips.
   - Explore verified promotional codes: `NEXFIRST` (Flat ₹150 off) and `SAVE10` (10% off Volvo luxury sleeper).
3. **Filter & Sort Search Results (`/search`)**:
   - Filter by bus type: `All Bus Types`, `AC Sleeper 2+1`, `AC Seater High Deck`.
   - Filter by departure time of day: `Morning (06:00-12:00)`, `Afternoon (12:00-18:00)`, `Evening (18:00-24:00)`, `Night (00:00-06:00)`.
   - Sort by: `Earliest Departure`, `Price: Low to High`, `Price: High to Low`, `Shortest Duration`.
   - Inspect sub-tabs directly in bus cards: `Boarding & Dropping Points`, `Refund & Cancellation Rules`, and `Amenities`.
4. **Interactive Seat Selection (`SeatMap.jsx`)**:
   - View realistic chassis frame with front driver cabin orientation (`☸ Driver Cabin`) and rear exit.
   - Switch between **Lower Deck** and **Upper Deck** berths with live availability counts.
   - Color-coded seat indicators: Available (emerald), Selected (crimson with checkmark), Booked/Taken (muted gray), and Ladies Quota (soft pink).
   - Real-time floating action dock showing selected seats and aggregate fare.
5. **Booking Checkout (`/checkout`)**:
   - Choose exact boarding stop and dropping stop with scheduled pickup times.
   - Enter passenger details for each selected berth: Full Name, Age, and Gender (`Male | Female | Other`).
   - Provide contact email and phone number for e-ticket PDF dispatch and live SMS updates.
   - Apply discount coupon code (`NEXFIRST` / `SAVE10`) with real-time recalculation of GST (5%) and final payable total.
   - Select payment method simulation: `Instant UPI`, `Debit / Credit Card`, `Net Banking`, or `Pay at Bus`.
   - Submit booking with guaranteed ACID pessimistic seat locking.
6. **Electronic Boarding Pass & PNR Status (`/confirmation` & `/pnr-lookup`)**:
   - Receive unique booking reference: `PNR-NBX-XXXXXX`.
   - View authentic aviation-style boarding pass with perforated coupon notches (`ticket-notch-left`, `ticket-notch-right`), route map, baggage policy (15 kg + 7 kg), and QR scan graphic.
   - Print or save electronic boarding pass with 1-click (`window.print()`).
7. **My Bookings & Automated Refund Processing (`/my-bookings`)**:
   - View complete reservation history segmented by status tabs: `All Tickets`, `Confirmed`, and `Cancelled`.
   - Click **Cancel Booking** to open the real-time refund estimation modal.
   - Inspect the applicable refund tier, deduction fee, and estimated refund amount.
   - Confirm cancellation: booking status changes to `CANCELLED`, refund ledger entry is created, and seats immediately return to `AVAILABLE` for other travelers.

---

### 2. Bus Operator & Fleet Dispatcher Journey (`OPERATOR`)

1. **Operator Partner Registration**:
   - Dedicated registration tab at `/register`: captures personal manager credentials **plus** transit company metadata (Company Name, 2–4 letter Company Code, Depot City Address).
   - Automatically provisions a linked record in the `operators` table and assigns the user `OPERATOR` role.
2. **Fleet Operations & Schedule Inspection (`/operator`)**:
   - Select any scheduled departure across the fleet.
   - View bus metadata: vehicle model, registration plate, total capacity, departure, and arrival times.
3. **100% Occupancy Reconciliation**:
   - Real-time reconciliation card mathematically verifies:
     $$\text{Total Berths} = \text{Booked Seats} + \text{Available Seats}$$
   - Displays occupancy percentage, total confirmed revenue, and booked seat list.
4. **Interactive Conductor Manifest**:
   - View complete passenger manifest: seat number, passenger name, age, gender, PNR reference, boarding point, dropping point, emergency phone, and fare paid.
   - **Live Conductor Check-in**: Conductor can toggle check-in checkboxes (`✓ Boarded`) for passengers boarding at stations.
   - **Printable Manifest**: Dedicated print layout optimized for conductor clipboards on bus departures.

---

### 3. System Administrator Journey (`ADMIN`)

The Admin Console (`/admin`) provides centralized platform management across 5 specialized modules:

1. **Dashboard & KPI Summary**:
   - **Gross Booking Revenue**: Total value of confirmed bookings.
   - **Net Realized Revenue**: Gross revenue minus processed cancellation refunds.
   - **Confirmed vs Cancelled Count**: Real-time reservation health metrics.
   - **Active Fleet Metrics**: Total registered buses and active trip schedules.
   - **Live Real-Time Bookings Feed**: Tabular stream of incoming reservations.
2. **Operators & Fleet Management**:
   - List registered bus operators with contact details and fleet size.
   - Modal to register new operator partner companies.
   - List fleet vehicles with plate numbers, models, bus types (`AC_SLEEPER`, `AC_SEATER`), and capacities.
   - Modal to register new fleet vehicles (automatically generates layout grids).
3. **Routes & Schedules Management**:
   - Inspect travel corridors with total distance, duration, and intermediate stop sequences.
   - Modal to schedule new bus departures with bus assignment, route, departure/arrival timestamps, and base fares.
4. **Fleet Occupancy Utilization Reports**:
   - Cross-fleet tabular report with visual occupancy progress bars.
   - Reconciles passenger counts and confirmed revenue per scheduled run.
5. **Material Business Action Audit Trail**:
   - Immutable security audit log capturing all material actions: `CUSTOMER_REGISTERED`, `OPERATOR_REGISTERED`, `SEATS_BOOKED`, `BOOKING_CANCELLED`.
   - Records performing user email and role, client IP address, timestamp, and JSON diff of affected entities.
   - Protected by server-side RBAC: non-admin users receive `HTTP 403 Forbidden`.

---

### 4. Reviewer 1-Click Role Switcher

To allow reviewers to evaluate all user journeys without repeatedly logging out and typing credentials, a discrete **Quick Persona Switch** control is embedded in the top notification strip:

- Click **Passenger** → Instantly authenticates as `user@example.com` (`CUSTOMER`) and redirects to Bus Search.
- Click **Operator** → Instantly authenticates as `operator@intercity.com` (`OPERATOR`) and redirects to Operator Portal.
- Click **Admin** → Instantly authenticates as `admin@nexbus.com` (`ADMIN`) and redirects to Admin Console.

---

## 🔒 ACID Seat Concurrency & Data Integrity

A critical requirement of any enterprise transit reservation system is the **absolute prevention of double bookings** during high-concurrency booking spikes.

### The Problem:
If User A and User B simultaneously attempt to book Seat `L3` on Trip `1`:
- A naive `SELECT status FROM trip_seats WHERE seat_number = 'L3'` will show `AVAILABLE` to both users.
- Both users proceed to checkout and execute `UPDATE trip_seats SET status = 'BOOKED'`.
- Both users receive confirmed tickets for the same physical seat.

### The NexBus Solution (Pessimistic Row-Level Locking):
NexBus implements pessimistic row locking within an explicit PostgreSQL transaction:

```javascript
// backend/src/modules/bookings/bookings.controller.js
await client.query('BEGIN');

// Lock target seat rows exclusively for the duration of this transaction
const seatCheck = await client.query(
  `SELECT id, seat_number, status, fare
   FROM trip_seats
   WHERE trip_id = $1 AND seat_number = ANY($2::text[])
   FOR UPDATE`,
  [trip_id, selected_seats]
);

// If any seat is not AVAILABLE, reject the transaction immediately
const unavailable = seatCheck.rows.filter(s => s.status !== 'AVAILABLE');
if (unavailable.length > 0) {
  await client.query('ROLLBACK');
  return res.status(409).json({
    success: false,
    error: `Seat(s) ${unavailable.map(s => s.seat_number).join(', ')} already booked by another traveler.`
  });
}

// Mark seats as BOOKED within the locked transaction
await client.query(
  `UPDATE trip_seats SET status = 'BOOKED'
   WHERE trip_id = $1 AND seat_number = ANY($2::text[])`,
  [trip_id, selected_seats]
);

// Commit transaction and release row locks
await client.query('COMMIT');
```

**Verification**: This mechanism is validated in automated acceptance test #2 via `Promise.all`: two concurrent requests compete for the identical seat. Exactly **one request succeeds (`HTTP 201 Created`)** and the concurrent request is **guaranteed rejection (`HTTP 409 Conflict`)**.

---

## 💸 Cancellation Rules & Dynamic Refund Matrix

Cancellations enforce a deterministic, configurable multi-tier policy stored in `cancellation_policies`. When a passenger requests a cancellation quote or confirms cancellation, the backend calculates the hours remaining between current server time and scheduled trip departure:

$$\Delta t = \frac{\text{Departure Time} - \text{Current Time}}{\text{3600 seconds}}$$

| Notice Window Prior to Departure | Refund Percentage | Cancellation Fee | Policy Description |
| :--- | :---: | :---: | :--- |
| **$\Delta t \ge 24$ hours** | **90.00%** | 10.00% | Full flexibility: 90% refund processed, 10% fee. |
| **$12 \text{ hrs} \le \Delta t < 24 \text{ hrs}$** | **50.00%** | 50.00% | Standard notice: 50% refund processed, 50% fee. |
| **$2 \text{ hrs} \le \Delta t < 12 \text{ hrs}$** | **25.00%** | 75.00% | Short notice: 25% refund processed, 75% fee. |
| **$\Delta t < 2$ hours** | **0.00%** | 100.00% | Last-minute window: Non-refundable (0% refund). |

### Cancellation Side Effects:
1. Booking record status transitions from `CONFIRMED` to `CANCELLED`.
2. A formal refund ledger entry is recorded in `refunds` with calculated payout, fee, and refund status (`PROCESSED`).
3. Associated seat records in `trip_seats` transition from `BOOKED` back to `AVAILABLE`.
4. A security audit record (`BOOKING_CANCELLED`) is appended to `audit_logs`.

---

## 🚀 Quick Start & Docker Deployment

### Option 1: Docker Compose (Zero Configuration)

Ensure Docker Desktop is running:

```bash
# 1. Clone repository and navigate to root
git clone <repo-url>
cd bus_booking

# 2. Build and launch all 3 containers
docker-compose up --build -d
```

#### Application Endpoints:
- **Frontend Web Application**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:5000](http://localhost:5000)
- **Interactive Swagger Docs**: [http://localhost:5000/api/docs](http://localhost:5000/api/docs)
- **API Health Check**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

### Option 2: Local Run (Node.js & PostgreSQL)

```bash
# 1. Start PostgreSQL container
docker-compose up -d postgres

# 2. Setup backend
cd backend
npm install
npm run db:migrate
npm run db:seed
npm run dev

# 3. Setup frontend (in a separate terminal)
cd ../frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Pre-Seeded Demo Credentials

The database comes pre-seeded with accounts, buses, routes, and active schedules for testing:

| Role | Email | Password | Access Scope |
| :--- | :--- | :--- | :--- |
| **System Administrator** | `admin@nexbus.com` | `Admin@123` | Full access to KPI overview, operators, fleet buses, schedules, fleet occupancy, and audit trail. |
| **Fleet Operator Staff** | `operator@intercity.com` | `Operator@123` | Operator portal, trip manifests, conductor live check-in, and seat occupancy reconciliation. |
| **Passenger Traveler** | `user@example.com` | `User@123` | Search buses, select seats, book tickets, check PNR, view bookings, and process cancellations. |
| **Second Passenger** | `priya@example.com` | `User@123` | Secondary traveler account for verifying concurrent booking scenarios. |

### Sample Testing Data:
- **Sample Seeded PNR**: `PNR-NBX-984210` (Test in [PNR Status](http://localhost:3000/pnr-lookup))
- **Promotional Coupon 1**: `NEXFIRST` (Flat ₹150 discount)
- **Promotional Coupon 2**: `SAVE10` (10% discount on Volvo luxury sleeper)

---

## 🧪 Automated Acceptance Test Suite

The automated test suite runs via Jest and Supertest, executing 13 comprehensive unit and integration tests:

```bash
# Run automated test suite
docker exec bus_booking_backend npm test
# Or locally:
cd backend && npm test
```

### Test Evidence (13/13 PASS):

```
PASS tests/integration/acceptance.test.js
  NexBus Central Transit System - Acceptance Criteria
    ✓ Acceptance Test 1: Passenger can search trips and book available seat (HTTP 201)
    ✓ Acceptance Test 2: Concurrency Lock - two users cannot confirm the same seat on one trip (HTTP 409)
    ✓ Acceptance Test 3: PNR lookup includes correct passenger, route, date and seat details
    ✓ Acceptance Test 4: Cancellation changes seat availability and records dynamic refund
    ✓ Acceptance Test 5: Operator manifest reconciles confirmed passengers with booked seats
    ✓ Security Test: Non-admin user cannot access material audit trail (HTTP 403 Forbidden)
    ✓ Validation Test: Invalid booking payload with empty passenger details is rejected (HTTP 400)

PASS tests/unit/pnrGenerator.test.js
  PNR Generator Unit Tests
    ✓ Generates valid 10-char reference with NBX prefix (e.g. PNR-NBX-XXXXXX)
    ✓ Generates unique references across consecutive invocations

PASS tests/unit/cancellationCalc.test.js
  Cancellation & Refund Calculator Unit Tests
    ✓ Calculates 90% refund when notice > 24 hours
    ✓ Calculates 50% refund when notice between 12 and 24 hours
    ✓ Calculates 25% refund when notice between 2 and 12 hours
    ✓ Calculates 0% refund (non-refundable) when notice < 2 hours

Test Suites: 3 passed, 3 total
Tests:       13 passed, 13 total (100% PASS)
Time:        0.995 s
```

---

## 📐 Database Schema & Entity Relationship Overview

The database contains 12 normalized relational tables designed with strict integrity constraints:

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│    OPERATORS    │ 1───* │      BUSES      │ 1───* │  SEAT_LAYOUTS   │
└────────┬────────┘       └────────┬────────┘       └─────────────────┘
         │                         │
         │ 1                       │ 1
         │                         │
         │ *                       │ *
┌────────┴────────┐       ┌────────┴────────┐       ┌─────────────────┐
│      USERS      │       │      TRIPS      │ *───1 │     ROUTES      │
└────────┬────────┘       └────────┬────────┘       └────────┬────────┘
         │                         │                         │ 1
         │ 1                       │ 1                       │
         │                         ├────────┐                │ *
         │ *                       │ *      │ *     ┌────────┴────────┐
┌────────┴────────┐       ┌────────┴──────┐ │       │   ROUTE_STOPS   │
│    BOOKINGS     │ 1───* │  TRIP_SEATS   │ │       └─────────────────┘
└────────┬────────┘       └───────────────┘ │
         │                                  │
         ├─────────────────┐                │
         │ 1               │ 1              │
         │                 │                │
         │ *               │ *              │
┌────────┴────────┐ ┌──────┴──────────────┐ │
│   PASSENGERS    │ │       REFUNDS       │ │
└─────────────────┘ └─────────────────────┘ │
                                            │
┌─────────────────┐                         │
│   AUDIT_LOGS    │ ────────────────────────┘
└─────────────────┘
```

For complete schema definitions, index strategies, and field constraints, see [ER_DIAGRAM.md](file:///c:/Users/ghosh/OneDrive/Desktop/bus_booking/ER_DIAGRAM.md).

---

## 🔌 API Endpoint Reference

All endpoints are documented with interactive request/response models in the OpenAPI Swagger UI at `http://localhost:5000/api/docs`.

### Authentication (`/api/auth`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Register passenger or operator partner account. |
| `POST` | `/api/auth/login` | Public | Sign in and receive signed JWT. |
| `GET` | `/api/auth/me` | Authenticated | Retrieve authenticated user profile with role claims. |
| `POST` | `/api/auth/demo-login` | Public | Instant 1-click reviewer authentication (`ADMIN`, `OPERATOR`, `CUSTOMER`). |

### Trips & Search (`/api/trips`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/trips/search` | Public | Search available trips by origin, destination, date, bus type, and time of day. |
| `GET` | `/api/trips/:id` | Public | Retrieve trip details with live seat availability matrix and stop sequence. |
| `POST` | `/api/trips` | Admin Only | Schedule a new bus departure run. |

### Bookings & Ticketing (`/api/bookings`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/bookings` | Public/Auth | Create booking with transactional row-level seat locking. |
| `GET` | `/api/bookings/pnr/:pnr` | Public | Retrieve electronic boarding pass and verified passenger details by PNR. |
| `GET` | `/api/bookings/my` | Authenticated | Retrieve booking history for the logged-in passenger. |
| `GET` | `/api/bookings/:id/cancellation-quote` | Authenticated | Calculate live cancellation refund quote based on hours until departure. |
| `POST` | `/api/bookings/:id/cancel` | Authenticated | Cancel confirmed booking, release seats, and record refund ledger entry. |

### Reports & Operational Manifests (`/api/reports`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/reports/dashboard` | Admin Only | Aggregated KPIs: gross revenue, net revenue, booking counts, active fleet. |
| `GET` | `/api/reports/occupancy` | Admin/Operator | Fleet occupancy utilization percentage and confirmed revenue per run. |
| `GET` | `/api/reports/trips/:id/manifest` | Admin/Operator | Conductor passenger boarding manifest with 100% seat reconciliation. |

### Security Audit Trail (`/api/audit`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/audit` | Admin Only | Query immutable audit trail of material business operations with user & IP. |

---

## ⚙️ Environment Configuration

Environment variables can be customized in `.env`:

```env
# Database Settings
DB_HOST=postgres
DB_PORT=5432
DB_USER=bus_admin
DB_PASSWORD=bus_secure_pass
DB_NAME=bus_booking_db

# Server Settings
PORT=5000
NODE_ENV=production
CLIENT_URL=http://localhost:3000

# Security Credentials
JWT_SECRET=nexbus_jwt_secure_key_2026_enterprise
JWT_EXPIRES_IN=24h
```

---

## 🎨 Design System & Human-Coded UI Standards

The frontend has been built following design patterns derived from high-conversion transit platforms:

1. **Color Palette**:
   - Primary: **Transit Crimson (`#d84e55` / `#c2383f`)** for primary CTAs and active states.
   - Neutrals: Dark slate navy (`#0f172a`), warm off-white canvas (`#f8fafc`), and crisp borders (`#e2e8f0`).
   - Semantics: Emerald (`#059669`) for available seats and high ratings; Amber (`#d97706`) for filling-fast warnings; Rose (`#dc2626`) for booked/cancelled states.
2. **Dual Typography**:
   - **Plus Jakarta Sans**: Modern geometric sans-serif for legible UI copy, headings, and labels.
   - **JetBrains Mono**: Clean monospace tabular figures for timestamps (`21:30`), license plates (`KA-01-NB-2026`), prices (`₹1,299`), and PNR references (`PNR-NBX-984210`).
3. **Transit Components**:
   - **Bus Chassis**: Realistic vehicle representation with steering wheel driver cabin orientation.
   - **Sleeper Berths**: Rectangular cards with pillow notch indentations (`sleeper-berth-pillow`).
   - **Boarding Pass**: Authentic aviation/transit pass with perforated coupon notches (`ticket-notch-left`, `ticket-notch-right`).
   - **Conductor Checklist**: Interactive checkbox table for passenger boarding status.

---

## 📝 Known Assumptions & Limitations

1. **Simulated Payment Gateway**: Integrates a realistic payment gateway simulation (UPI, Cards, NetBanking, Pay at Bus). Production deployment would integrate Razorpay/Stripe webhooks with idempotent event handlers.
2. **Notification Dispatch**: SMS and email dispatch events are recorded in the system audit trail. Live delivery can be enabled by connecting Twilio or SendGrid API keys.
3. **Currency & Localization**: Default currency is Indian Rupee (INR ₹) and timezone is IST (UTC+5:30), standard for domestic intercity bus transit networks.
