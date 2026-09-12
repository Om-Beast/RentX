# RentX — Interview Guide

All answers reflect **actually implemented and tested** functionality.

---

## 30-Second Answer

"RentX is a two-sided vehicle rental marketplace. I focused on three things most MERN projects get wrong: booking correctness under concurrency using MongoDB transactions, payment safety with server-authoritative pricing and idempotent Razorpay integration, and a trust engine that scores every account. The product has a real admin console, Cloudinary image pipeline, AI natural language search, and 63 integration tests."

---

## 2-Minute Answer

"RentX is a peer-to-peer vehicle rental marketplace with three roles: customers, fleet owners, and admins.

The most important engineering problem was booking concurrency. A naive check-then-insert has a TOCTOU race where two concurrent requests both pass the availability check and both insert — double booking. I solved this by wrapping the overlap check and insert in a MongoDB transaction. Two concurrent transactions serialise — exactly one commits, the other gets a 409 conflict.

For payments, I use Razorpay with server-authoritative pricing — amount computed server-side only. After payment, HMAC signature is verified. The system is idempotent via a unique idempotency key so retried requests don't create duplicate payments.

The trust engine is deterministic rule-based scoring (0-1000). Completed rentals increase trust, cancellations and failed payments decrease it. It is not ML — I do not claim it is.

Cloudinary handles vehicle images with MIME validation, size limits, and ownership checks before upload. AI features are bounded: natural language search extracts filters and runs a real MongoDB query — AI cannot invent inventory.

63 integration tests cover auth, concurrency, IDOR, admin RBAC, cancellation, and trust scoring."

---

## Key Design Decisions

### Booking Concurrency
- MongoDB transaction wraps overlap check + insert
- Two concurrent transactions serialise — exactly one commits
- Requires replica set (Atlas always is one)
- Overlap query: startDate < newEnd AND endDate > newStart for same vehicle
- Test: sequential overlap (409) + partial overlap (409) both verified

### Payment Safety
1. Booking created (pending_payment)
2. Amount computed SERVER-SIDE — frontend cannot send price
3. Razorpay order created, idempotencyKey stored
4. User pays via Razorpay gateway
5. HMAC signature verified on backend (razorpay_order_id|razorpay_payment_id)
6. Booking status -> confirmed
7. Webhook catches browser-crash recovery case (idempotent handler)

### Authorization — Three Layers
1. protect() — validates JWT, attaches req.user
2. authorize(...roles) — checks req.user.role  
3. Resource ownership check in controller (vehicle.owner !== req.user._id)

### Trust Engine
- Deterministic, 0-1000, default 500
- Events: completed_rental (+50), cancelled (-20), failed_payment (-40)
- Architecture supports ML model replacement without API change
- Do NOT call it ML in interviews

### AI Boundary
- Natural language search: Gemini extracts filters, backend runs real query
- AI CANNOT invent inventory
- Listing assistant: specs -> copy -> owner approves
- AI timeout/error -> graceful fallback, marketplace unaffected

### Cloudinary Pipeline
- multer-storage-cloudinary streams memory -> CDN (no local disk)
- Ownership check BEFORE multer processes files
- MIME validation + extension validation + 5MB limit + 10 files max
- Graceful degradation when CLOUDINARY_* env vars not set

---

## Things NOT To Claim

- "ML trust scoring" — it is deterministic rules
- "Real-time notifications" — persistent DB records, not websockets
- "Millions of users" — portfolio project
- "Distributed transactions" — single MongoDB replica set
- "Event sourcing" — timeline array on Booking, not event sourcing
- "Zero downtime deploys" — standard Render deployment
- "Sub-millisecond latency" — no performance benchmarks

---

## Database Index Rationale

| Index | Purpose |
|-------|---------|
| { type, city, isAvailable, pricePerDay } on Vehicle | Covers primary browse/search query |
| { vehicle, startDate, endDate } on Booking | Overlap detection for concurrency fix |
| { user, bookingStatus } on Booking | "My bookings" with status filter |
| { email } unique on User | Login + duplicate prevention |
| { idempotencyKey } unique sparse on Payment | Payment retry deduplication |
| { rating: -1 } on Vehicle | Featured vehicles sort |

---

## Scaling Discussion (Honest)

If load grew 10x:
1. MongoDB Atlas dedicated cluster
2. Redis cache for vehicle search results (TTL 60s)
3. BullMQ for background jobs (reliability vs cron)
4. Read replicas for analytics queries
5. CDN already in place (Cloudinary)

Would NOT add: Kafka, Kubernetes, microservices, Elasticsearch — no engineering problem requires them at this scale.
