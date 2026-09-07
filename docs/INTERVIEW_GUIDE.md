# RentX Interview Guide

30+ prepared questions with beginner-friendly and technical answers.
Use this to prepare for system design and engineering interviews.

---

## Q1. What is RentX? *(30 seconds)*

**Simple:** RentX is an online marketplace where customers can rent vehicles (cars, bikes, SUVs) from verified fleet owners, similar to how Airbnb lets people rent homes from hosts.

**Technical:** RentX is a full-stack vehicle rental platform built with the MERN stack. It handles multi-role authentication (Customer, Fleet Owner, Admin), vehicle discovery with server-side search, a concurrency-safe booking engine, Razorpay payment processing with HMAC verification, a rule-based trust scoring system, and AI-powered discovery via the Gemini API.

---

## Q2. Walk me through the overall architecture.

**Simple:** There's a website (frontend) that talks to a backend API, which stores data in a database and calls external services like Razorpay for payments.

**Technical:**
```
React (Vite) → Express REST API → MongoDB Atlas
                               → Razorpay (payments)
                               → Google Gemini (AI)
              node-cron → MongoDB (background jobs)
```
Modular monolith on the backend: `Route → Controller → Service → Repository → MongoDB`. Each domain (auth, bookings, vehicles, payments, trust, reviews, AI, notifications) is an isolated module. No microservices — single deployment unit, simpler ops, appropriate for this team size and load.

---

## Q3. Walk me through a complete customer booking and payment flow.

**Simple:** Customer searches, picks a vehicle, selects dates, pays with a card, owner approves, then the customer picks up the car.

**Technical:**
1. `GET /api/vehicles?type=suv&city=Delhi` → server-side MongoDB query with compound index `{type, city, isAvailable, pricePerDay}`
2. `POST /api/bookings` → service starts a MongoDB transaction, checks for date overlap inside the transaction (atomic), creates booking with status `pending_payment` and 30-minute expiry
3. `POST /api/payments/create-order` → backend calculates authoritative amount from `vehicle.pricePerDay × days + 18% GST + ₹99 platform fee + deposit`. Creates Razorpay order. Never trusts frontend amount.
4. Frontend invokes Razorpay SDK with `orderId`
5. `POST /api/payments/verify` → backend verifies `HMAC(order_id|payment_id, RAZORPAY_KEY_SECRET)`. Inside a MongoDB transaction: marks payment as `paid`, transitions booking to `pending_owner_approval`
6. Owner receives notification, approves via dashboard → booking → `confirmed`
7. Background job or webhook handles edge cases (payment captured event from Razorpay)

---

## Q4. Why MongoDB over PostgreSQL?

