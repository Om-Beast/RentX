# RentX System Design

## Architecture Overview

`
Browser (Vercel CDN)
    |  HTTPS + Bearer JWT
    v
Express API (Render)
    |
    +-- /api/auth          JWT auth, bcrypt passwords
    +-- /api/vehicles      CRUD + Cloudinary image upload
    +-- /api/bookings      Booking engine (MongoDB transactions)
    +-- /api/payments      Razorpay + HMAC + idempotency
    +-- /api/admin         Admin RBAC (router.use protect+authorize)
    +-- /api/ai            Bounded AI (NL search, listing assistant)
    +-- /api/dashboard     Owner analytics (aggregation pipelines)
    +-- /api/reviews       Post-rental reviews (unique per booking)
    +-- /api/notifications Persistent in-app notifications
    |
    +-- MongoDB Atlas (replica set)
    +-- Cloudinary (image CDN)
    +-- Razorpay (payment gateway)
    +-- Google Gemini (AI provider)
`

## Booking State Machine

`
PENDING_PAYMENT -> PAYMENT_PENDING -> CONFIRMED -> ACTIVE -> COMPLETED
                                   -> REJECTED
PENDING_PAYMENT -> EXPIRED (after 30 min hold, via background job)
PENDING_PAYMENT -> CANCELLED (customer cancels before payment)
CONFIRMED      -> CANCELLED (customer cancels, refund tiers apply)
CONFIRMED      -> PAYMENT_FAILED
CONFIRMED      -> REFUND_PENDING -> REFUNDED
`

## Concurrency Design

Problem: TOCTOU race between overlap check and insert.
Solution: MongoDB transaction wraps both operations.

Two concurrent requests:
- Session A: startTransaction -> findOne(overlap) -> none -> create -> commit
- Session B: startTransaction -> findOne(overlap) -> finds A's record -> throw ConflictError -> abort

Result: exactly one booking created, one 409 returned.

## Payment Idempotency

idempotencyKey = SHA256(userId + bookingId + timestamp-truncated-to-minute)
Stored in Payment.idempotencyKey (unique sparse index).
On retry: if key exists, return stored response instead of re-processing.

## Trust Engine Algorithm

`
score = clamp(currentScore + delta, 0, 1000)

Positive signals:
  RENTAL_COMPLETED        +50
  REVIEW_RECEIVED         +10
  LONG_TENURE             +5/month

Negative signals:
  BOOKING_CANCELLED      -20
  PAYMENT_FAILED         -40
  LISTING_DEACTIVATED    -30
`

All events stored in TrustHistory with reason codes for auditability.

## AI Boundary Contract

Natural language search:
  Input:  "automatic EV under 2500/day near Delhi"
  AI out: { type:"ev", transmission:"automatic", maxPrice:2500, city:"Delhi" }
  Action: real MongoDB query with extracted filters
  
  AI cannot invent vehicles. AI cannot approve bookings. AI cannot set prices.

Listing assistant:
  Input:  vehicle specs object
  AI out: marketing description text
  Action: stored as draft, owner must approve before listing goes live

Recommendation explanation:
  Input:  trip parameters + vehicle list (deterministically selected by backend)
  AI out: human-readable explanation per vehicle
  Fallback: generic description if AI fails

## Database Schema Summary

User: name, email, password(bcrypt), role, trustScore(0-1000), isSuspended, isVerified
Vehicle: owner, name, brand, model, year, type, pricePerDay, city, images[], listingStatus, rating, reviewCount
Booking: user, vehicle, startDate, endDate, bookingStatus, totalAmount, paymentStatus, expiresAt, timeline[]
Payment: booking, user, razorpayOrderId, razorpayPaymentId, amount, status, idempotencyKey
Review: booking, reviewer, vehicle, rating, comment (unique per booking)
Notification: user, type, message, isRead, relatedBooking
TrustHistory: user, event, delta, score, reason
