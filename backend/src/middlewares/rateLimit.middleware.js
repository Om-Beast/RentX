/**
 * Rate limiting middleware configurations.
 *
 * Uses express-rate-limit (memory store — appropriate for a single-process
 * portfolio app; for multi-instance deployments, swap to a Redis store).
 *
 * Design intent:
 * - Protect auth endpoints from brute-force attacks
 * - Protect payment endpoints from accidental/intentional flooding
 * - Protect AI endpoints (they cost money per call)
 * - Keep general browsing unrestricted — don't punish normal users
 *
 * Each limiter is exported separately so routes can pick the right one.
 */

import rateLimit from "express-rate-limit";

// In test environment, all rate limiters are passthrough (no-op).
// This prevents 429 errors in integration tests while keeping full
// rate limiting in production and development.
const isTest = process.env.NODE_ENV === "test";
const passthrough = (_req, _res, next) => next();

const createLimiter = (options) => isTest ? passthrough : rateLimit({

    standardHeaders: true,   // Return rate limit info in RateLimit-* headers
    legacyHeaders: false,    // Disable X-RateLimit-* headers
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        error: {
          code: "RATE_LIMIT_EXCEEDED",
          message: options.message || "Too many requests. Please try again later.",
          requestId: req.requestId,
        },
      });
    },
    ...options,
  });

/**
 * Login: 5 attempts per 15 minutes per IP.
 * Prevents brute-force password attacks.
 */
export const loginLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Too many login attempts. Please try again in 15 minutes.",
});

/**
 * Registration: 3 accounts per hour per IP.
 * Prevents spam account creation.
 */
export const registerLimiter = createLimiter({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: "Too many registration attempts. Please try again in an hour.",
});

/**
 * Booking creation: 10 requests per hour per IP.
 * Prevents booking flooding.
 */
export const bookingLimiter = createLimiter({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: "Too many booking requests. Please slow down.",
});

/**
 * Payment endpoints: 10 requests per 15 minutes per IP.
 * Protects against payment flooding.
 */
export const paymentLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Too many payment requests. Please slow down.",
});

/**
 * AI endpoints: 20 requests per hour per IP.
 * Each AI call costs money — protect against abuse.
 */
export const aiLimiter = createLimiter({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: "AI request limit reached. Please try again in an hour.",
});

/**
 * General API: 200 requests per 15 minutes per IP.
 * A loose limit for all other routes — catches bots, not real users.
 */
export const generalLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: "Too many requests. Please slow down.",
});
