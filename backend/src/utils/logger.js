/**
 * Structured logger for RentX backend.
 *
 * Replaces all console.log debugging with intentional, leveled logging.
 *
 * Rules:
 * - NEVER log: passwords, JWTs, API keys, Razorpay secrets, MongoDB URIs
 * - Always attach requestId when available
 * - Use correct log levels: error > warn > info > debug
 * - In production, output JSON for log aggregation (e.g., Datadog, Logtail)
 * - In development, output readable colored text
 *
 * Usage:
 *   import logger from '../../utils/logger.js';
 *   logger.info('BookingService', 'BOOKING_CREATED', { bookingId, userId });
 *   logger.error('PaymentService', 'PAYMENT_FAILED', { orderId }, error);
 */

const isDev = process.env.NODE_ENV !== "production";

function formatEntry(level, module, event, data = {}, error = null) {
  const entry = {
    level,
    timestamp: new Date().toISOString(),
    module,
    event,
    ...data,
  };

  if (error) {
    entry.errorMessage = error.message;
    if (isDev) {
      entry.stack = error.stack;
    }
  }

  return entry;
}

function output(level, entry) {
  if (isDev) {
    const colors = {
      error: "\x1b[31m",
      warn: "\x1b[33m",
      info: "\x1b[36m",
      debug: "\x1b[90m",
    };
    const reset = "\x1b[0m";
    const color = colors[level] || reset;
    const prefix = `${color}[${level.toUpperCase()}]${reset} [${entry.timestamp}] [${entry.module}] ${entry.event}`;
    const extras = { ...entry };
    delete extras.level;
    delete extras.timestamp;
    delete extras.module;
    delete extras.event;
    const extraStr = Object.keys(extras).length
      ? " " + JSON.stringify(extras)
      : "";
    console[level === "error" ? "error" : level === "warn" ? "warn" : "log"](
      prefix + extraStr
    );
  } else {
    // Production: structured JSON for log aggregators
    console.log(JSON.stringify(entry));
  }
}

const logger = {
  /**
   * @param {string} module - e.g. "BookingService"
   * @param {string} event  - e.g. "BOOKING_CREATED"
   * @param {object} data   - safe contextual data (NO secrets)
   */
  info(module, event, data = {}) {
    output("info", formatEntry("info", module, event, data));
  },

  warn(module, event, data = {}) {
    output("warn", formatEntry("warn", module, event, data));
  },

  error(module, event, data = {}, error = null) {
    output("error", formatEntry("error", module, event, data, error));
  },

  debug(module, event, data = {}) {
    if (isDev) {
      output("debug", formatEntry("debug", module, event, data));
    }
  },

  /**
   * Convenience: attach requestId to all subsequent log calls in a request context.
   * Usage: const reqLogger = logger.withRequest(req.requestId);
   *        reqLogger.info('BookingService', 'BOOKING_CREATED', { bookingId });
   */
  withRequest(requestId) {
    return {
      info: (module, event, data = {}) =>
        logger.info(module, event, { requestId, ...data }),
      warn: (module, event, data = {}) =>
        logger.warn(module, event, { requestId, ...data }),
      error: (module, event, data = {}, err = null) =>
        logger.error(module, event, { requestId, ...data }, err),
      debug: (module, event, data = {}) =>
        logger.debug(module, event, { requestId, ...data }),
    };
  },
};

export default logger;
