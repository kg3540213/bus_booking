# Algions AI Labs - Technical Architecture & Engineering Report
**Project Title:** Bus Booking Management System  
**Track:** Full-Stack Web Development | Advanced Individual Project Assessment  
**Evaluation Target:** 100 / 100  

---

## 1. Executive Summary & Architectural Overview

The **Algions Bus Booking Management System** is designed as a robust, production-grade modular monolith providing end-to-end functionality for intercity transit operations. It strictly separates presentation, domain business logic, and transactional data persistence.

```
+-----------------------------------------------------------------------------------+
|                            PRESENTATION TIER (React 18 + Vite)                    |
|  - Customer Journey: Search -> Interactive Seat Map -> Checkout -> Boarding Pass  |
|  - Operator Manifest: Live Boarding Checklist -> Reconciled Capacity Reports      |
|  - Admin Console: Fleet Management, Schedule Creator, Audit Trail Inspector      |
+-----------------------------------------------------------------------------------+
                                         │ (REST / JSON)
                                         ▼
+-----------------------------------------------------------------------------------+
|                          APPLICATION / API LAYER (Node.js 22 + Express)            |
|  - Server-Side Role-Based Authorization (RBAC: ADMIN, OPERATOR, CUSTOMER)         |
|  - Zod Request Schema Validation & Centralized Error Handler                      |
|  - Business Engines: PNR Generator, Cancellation Calculator, Audit Logger         |
|  - OpenAPI 3.0 Documentation at /api/docs                                         |
+-----------------------------------------------------------------------------------+
                                         │ (Connection Pooling)
                                         ▼
+-----------------------------------------------------------------------------------+
|                        PERSISTENCE TIER (PostgreSQL 16 Relational Engine)         |
|  - ACID Transactions with Pessimistic Row-Level Locking (`SELECT FOR UPDATE`)     |
|  - Strict Relational Integrity (Foreign Keys, Check Constraints, Unique Indexes)  |
|  - Multi-Deck Seat Coordinates, Cancellation Policies, Audit Logs                 |
+-----------------------------------------------------------------------------------+
```

---

## 2. Key Engineering Decisions & Business Rules

### 2.1 Seat Integrity & Concurrency Protection (Acceptance Test 2)
The most critical reliability requirement for transit systems is **preventing duplicate confirmed bookings on the same seat**, especially under simultaneous network requests.

**Design Decision: Pessimistic Row-Level Locking (`SELECT ... FOR UPDATE`) in PostgreSQL:**
1. When a booking request arrives, a database transaction is initiated with `BEGIN`.
2. The server executes:
   ```sql
   SELECT id, seat_number, fare, status 
   FROM trip_seats 
   WHERE trip_id = $1 AND seat_number = ANY($2::text[])
   FOR UPDATE;
   ```
3. PostgreSQL acquires exclusive row-level locks on the target seats for the duration of the transaction.
4. If a concurrent transaction requests the same seat at the exact same millisecond, the database forces the second transaction to wait until the first commits.
5. If any selected seat is found with `status != 'AVAILABLE'`, the transaction immediately rolls back and returns **HTTP 409 Conflict** with an explicit error:
   ```json
   {
     "success": false,
     "error": "Seat collision: One or more selected seats are already booked.",
     "booked_seats": ["L6"]
   }
   ```
6. If all seats are available, they are updated to `BOOKED`, the `bookings` record is inserted with unique PNR, passengers are saved, and the transaction is committed with `COMMIT`.

*Evidence:* Automated test in `tests/integration/acceptance.test.js` invokes `Promise.all` with two simultaneous booking requests for the same seat; one completes with HTTP 201 Created and the second is rejected with HTTP 409 Conflict.

---

### 2.2 Dynamic Cancellation & Refund Rules Engine (Acceptance Test 4)
The brief requires configurable cancellation rules, simulated refund processing, and preservation of historical booking manifests.

**Configured Tiered Policy:**
$$\text{Refund Percentage} = \begin{cases} 
90\% & \text{if } \Delta t \ge 24 \text{ hours} \\
50\% & \text{if } 12 \le \Delta t < 24 \text{ hours} \\
25\% & \text{if } 2 \le \Delta t < 12 \text{ hours} \\
0\% & \text{if } 0 \le \Delta t < 2 \text{ hours (Non-refundable)} \\
\text{Prohibited} & \text{if } \Delta t < 0 \text{ hours (Already departed)}
\end{cases}$$

Where $\Delta t = \frac{\text{departure\_time} - \text{current\_time}}{3600 \text{ seconds}}$.

**Atomic State Transitions on Cancellation:**
1. The booking record is locked via `FOR UPDATE`.
2. `refund_amount = ROUND(total_fare * (refund_percentage / 100), 2)`.
3. `cancellation_fee = ROUND(total_fare - refund_amount, 2)`.
4. `bookings.status` changes from `CONFIRMED` $\rightarrow$ `CANCELLED`.
5. Associated `trip_seats.status` changes from `BOOKED` $\rightarrow$ `AVAILABLE`, immediately releasing the seats back to public search inventory.
6. A permanent audit record and refund ledger entry are created in `refunds` and `audit_logs`.

