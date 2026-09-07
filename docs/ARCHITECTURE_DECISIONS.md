# RentX — Architecture Decision Records

Each ADR documents a significant design choice: context, options considered, decision, rationale, and tradeoffs.

---

## ADR-001: MongoDB over PostgreSQL

**Context**: RentX stores vehicle listings, bookings, payments, users, and trust history.

**Problem**: Vehicle listings are heterogeneous — a car has `seats`, `transmission`, `fuelType`; a bike has none. Forcing this into a relational schema would require nullable columns or a generic `attributes` table with EAV anti-pattern.

**Options considered**:
1. PostgreSQL with nullable columns
2. PostgreSQL with JSONB for vehicle attributes
3. MongoDB

**Decision**: MongoDB.

**Rationale**:
- Document model maps naturally to vehicle schema — each document carries only relevant fields
- MongoDB Atlas runs as a **replica set**, enabling multi-document transactions (critical for booking correctness)
- Aggregation pipeline handles analytics (revenue by day, booking status counts) without ORM complexity
- Mongoose provides schema validation at the application layer

**Tradeoffs**:
- No JOIN — use `populate()` (two queries). Acceptable for our access patterns.
- Eventual consistency on reads (configurable) — we use `w: majority` writes for durability
- Migrations require application-level handling (no ALTER TABLE)

---

## ADR-002: Modular Monolith over Microservices

**Context**: The application has distinct domains: auth, bookings, vehicles, payments, trust, reviews, notifications, AI.

**Problem**: Should each domain be a separate service?

**Options considered**:
1. Full microservices (one service per domain)
2. Modular monolith (all domains in one process, isolated by module)
3. Monolith (no isolation)

**Decision**: Modular monolith.

**Rationale**:
- Single developer team — microservices multiply operational burden (CI/CD, networking, distributed tracing)
- Booking creation requires reading Vehicle and writing Booking atomically — with microservices, this becomes a distributed transaction (2PC or saga pattern), significantly more complex
- The module boundary (Route → Controller → Service → Repository) provides enough isolation that extracting a service later is feasible without rewriting business logic
- Deployment is a single Docker container

**Tradeoffs**:
- Scales as a unit — can't scale booking service independently of vehicle service
- A bug in any module affects the whole process
- When team size grows or a module's load profile diverges significantly, extract to separate service

**Upgrade path**: Booking service → separate Node.js process + BullMQ for async communication. MongoDB transactions replaced by saga pattern (compensating transactions).

---

## ADR-003: MongoDB Transactions for Booking Concurrency

**Context**: Booking creation must be safe under concurrent requests for the same vehicle and dates.

**Problem**: The naive implementation (check for conflicts, then insert) has a **TOCTOU race condition** — two simultaneous requests can both pass the conflict check before either inserts.

**Options considered**:
1. Naive check-then-insert (what was there before)
2. MongoDB `findOneAndUpdate` with an atomic upsert condition
3. Pessimistic locking (findOneAndUpdate with `$set: { lockedAt }`)
4. Optimistic locking (version field, retry on conflict)
5. **MongoDB multi-document transactions** ← chosen

**Decision**: MongoDB multi-document transactions.

**Rationale**:
- MongoDB Atlas is a replica set — transactions are available natively
- The conflict check (READ) and booking insert (WRITE) are wrapped in a single session transaction
- Serializable isolation: two concurrent transactions on the same vehicle will serialize — one sees the other's write
- Simple to implement: `session.startTransaction()`, `findOne(...).session(session)`, `create([...], { session })`, `session.commitTransaction()`
- Explainable in a 2-minute interview

**Tradeoffs**:
- ~2-5ms additional latency per booking creation
- Requires replica set (Atlas provides this; local dev needs `mongod --replSet`)
- Session management requires careful try/catch/finally

**Why not optimistic locking**: Would require a retry loop at the application layer, adds complexity for a write-heavy-conflict-rare operation. Transactions are simpler and provably correct.

---

## ADR-004: Idempotency Keys for Payment Orders

**Context**: Network calls can fail after the server has processed the request. A client retrying `POST /api/payments/create-order` without idempotency protection would create duplicate Razorpay orders.

**Problem**: How do we make payment order creation safe to retry?

**Options considered**:
1. Allow duplicates (naive)
2. Deduplicate by `bookingId` (only one order per booking)
3. Client-generated `x-idempotency-key` (UUID per payment attempt)

**Decision**: Client-generated idempotency key (`x-idempotency-key` header), checked against a sparse index on the Payment collection.

**Rationale**:
- Matches industry standard (Stripe, Razorpay, Braintree all use this pattern)
- Client generates a UUID before each payment attempt. On retry, the same key is sent.
- Server checks: `Payment.findOne({ idempotencyKey })`. If found, return cached result.
- Sparse index means only documents with an `idempotencyKey` field are indexed (storage efficient)

**Tradeoffs**:
- Client must generate and persist the UUID for the duration of the payment flow
- If the client generates a new UUID on retry, deduplication fails (client responsibility)

---

## ADR-005: JWT over Sessions for Authentication

**Context**: Authentication state must be maintained across requests.

**Decision**: JWT with 7-day expiry.

**Rationale**:
- Stateless — no server-side session store needed
- Horizontal scaling: any Node instance can verify any JWT (same `JWT_SECRET`)
- Self-contained: `userId` and `role` decoded from token without a database round-trip
- 7-day expiry balances security and UX

**Tradeoffs**:
- Cannot revoke a token mid-expiry without a blocklist (Redis). If a user is suspended, they can still use an active JWT until it expires.
- Mitigated: `protect` middleware calls `User.findById` and checks `isSuspended`, adding one DB read per request

