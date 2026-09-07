/**
 * Global error handler middleware.
 *
 * Must be registered LAST in the Express middleware chain (after all routes).
 * Catches every error thrown in routes, controllers, and services.
 *
 * Guarantees a consistent error response shape:
 * {
 *   "success": false,
 *   "error": {
 *     "code": "BOOKING_CONFLICT",
 *     "message": "Vehicle already booked for selected dates",
 *     "requestId": "abc-123"
 *   }
 * }
 *
 * Stack traces are NEVER exposed in production.
 */

import { AppError } from "../utils/errors.js";
import logger from "../utils/logger.js";

const errorHandler = (err, req, res, _next) => {
  const requestId = req.requestId || "unknown";

  // Operational errors — thrown intentionally from services
  if (err instanceof AppError) {
    logger.warn("ErrorHandler", "OPERATIONAL_ERROR", {
      requestId,
      code: err.code,
      statusCode: err.statusCode,
      message: err.message,
      path: req.path,
      method: req.method,
    });

    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        requestId,
        ...(err.details && { details: err.details }),
      },
    });
  }

  // Mongoose validation errors
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e) => e.message);
    logger.warn("ErrorHandler", "MONGOOSE_VALIDATION_ERROR", {
      requestId,
      messages,
    });
    return res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: messages.join("; "),
        requestId,
      },
    });
  }

  // Mongoose cast errors (invalid ObjectId etc.)
  if (err.name === "CastError") {
    return res.status(400).json({
      success: false,
      error: {
        code: "INVALID_ID",
        message: `Invalid value for field '${err.path}'`,
        requestId,
      },
    });
  }

  // MongoDB duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || "field";
    return res.status(409).json({
      success: false,
      error: {
        code: "DUPLICATE_KEY",
        message: `A record with this ${field} already exists`,
        requestId,
      },
    });
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      error: {
        code: "INVALID_TOKEN",
        message: "Invalid authentication token",
        requestId,
      },
    });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      error: {
        code: "TOKEN_EXPIRED",
        message: "Authentication token has expired",
        requestId,
      },
    });
  }

  // Unexpected/programmer errors — log with full details server-side only
  logger.error(
    "ErrorHandler",
    "UNEXPECTED_ERROR",
    {
      requestId,
      path: req.path,
      method: req.method,
      name: err.name,
    },
    err
  );

  // Never expose internals in production
  const message =
    process.env.NODE_ENV === "production"
      ? "An unexpected error occurred. Please try again later."
      : err.message;

  return res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_ERROR",
      message,
      requestId,
    },
  });
};

export default errorHandler;