**Simple:** MongoDB lets us store vehicle listings with flexible features (some cars have GPS, some don't) without changing the table schema every time we add a feature.

**Technical:**
- Vehicle schema is heterogeneous — different vehicle types have different attributes. MongoDB's document model handles this without nullable columns.
- MongoDB Atlas runs as a replica set, which enables multi-document **transactions** — critical for our booking race condition fix.
- Aggregation pipelines handle analytics (revenue by day, booking status breakdown) without an ORM layer.
- Horizontal sharding is native if ever needed.
- Tradeoff: no JOIN — we use `populate()` which is two queries, not a SQL JOIN. Acceptable at this scale.

---

## Q5. Why Node.js and Express?

**Simple:** Node is fast for I/O-heavy apps (like ours — mostly database reads/writes) and JavaScript on both frontend and backend is easier to maintain.

**Technical:** Node's event-loop handles concurrent connections with non-blocking I/O — ideal for a REST API that waits on database queries and external services. Express 5 has improved async error handling. ESM modules. The whole team speaks JS, so context-switching is minimal.

---

## Q6. Why a modular monolith, not microservices?

**Simple:** Microservices are like separate departments — great for a large company, but for a small team they add unnecessary overhead: network calls between services, distributed tracing, separate deployments.

**Technical:** At current scale and team size:
- Single deployment unit = simpler CI/CD, no inter-service networking
- MongoDB transactions work within a single process — if Booking and Payment were separate services, a distributed transaction (2PC) would be needed
- Each module (bookings, payments, trust) is already isolated with its own service/repository, so extracting to microservices later is possible without rewriting business logic
- We'd add Kafka between booking and notification service once notification volume justifies it

---

## Q7. How does JWT authentication work?

**Simple:** When you log in, the server gives you a special pass (JWT). You show this pass with every request. The server checks the pass is genuine without asking the database.

**Technical:** Login → `bcrypt.compare(password, hash)` → `jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' })`. Client stores token in `localStorage`. Every protected request includes `Authorization: Bearer <token>`. `protect` middleware calls `jwt.verify(token, JWT_SECRET)` — this is cryptographic, no DB lookup needed. Only on success does it do `User.findById(decoded.userId)` to get the full user object (to check `isSuspended`).

---

## Q8. How does RBAC work?

**Simple:** Different users have different permissions — like a junior employee, senior employee, and manager having access to different things.

**Technical:** Three roles: `CUSTOMER`, `FLEET_OWNER`, `ADMIN`. `authorize(...roles)` middleware runs after `protect` and checks `req.user.role` against the allowed roles. Examples:
- `POST /api/bookings` → `authorize("CUSTOMER")` only
- `PATCH /api/bookings/:id/confirm` → `authorize("FLEET_OWNER", "ADMIN")`
- `GET /api/dashboard/stats` → `authorize("FLEET_OWNER", "ADMIN")`

---

## Q9. Explain the double booking race condition and how you fixed it. *(This is your flagship question)*

**Simple (analogy):** Imagine two people buying the last concert ticket simultaneously on two browser tabs. Both see "1 ticket available", both click Buy. Without protection, both get a confirmation — but only one ticket exists. You need a way to make "check + buy" happen as a single uninterruptible step.

**Technical — the bug:**
```
// WRONG — not atomic
const conflict = await Booking.findOne({ vehicle, dates overlap })  // READ
if (!conflict) {
  await Booking.create({ ... })  // WRITE — but another request could have inserted between these two!
}
```
This is a **TOCTOU (Time of Check / Time of Use) race condition**. Between the `findOne` and the `create`, another concurrent request can pass the same `findOne` check. Both requests then insert, creating two conflicting bookings.

**Technical — the fix:**
```js
const session = await mongoose.startSession();
session.startTransaction();
try {
  // Both READ and WRITE inside the same transaction — serialized
  const conflict = await Booking.findOne({ vehicle, dates overlap }).session(session);
  if (conflict) { await session.abortTransaction(); throw new ConflictError(...); }
  await Booking.create([{ ... }], { session });
  await session.commitTransaction();
} catch (e) {
  await session.abortTransaction();
  throw e;
}
```
MongoDB Atlas is a **replica set**, so multi-document transactions are available. Two transactions attempting to create conflicting bookings will serialize — one sees the other's write and fails the overlap check. This is the simplest correct solution. No pessimistic locks, no queues, no external coordination.

---

## Q10. What exactly is a TOCTOU race condition?

**Simple:** TOCTOU = Time of Check / Time of Use. You check a condition, then some time passes (even microseconds), then you act on it. But the condition may have changed in that gap.

**Technical:** A class of concurrency bugs where a non-atomic read-then-write sequence allows concurrent writers to interleave. Classic example: bank balance check then debit. Fix: make the check and the action atomic — via transactions, compare-and-swap, or optimistic locking with a retry loop.

---

## Q11. Why not optimistic locking instead of transactions?

**Simple:** Optimistic locking is like trying to book a seat and then at the last second finding someone already took it — you'd have to retry. Transactions are like physically sitting in the seat to reserve it while you complete the booking.

**Technical:** Optimistic locking would add a `version` field to Vehicle and use `findOneAndUpdate` with version check. On conflict, the application retries. This adds retry logic complexity and can starve under high contention. Transactions provide serializable isolation with a single code path — simpler to reason about and test. For booking creation (a write-heavy, conflict-rare operation), transactions add only ~2-5ms latency.

---

## Q12. What is idempotency and why does it matter for payments?

**Simple:** Idempotent means "doing it twice has the same effect as doing it once." Like pressing an elevator button — pressing it 10 times doesn't summon 10 elevators.

**Technical:** Network calls can fail after the server has already processed the request. Without idempotency, a client retrying `POST /api/payments/create-order` would create duplicate Razorpay orders. We fix this with an `x-idempotency-key` header: before creating an order, we check if a `Payment` record with that key exists. If yes, we return the cached result. Same key = same outcome, always. The key is a UUID generated client-side per payment attempt.

---

## Q13. What if payment succeeds but the frontend crashes before receiving the response?

**Simple:** The payment is captured on Razorpay's side, but the frontend never knew. Without a safety net, the customer paid but the booking stays "unpaid."

**Technical:** This is exactly why Razorpay sends **webhooks** — server-to-server HTTP calls notifying us of every payment event. Even if the user's browser crashes, Razorpay calls `POST /api/payments/webhook` with `payment.captured`. Our webhook handler processes this event and transitions the booking to `pending_owner_approval`. The webhook handler is **idempotent** — if the booking is already in `pending_owner_approval`, it's a no-op.

---

## Q14. What if the Razorpay webhook arrives twice?

**Simple:** Payment systems retry webhooks if they don't get a 200 OK. We might receive the same event twice.

**Technical:** Before processing any webhook event, we check the payment's current status:
```js
const payment = await PaymentRepository.findByOrderId(orderId);
if (payment.status === 'paid') return; // Already processed — idempotent, skip
```
This makes every webhook handler safe to call multiple times. We always return HTTP 200 to Razorpay (even on duplicates) so they stop retrying.

---

## Q15. How does the refund flow work?

**Simple:** When a booking is cancelled, we calculate how much the customer gets back based on how early they cancelled, then tell Razorpay to send the money.

**Technical:** Cancellation Policy (in `cancellation.service.js`):
- 48h+ before pickup → 100% of base + GST + deposit (platform fee forfeited)
- 24–48h before pickup → 50% of base + GST + deposit
- < 24h before pickup → deposit only
- Owner/Admin cancel → 100% refund always

`determineRefund()` computes the amount. Booking transitions to `refund_pending`. A background process (or manual trigger in test mode) calls `razorpay.payments.refund(paymentId, { amount })`. Razorpay confirms via `refund.processed` webhook → booking transitions to `refunded`.

---

## Q16. What MongoDB indexes did you create and why?

**Technical:**

**Vehicle indexes:**
```js
{ type: 1, city: 1, isAvailable: 1, pricePerDay: 1 }  // Primary search query
{ owner: 1 }                                            // Owner's vehicle list
{ rating: -1 }                                          // Top-rated sort
```

**Booking indexes:**
```js
{ vehicle: 1, startDate: 1, endDate: 1 }  // Overlap check — every booking creation
{ vehicle: 1, bookingStatus: 1 }          // Filter active bookings per vehicle
{ user: 1, bookingStatus: 1 }             // Customer dashboard
{ bookingStatus: 1, expiresAt: 1 }        // Background job: find expired holds
```

**Payment:** Sparse index on `idempotencyKey` (sparse because not all payments have this key).

Without the compound index on `{vehicle, startDate, endDate}`, every booking creation does a full collection scan — O(n) instead of O(log n).

---

## Q17. What would you cache with Redis and why?

**Simple:** Cache the vehicle listing page — it changes rarely but is fetched thousands of times. Don't cache booking data — it must always be fresh.

**Technical:** 
- **Cache**: vehicle search results (5-minute TTL), vehicle detail pages (10-minute TTL, invalidated on update), notification unread counts
- **Don't cache**: booking availability (must be real-time), payment status, user auth sessions (JWT is stateless)
- **Why Redis as store**: in-memory, sub-millisecond reads, built-in TTL
- **Critical constraint**: Redis is never the **source of truth** for booking correctness. If Redis says "available" but MongoDB says "booked", MongoDB wins. Redis only serves as a read-through cache.

---

## Q18. Why can't Redis be the source of truth for bookings?

**Simple:** Redis doesn't have the same safety guarantees as MongoDB. If Redis crashes or loses data, you'd have incorrect booking state.

**Technical:** Redis is an in-memory store — data can be lost on restart (without AOF/RDB persistence). It doesn't support multi-document transactions with the same isolation guarantees as MongoDB. Booking correctness requires durability (`w: majority` in MongoDB) and atomicity. Redis can hold a cached view of availability for display, but the authoritative check must happen inside a MongoDB transaction.

---

## Q19. How does the Trust/Risk Engine work?

**Simple:** Every user has a score (0–1000). Good actions (completing a booking, paying on time) increase it. Bad actions (late returns, payment failures) decrease it. The score affects whether new bookings are auto-approved or flagged.

**Technical:** Event-driven, rule-based strategy map:
```js
BOOKING_COMPLETED  → +15
PAYMENT_FAILED     → -20
LATE_RETURN        → -30 per hour
IDENTITY_VERIFIED  → +50
DAMAGE_REPORTED (SEVERE) → -400
```
After each score change, a `RiskEngine` classifies: VERY_LOW / LOW / MEDIUM / HIGH / CRITICAL. A `TierEngine` assigns a tier: BRONZE → SILVER → GOLD → PLATINUM. A `RecommendationEngine` outputs: APPROVE / MANUAL_REVIEW / INCREASE_DEPOSIT / REJECT.

All history is stored in `TrustHistory` — append-only audit log. The `recalculate()` function can replay all events from scratch to recompute the score.

**Not ML** — the rules are deterministic. The `EventStrategies` map is a **strategy pattern** — an ML model could replace the scoring function without changing any caller.

---

## Q20. Why is AI not allowed to make booking or payment decisions?

**Simple:** AI can be wrong. If AI decides whether a payment is valid, a bug in the AI could let fraudulent payments through or block legitimate ones. Safety-critical decisions must be deterministic.

**Technical:** AI in RentX is **assistive, not authoritative**:
- AI extracts search filters from natural language → backend applies real MongoDB filters → backend enforces real availability
- AI generates listing description text → owner reviews it → owner publishes
- AI explains a recommendation → user makes the decision
- AI never: decides availability, calculates amounts, verifies payments, authorizes actions

This is the correct boundary: AI adds value in UX and content generation. Business logic remains deterministic, auditable, and correct.

---

## Q21. How do you prevent IDOR (Insecure Direct Object Reference)?

**Simple:** IDOR means "I know your booking ID, so I can cancel it." We check that the person making the request actually owns the resource.

**Technical:**
- Booking cancel: `booking.user.toString() === req.user._id.toString()` OR `booking.vehicle.owner === req.user._id` OR `req.user.role === 'ADMIN'`
- Vehicle update: explicit field **allowlist** — `req.body.owner` is ignored even if sent
- Payment: `booking.user.toString() !== userId.toString()` → 403 before any payment processing
- The `requireOwnership()` helper is a reusable function that throws `AuthorizationError` consistently

---

## Q22. How would you scale to 100K+ vehicles?

**Technical:**
1. **Indexes already in place** — compound index on `{type, city, isAvailable, pricePerDay}` handles the primary search query at 100K+ documents
2. **Read replicas** — add MongoDB Atlas read replica; route search queries to replica
3. **Caching** — Redis cache for vehicle listings with 5-minute TTL
4. **Horizontal scaling** — run multiple Node instances behind a load balancer (stateless JWT means no session affinity needed)
5. **CDN** — vehicle images served via CDN, not from app servers
6. **If 1M vehicles**: ElasticSearch for full-text search + geo-proximity queries, while MongoDB remains authoritative for booking data

---

## Q23. Where would a message queue (Kafka/BullMQ) fit?

**Simple:** Queues handle work that doesn't need to happen instantly and shouldn't slow down the main request — like sending emails or updating a trust score.

**Technical:** Current synchronous flows that would benefit from a queue at scale:
- After `payment.verified` → trust score update, notification — currently synchronous (fire-and-forget with try/catch). Under load, these slow down the payment response.
- Extract to: `POST /api/payments/verify` → publish `payment.verified` event → `NotificationWorker` consumes → `TrustWorker` consumes

**Kafka** for high-throughput, multi-consumer event streaming. **BullMQ** for simpler job queuing with Redis. We don't add these now — `node-cron` + try/catch is sufficient at current scale.

---

## Q24. What would you monitor in production?

**Technical:**
- **Error rate**: `5xx` responses per minute — alert if > 1%
- **Latency p99**: booking creation should be < 500ms including transaction
- **Payment failure rate**: alert if payment verification failures spike
- **Background job health**: cron job completion + hold-expiry count
- **MongoDB**: connection pool saturation, slow queries (any query > 100ms)
- **Trust engine**: anomalous score drops (potential abuse)
- **Structured logs**: every log has `requestId`, `module`, `event` — searchable in Datadog/Logtail

---

## Q25. How would you debug a failed booking in production?

**Technical:**
1. Get `requestId` from the error response
2. Search logs: `requestId = "abc-123"` → see every log line for that request
3. Check: did `BOOKING_CREATED` log fire? Did the transaction commit?
4. Check: is there a `BOOKING_CONFLICT` log? Was the vehicle already booked?
5. Check Payment: is there a payment record with that `bookingId`?
6. Check Timeline: `booking.timeline` array shows every state transition with actor and timestamp

---

## Q26. What was the hardest engineering problem in this project?

**Answer:** The booking race condition. The naive implementation (check then insert) looks correct in single-threaded testing but fails under concurrent load — and it's invisible until it causes a real double-booking in production.

The fix required understanding that the only truly safe solution is making the read and write atomic. MongoDB transactions on Atlas provided this without adding any external infrastructure. The hardest part was correctly managing session lifecycle — starting, committing, and aborting without leaving orphaned sessions.

---

## Q27. What tradeoffs did you consciously make?

1. **Monolith over microservices** → simpler now, more ops work if we ever need to split
2. **MongoDB transactions for booking** → adds ~3ms latency, worth it for correctness
3. **In-memory rate limiting** → doesn't work across multiple instances, would need Redis store in multi-instance deployment
4. **node-cron over BullMQ** → simpler, but cron jobs run on every instance if horizontally scaled (need distributed lock)
5. **JWT over sessions** → stateless (great for horizontal scaling), but can't revoke tokens mid-expiry
6. **Rule-based trust over ML** → explainable and debuggable now; ML is a future upgrade path

---

## Q28. What would you improve if you had 2 more weeks?

1. **Distributed rate limiting** — move to Redis-backed store for correctness across instances
2. **Real image upload** — Cloudinary with MIME validation and size limits (currently URL-based)
3. **Socket.io real-time notifications** — currently using polling; Socket.io is already installed
4. **Booking dispute system** — admin mediation flow between customer and owner
5. **Analytics dashboard** — more granular owner revenue breakdown

---

## Q29. What would you change for 1 million users?

**Technical:**
1. Split booking and payment into separate services (independent scaling)
2. Kafka between services for `payment.completed → trust_update`, `booking.created → notification`
3. ElasticSearch for vehicle full-text search + geo proximity
4. MongoDB read replicas for search queries
5. Redis cluster for caching + session store
6. CDN for all static assets and vehicle images
7. Horizontal scaling behind load balancer (already stateless)
8. Event sourcing for booking state (replace timeline array with proper event store)

---

## Q30. Why did you choose Razorpay?

**Simple:** Razorpay is the standard payment gateway for Indian businesses — like Stripe but built for India, with UPI/IMPS/NetBanking support.

**Technical:** Razorpay provides: test mode with real API behavior, webhook infrastructure for server-side confirmation, HMAC-based signature verification for payment authenticity, and a well-documented Node.js SDK. The order-create → frontend-redirect → verify flow matches industry standard payment integration patterns (similar to Stripe's PaymentIntent flow).