**Alternative**: Sessions with Redis store would allow instant revocation but require Redis and session affinity or shared session store.

---

## ADR-006: Rule-Based Trust Engine (Not ML)

**Context**: We need to assess renter trustworthiness and inform booking decisions.

**Problem**: Should trust scoring use machine learning?

**Options considered**:
1. ML model (classification/regression on booking history)
2. **Rule-based strategy map** ← chosen
3. Manual admin review only

**Decision**: Explicit, deterministic rule-based system using a strategy map.

**Rationale**:
- Explainability: every score change has a documented reason ("Booking cancelled, -10"). Regulators, customers, and interviewers can understand it.
- Debuggability: if a score is wrong, replay `TrustHistory` to trace every event
- No training data required — ML needs historical data we don't have yet
- Correctness: no false positives from model drift
- Future-proof: the `EventStrategies` map is a **strategy pattern** — an ML model can replace the scoring function by implementing the same interface, without changing any callers

**Do NOT call this ML** — it's rule-based. Honesty about the implementation is itself an engineering virtue.

**Tradeoffs**:
- Rules don't capture complex patterns (e.g., seasonal fraud spikes)
- Rules require manual tuning as the platform grows
- ML is the right upgrade path once sufficient labeled data is collected

---

## ADR-007: AI as Assistive, Not Authoritative

**Context**: The Gemini AI API can generate text and reason about natural language.

**Problem**: How much decision-making power should AI have?

**Decision**: AI is assistive only. It never controls: payment correctness, booking availability, authorization, money calculation, final security decisions.

**Rationale**:
- AI can hallucinate — it cannot be trusted for factual correctness in business-critical contexts
- If AI decides availability, a bug could allow double-booking or deny valid bookings
- The value of AI in this product is UX and content, not business logic
- Keeps the application auditable and debuggable

**AI's permitted role**:
- Extract structured filters from natural language (intent extraction)
- Generate marketing copy (listing descriptions)
- Explain recommendations in human language (reasoning display)

**AI's prohibited role**:
- Check availability (MongoDB does this)
- Calculate amounts (deterministic formula does this)
- Verify payments (HMAC does this)
- Authorize actions (RBAC does this)

---

## ADR-008: node-cron over BullMQ/Redis Queue

**Context**: Background jobs are needed: expire stale booking holds, send pickup/return reminders.

**Problem**: How should background jobs be implemented?

**Options considered**:
1. `node-cron` in-process
2. BullMQ + Redis
3. Dedicated worker process

**Decision**: node-cron in-process.

**Rationale**:
- Simple: no additional infrastructure, no Redis, no worker deployment
- Jobs are lightweight: a single MongoDB query + updateMany
- At single-instance deployment, in-process cron is sufficient and reliable
- Job failures logged; next cron execution retries

**Tradeoffs**:
- Multi-instance problem: if 3 Node instances run, each fires the cron job. They all try to expire the same bookings. Mitigated by `updateMany` being idempotent (already-expired bookings don't re-expire). But causes redundant DB load.
- **Fix when needed**: add a Redis distributed lock. One instance acquires the lock, runs the job, releases. Upgrade to BullMQ if jobs become long-running or need guaranteed delivery.

---

## ADR-009: Centralized Error Handling

**Context**: Error handling was scattered — each controller manually set status codes and response shapes. Validation errors might return 400, 500, or nothing at all depending on where they were caught.

**Decision**: Custom error class hierarchy + global Express error handler middleware.

**Structure**:
```
AppError (base)
├── ValidationError (400)
├── AuthenticationError (401)
├── AuthorizationError (403)
├── NotFoundError (404)
├── ConflictError (409)
├── PaymentError (402)
├── ExternalServiceError (502)
└── RateLimitError (429)
```

**Rationale**:
- Services throw typed errors (`throw new ConflictError("Vehicle already booked")`)
- Global handler maps to correct HTTP status — no guessing at controller level
- Consistent response shape: `{ success: false, error: { code, message, requestId } }`
- Stack traces never exposed in production
- Mongoose, JWT, duplicate key errors handled generically

**Tradeoffs**: Services must know which error type to throw (small coupling). Better than inconsistent status codes.

---

## ADR-010: Server-Side Vehicle Search

**Context**: The original implementation fetched ALL vehicles from MongoDB and filtered them in React.

**Problem**: This fails at scale — 1,000 vehicles means 1,000 documents downloaded per page load. Filtering UX is broken (no pagination, no URL-shareable filters).

**Decision**: Server-side search with dynamic MongoDB query building.

**Implementation**:
```js
// Controller receives: ?type=suv&city=Delhi&maxPrice=2000&sortBy=rating&page=2
// Service builds:
const filter = { listingStatus: "active" };
if (type) filter.type = type;
if (city) filter.city = { $regex: city, $options: "i" };
if (maxPrice) filter.pricePerDay = { $lte: maxPrice };
// ... etc
const [vehicles, total] = await Promise.all([
  Vehicle.find(filter).sort(sort).skip(skip).limit(limit),
  Vehicle.countDocuments(filter),
]);
```

**Benefits**:
- Only matching documents transferred over the network
- Pagination: `skip/limit` with total count
- URL params = shareable, bookmarkable search state
- Uses compound index `{type, city, isAvailable, pricePerDay}` efficiently

**Tradeoffs**:
- Each filter change is a new HTTP request (mitigated by 300ms debounce)
- `$regex` on city is not fully index-optimized for prefix matches. Fix: use Atlas Search or exact city enum.