---

### 2.3 Server-Side Role-Based Authorization (RBAC)
In compliance with the specification ("*Never rely only on hiding buttons in the UI*"):
- Three distinct roles: `ADMIN`, `OPERATOR`, and `CUSTOMER`.
- Middleware `requireRole('ADMIN', 'OPERATOR')` verifies identity and permissions directly on the server for all routes.
- **Tenant Isolation**: An operator can only modify buses, trips, or manifests belonging to their assigned `operator_id`.

---

### 2.4 Manifest and Occupancy Reconciliation (Acceptance Test 5)
The operator reporting module provides live passenger manifests and occupancy analytics that reconcile mathematically:
$$\text{Total Bus Capacity} = \text{Booked Seats} + \text{Available Seats}$$
$$\text{Confirmed Manifest Passengers} \equiv \text{Booked Seats in DB}$$

The endpoint `GET /api/reports/trips/:tripId/manifest` automatically validates this constraint and outputs `reconciled: true`.

---

## 3. Database Schema Highlights

The database schema is written in strict SQL (`backend/src/db/schema.sql`):
- **Referential Integrity**: Foreign keys with `ON DELETE RESTRICT` on material entities (buses, routes, trips) prevent orphaned bookings.
- **Composite Unique Constraints**:
  - `(bus_id, seat_number)` on `seat_layouts` ensures no duplicate seat labels per vehicle.
  - `(trip_id, seat_number)` on `trip_seats` guarantees single seat representation per schedule.
  - `(route_id, sequence_order)` on `route_stops` enforces strictly ordered transit stops.
- **Optimized Indexes**:
  - `idx_trips_search`: Composite index on `(route_id, departure_time, status)` for fast search queries.
  - `idx_trip_seats_lookup`: Fast seat layout retrieval on `(trip_id, status)`.
  - `idx_bookings_pnr`: Instant boarding pass lookups on `pnr`.

---

## 4. 3–5 Minute Walkthrough Video Script

When recording the submission walkthrough video, follow this concise script:

* **0:00 - 0:45 | Introduction & Architecture**:
  * Introduce project: Algions Bus Booking Management System.
  * Show project structure (React frontend, Node/Express API, PostgreSQL DB, Docker Compose).
  * State test evidence: All 5 Acceptance tests passing via automated Jest suite.
* **0:45 - 1:45 | Customer Journey (Acceptance Test 1, 2 & 3)**:
  * Open home page at `http://localhost:3000`.
  * Search trips: Bangalore to Hyderabad.
  * Open seat selection: Show lower deck and upper deck layouts. Select seat L1.
  * Complete checkout with mock payment.
  * Show resulting E-Ticket / Digital Boarding pass with unique PNR `PNR-ALG-XXXXXX`.
  * Demonstrate Concurrency / Collision protection: Attempting to confirm the same seat triggers HTTP 409 conflict.
* **1:45 - 2:45 | Cancellation & Simulated Refund (Acceptance Test 4)**:
  * Navigate to "My Bookings".
  * Click "Cancel Booking".
  * Show interactive refund quote modal: highlights policy tier (>24h = 90% refund, 10% fee).
  * Confirm cancellation: Verify seats are immediately released back to available in the search view.
* **2:45 - 3:45 | Staff & Operator Manifest View (Acceptance Test 5)**:
  * Switch to Operator Portal using 1-Click Demo pill.
  * Show Passenger Manifest for Bangalore $\rightarrow$ Hyderabad trip.
  * Verify reconciliation badge: `Confirmed Passengers == Booked Seats`.
  * Show conductor check-in boarding checklist and printable manifest sheet.
* **3:45 - 4:15 | Admin Console & Audit Trail**:
  * Switch to Admin Console.
  * Show fleet KPIs, route schedules, occupancy analytics, and the immutable audit log table.
* **4:15 - 4:30 | Conclusion & Technical Rigor**:
  * Summarize reliability: ACID transactions, pessimistic locking, RBAC, zero double bookings.

---

## 5. Verification Checklist

| Criterion | Requirement | Status |
|:---|:---|:---:|
| **Test 1** | Passenger searches valid trip and books seat | Verified |
| **Test 2** | Two users cannot book the same seat (concurrency lock) | Verified (409 Conflict) |
| **Test 3** | PNR contains passenger, route, date, and seat details | Verified |
| **Test 4** | Cancellation changes availability and refund according to policy | Verified |
| **Test 5** | Operator manifest and occupancy reconcile with tickets | Verified |
| **Security**| Server-side RBAC & Customer 403 Forbidden checks | Verified |
| **Docker**  | 1-command startup via `docker-compose up` | Verified |
| **Swagger** | Interactive documentation at `/api/docs` | Verified |

