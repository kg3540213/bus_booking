# Algions Bus Booking Management System
**Advanced Individual Project Assessment | Full-Stack Web Development**  
**Company:** Algions AI Labs Private Limited  

A database-backed enterprise bus booking platform with working end-to-end customer and operational staff journeys, ACID seat concurrency locking, dynamic cancellation refunds, and reconciled passenger manifests.

---

## 🌟 Key Features & Capabilities

- **Operator & Fleet Setup**: Complete management of operators, multi-deck luxury sleeper & seater coaches, seat layout templates, routes, boarding/dropping stops, trip schedules, and fares.
- **Trip Search**: Fast search across origins, destinations, and travel dates with filters for bus types (AC Sleeper, AC Seater), time of day (morning, afternoon, evening, night), price ranges, and sorting.
- **Interactive Seat Selection**: Visual dual-deck layout showing lower deck, upper deck, ladies quota, window seats, and real-time availability.
- **Pessimistic Concurrency Locking**: Protects critical actions using PostgreSQL `SELECT ... FOR UPDATE` row locks to guarantee that two simultaneous booking requests for the same seat can never result in duplicate confirmed tickets (HTTP 409 Conflict).
- **Dynamic Cancellation & Refunds**: Configurable multi-tier cancellation rules based on departure time remaining; automatically releases seats into live inventory and records processed refunds.
- **Operator Passenger Manifest & Reporting**: Live boarding pass verification, printable manifest sheets for conductors, and mathematical reconciliation between booked seats and passenger manifests.
- **Server-Side RBAC & Audit Trail**: Role-based access control (`ADMIN`, `OPERATOR`, `CUSTOMER`) enforced at the server level, along with an immutable audit log of material business actions.
- **OpenAPI 3.0 / Swagger UI**: Interactive API documentation served live at `/api/docs`.

---

## 🚀 Quick Start Guide

### Option 1: Run with Docker Compose (Recommended - Zero Dependencies)

Make sure Docker Desktop is running on your machine:

```bash
# 1. Clone the repository and enter the directory
cd bus_booking

# 2. Build and launch Postgres, Backend API, and Frontend SPA
docker-compose up --build
```

- **Frontend Application:** [http://localhost:3000](http://localhost:3000)
- **Backend API:** [http://localhost:5000](http://localhost:5000)
- **Interactive Swagger Documentation:** [http://localhost:5000/api/docs](http://localhost:5000/api/docs)
- **API Health Check:** [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

### Option 2: Local Run (Node.js + PostgreSQL)

If running PostgreSQL locally or via container:

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
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your web browser.

---

## 🔑 Demo Reviewer Credentials

The platform includes a **1-Click Reviewer Role Switcher** in the top navigation bar, or you can sign in manually with these pre-seeded demo accounts:

| Role | Email | Password | Access Scope |
|:---|:---|:---|:---|
| **System Admin** | `admin@algions.com` | `Admin@123` | Full administrative control: operators, buses, routes, schedules, all manifests, and immutable audit logs. |
| **Operator Staff** | `operator@intercity.com` | `Operator@123` | Assigned operator portal: trip schedules, real-time passenger manifests, conductor check-in, and occupancy reconciliation. |
| **Customer Passenger** | `user@example.com` | `User@123` | Passenger journey: search buses, select seats, book tickets, download boarding pass, and cancel tickets with refund calculator. |

---

## 🧪 Automated Acceptance Test Suite

The test suite validates all 5 acceptance criteria specified in the Algions brief, including concurrency edge cases:

```bash
# Run automated unit and integration tests
cd backend
npm test
```

### Test Evidence Summary:
- **Acceptance Test 1**: Passenger searches for valid trip between Bangalore and Hyderabad and books an available seat. (`PASS`)
- **Acceptance Test 2**: Two concurrent users attempt to confirm the exact same seat simultaneously via `Promise.all`. Exactly one succeeds (HTTP 201) and the second is rejected with HTTP 409 Conflict. (`PASS`)
- **Acceptance Test 3**: PNR lookup verifies passenger name, route, travel date, and seat number. (`PASS`)
- **Acceptance Test 4**: Cancellation of booking triggers dynamic refund calculation, records refund ledger entry, and verifies the seat status in `trip_seats` reverts to `AVAILABLE`. (`PASS`)
- **Acceptance Test 5**: Operator passenger manifest reconciles confirmed passenger count with booked seat count, and occupancy summary matches tickets. (`PASS`)
- **Security Test**: Customer account attempting to read Admin-only audit logs receives HTTP 403 Forbidden. (`PASS`)

---

## 📐 Database Schema & Architecture

See [ER_DIAGRAM.md](file:///c:/Users/ghosh/OneDrive/Desktop/bus_booking/ER_DIAGRAM.md) and [TECHNICAL_REPORT.md](file:///c:/Users/ghosh/OneDrive/Desktop/bus_booking/TECHNICAL_REPORT.md) for full schema descriptions, Mermaid diagrams, and architectural analysis.

---

## ⚙️ Environment Variables

Copy `.env.example` to `.env` if customizing connection settings:

| Variable | Default Value | Description |
|:---|:---|:---|
| `DB_HOST` | `localhost` (or `postgres` in Docker) | PostgreSQL host address |
| `DB_PORT` | `5432` | PostgreSQL port |
| `DB_USER` | `bus_admin` | Database username |
| `DB_PASSWORD` | `bus_secure_pass` | Database password |
| `DB_NAME` | `bus_booking_db` | Database name |
| `PORT` | `5000` | Backend API port |
| `JWT_SECRET` | `super_secret_jwt_key_algions_bus_2026` | Secret key for signing authentication tokens |
| `CLIENT_URL` | `http://localhost:3000` | Client origin allowed by CORS middleware |

---

## 📝 Known Assumptions & Limitations

1. **Payment Gateway**: Integrates a realistic mock payment gateway simulation (UPI, Cards, NetBanking). Production deployment would integrate razorpay/stripe webhooks with idempotent event handlers.
2. **SMS/Email Notifications**: Notification events are recorded in the audit trail. Integration with Twilio/SendGrid can be enabled via standard webhook triggers.
3. **Multi-Currency**: Default currency is Indian Rupee (INR ₹), standard for domestic intercity bus transit.

