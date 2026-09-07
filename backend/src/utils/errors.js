/**
 * Centralized application error hierarchy.
 *
 * All business-logic errors must be thrown as one of these typed errors.
 * The global errorHandler middleware maps them to the correct HTTP status
 * and consistent response shape without any guessing at the controller level.
 *
 * Pattern: throw new NotFoundError("Booking not found") from any service.
 * Result:  { success: false, error: { code: "NOT_FOUND", message: "...", requestId: "..." } }
 */

export class AppError extends Error {
  constructor(message, code, statusCode = 500) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = true; // distinguishes from unexpected bugs
    Error.captureStackTrace(this, this.constructor);
  }
}

/** 400 — Request payload failed validation */
export class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, "VALIDATION_ERROR", 400);
    this.details = details;
  }
}

/** 401 — Missing or invalid authentication token */
export class AuthenticationError extends AppError {
  constructor(message = "Authentication required") {
    super(message, "AUTHENTICATION_ERROR", 401);
  }
}

/** 403 — Authenticated but not permitted to perform this action */
export class AuthorizationError extends AppError {
  constructor(message = "You are not authorized to perform this action") {
    super(message, "AUTHORIZATION_ERROR", 403);
  }
}

/** 404 — Resource does not exist */
export class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super(message, "NOT_FOUND", 404);
  }
}

/** 409 — Conflicting state (e.g. vehicle already booked for those dates) */
export class ConflictError extends AppError {
  constructor(message, conflictCode = "CONFLICT") {
    super(message, conflictCode, 409);
  }
}

/** 402 — Payment-related failure */
export class PaymentError extends AppError {
  constructor(message, paymentCode = "PAYMENT_ERROR") {
    super(message, paymentCode, 402);
  }
}

/** 502 — Downstream/external service failed (Razorpay, Gemini, etc.) */
export class ExternalServiceError extends AppError {
  constructor(message = "External service unavailable", service = "UNKNOWN") {
    super(message, "EXTERNAL_SERVICE_ERROR", 502);
    this.service = service;
  }
}

/** 429 — Too many requests */
export class RateLimitError extends AppError {
  constructor(message = "Too many requests. Please try again later.") {
    super(message, "RATE_LIMIT_EXCEEDED", 429);
  }
}
