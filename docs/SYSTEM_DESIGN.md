# RentX — System Design

## Current Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT LAYER                           │
│  React (Vite) + React Router + Tailwind CSS + Recharts      │
│  Deployed: Vercel / Netlify / nginx Docker container        │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTPS REST API
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   APPLICATION LAYER                         │
│  Node.js (ESM) + Express 5                                  │
│                                                             │
│  Modules: auth | bookings | vehicles | payments | trust     │
│           reviews | notifications | ai | dashboard          │
│                                                             │
│  Middleware: requestId → CORS → rateLimit → errorHandler    │
│  Background: node-cron (5min expiry job, daily reminders)   │
└──────┬───────────────┬─────────────┬──────────────────────┬─┘
       │               │             │                      │
       ▼               ▼             ▼                      ▼
  MongoDB Atlas    Razorpay     Google Gemini         (Future: Redis)
  Replica Set     Payments      AI API                Cache Layer
  Primary DB      Gateway
```

---

## Data Models

### User
```
_id, name, email, password(hashed), role(CUSTOMER|FLEET_OWNER|ADMIN),
trustScore(0-1000), isSuspended, isVerified, phone, profileImage
```

### Vehicle
```
_id, owner→User, name, brand, model, year, type(9 types),
pricePerDay, securityDeposit, fuelType, transmission, seats, features[],
location, city, latitude, longitude, images[], isAvailable, listingStatus,
rating, reviewCount, rules
```

### Booking
```
_id, user→User, vehicle→Vehicle,
startDate, endDate, rentalDays,
baseAmount, gstAmount, platformFee, securityDeposit, totalAmount,
bookingStatus(11 states), paymentStatus,
expiresAt, cancelledBy, cancellationReason, refundAmount,
timeline[{eventType, actor, note, createdAt}]
```

### Payment
```
_id, booking→Booking, user→User,
razorpayOrderId, razorpayPaymentId,
amount, currency, status(created|paid|failed|refunded),
idempotencyKey, paidAt, refundDetails
```

### Review
```
_id, booking→Booking(unique), vehicle→Vehicle, reviewer→User,
rating(1-5), comment, createdAt
```

### TrustHistory
```
_id, user→User, booking→Booking, actor→User,
previousScore, newScore, delta, eventType, reason, metadata
```

---

## Key Indexes

| Collection | Index | Purpose |
|---|---|---|
| Vehicle | `{type,city,isAvailable,pricePerDay}` | Primary search query |
| Vehicle | `{owner}` | Owner's vehicle list |
| Booking | `{vehicle,startDate,endDate}` | **Overlap check on every booking** |
| Booking | `{vehicle,bookingStatus}` | Filter active bookings |
| Booking | `{user,bookingStatus}` | Customer dashboard |
| Booking | `{bookingStatus,expiresAt}` | Background job: find expired holds |
| Payment | `{idempotencyKey}` sparse | Duplicate order prevention |
| Notification | `{user,isRead,createdAt}` | Unread count + feed |

---

## Booking State Machine

```
PENDING_PAYMENT ──(payment created)──► PAYMENT_PENDING
      │                                       │
      │ (30min no payment)            (verified)
      ▼                                       ▼
   EXPIRED                         PENDING_OWNER_APPROVAL
                                          │        │
                                    (approve)  (reject)
                                       ▼           ▼
                                   CONFIRMED    REJECTED
                                       │
                                  (pickup)
                                       ▼
                                    ACTIVE
                                       │
                                  (returned)
                                       ▼
                                   COMPLETED
                                       │
                                  (review eligible)
