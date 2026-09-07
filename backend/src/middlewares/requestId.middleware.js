/**
 * Request ID middleware.
 *
 * Attaches a unique requestId to every incoming request.
 * If the client sends X-Request-ID header, we use that (useful for
 * frontend correlation). Otherwise generate a new one.
 *
 * This ID flows through every log entry, making it possible to trace
 * a single request across all log lines in production.
 */

import { randomUUID } from "crypto";

const requestId = (req, res, next) => {
  const id = req.headers["x-request-id"] || randomUUID();
  req.requestId = id;
  res.setHeader("X-Request-ID", id);
  next();
};

export default requestId;