```

Cancellation: any state before ACTIVE → CANCELLED (with refund per policy)

---

## Scaling Path

### 10 Users (Today)
- Single Node process, single MongoDB Atlas M0 (free tier)
- All requests handled synchronously
- node-cron for background jobs

### 1,000 Users
- Add compound indexes (already done)
- MongoDB Atlas M10 (dedicated, replica set for transactions)
- `express-rate-limit` with memory store (already done)
- Basic monitoring (UptimeRobot, MongoDB Atlas alerts)

### 10,000 Users
- Redis for:
  - Rate limiting store (shared across instances)
  - Vehicle listing cache (5-min TTL, invalidated on update)
  - Notification unread count cache
- CDN for vehicle images (Cloudinary → CloudFront)
- MongoDB connection pool tuning (`maxPoolSize: 20`)
- Basic APM (Datadog or New Relic)

### 100,000 Users
- **Horizontal scaling**: 3-5 Node instances behind load balancer (stateless JWT = no session affinity needed)
- MongoDB Atlas read replica for search queries
- BullMQ + Redis for async jobs (trust updates, notifications) — currently synchronous in payment webhook
- Structured logging → centralized log aggregation (Datadog, Logtail)
- Auto-scaling based on CPU/memory metrics

### 1,000,000 Users
- **Microservice extraction** (if teams justify it):
  - Booking Service (owns booking state machine + transactions)
  - Payment Service (Razorpay integration + reconciliation)
  - Notification Service (multi-channel: push, email, SMS)
  - Search Service (ElasticSearch for text + geo-proximity)
- **Kafka** for event streaming:
  - `booking.created` → notification worker, analytics
  - `payment.completed` → trust worker, booking worker
  - `review.submitted` → vehicle rating aggregation worker
- **ElasticSearch**: vehicle full-text search + `geo_distance` queries for "near me"
- **MongoDB sharding**: shard on `city` for geographic partitioning
- **Event sourcing**: booking state becomes an append-only event log

---

## Why Not Microservices Now?

| Factor | Current | At Scale |
|---|---|---|
| Team size | 1 developer | Multiple teams |
| Deployment complexity | Single process | Worth the overhead |
| Transaction safety | MongoDB transactions work in-process | Need distributed transactions (2PC) across services |
| Debugging | Single log stream | Distributed tracing required |
| Verdict | **Modular monolith** | Extract services when a single module's scale or team warrants it |

---

## Caching Strategy

```
Request → Check Redis Cache
     ↓ (miss)
  MongoDB Query
     ↓
 Store in Redis (TTL)
     ↓
 Return response
```

**Cache these:**
- Vehicle listings (5-min TTL) — read-heavy, writes rare
- Vehicle detail pages (10-min TTL) — invalidate on update
- User notification unread count (30-second TTL)

**Never cache:**
- Booking availability — must be real-time (MongoDB is authoritative)
- Payment status — must be authoritative
- User trust score — updated by events, must be current

**Redis is not the source of truth** for any business logic. MongoDB always wins.

---

## Payment Architecture

```
Frontend                 Backend                  Razorpay
────────                 ───────                  ────────
createBooking ────────► createBookingService
                        (MongoDB transaction)
                              │
                              ▼
                         PENDING_PAYMENT
                              │
POST /create-order ────────► calculateSecureAmount
                              createRazorpayOrder ─────────► Razorpay
                              persistPaymentRecord ◄─────────  orderId
                              │
                         return orderId ────────────────────► Frontend
                              │
          Frontend invokes Razorpay SDK with orderId
                              │
POST /verify ──────────────► verifyHMAC(orderId|paymentId, SECRET)
                              │ (MongoDB transaction)
                         markPaymentPaid
                         updateBooking(pending_owner_approval)
                         appendTimeline($push, not $set)
                         COMMIT ─────────────────────────────► 200 OK
                              │
                         Webhook (backup)
POST /webhook ◄──────────────────────────────────────────── Razorpay
(idempotent handler)
```

---

## Background Jobs

| Job | Schedule | Action |
|---|---|---|
| Expire stale holds | Every 5 minutes | `PENDING_PAYMENT` bookings > 30min old → `EXPIRED`. Releases vehicle for other bookings. |
| Pickup reminders | Daily 8:00 AM | Notify customers with `CONFIRMED` bookings starting tomorrow |
| Return reminders | Daily 8:00 AM | Notify customers with `ACTIVE` bookings ending tomorrow |

**Multi-instance consideration**: If running 3 Node instances, all 3 cron jobs fire simultaneously. Solution: add a Redis-based distributed lock. One instance acquires the lock, runs the job, releases. Others skip.

---

## AI Architecture

**Principle: AI is assistive, never authoritative.**

```
User types: "automatic SUV under ₹2000 in Delhi"
                    │
                    ▼
         POST /api/ai/discover
                    │
         Gemini extracts structured filters:
         { type: "suv", city: "Delhi", maxPrice: 2000, transmission: "automatic" }
                    │
         Backend applies REAL MongoDB filter:
         Vehicle.find({ type: "suv", city: /Delhi/i, pricePerDay: { $lte: 2000 }, transmission: "automatic" })
                    │
         Return real vehicles from database
                    │
         AI explains what it understood
```

AI never: decides availability, computes amounts, verifies payments, authorizes anything.
AI calls have: 10-second timeout, graceful fallback on failure.
