/**
 * server.js — Production entry point.
 * Connects to DB, starts HTTP server, starts background jobs.
 * Tests do NOT import this file — they import app.js directly.
 */
import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "./config/db.js";
import app from "./app.js";
import logger from "./utils/logger.js";
import { startJobs, stopJobs } from "./jobs/index.js";

// 1. Connect to database (exits with code 1 on failure)
await connectDB();

// 2. Start HTTP server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  logger.info("Server", "SERVER_STARTED", { port: PORT, env: process.env.NODE_ENV || "development" });
  // 3. Start background jobs after server is ready
  startJobs();
});

// ─── Graceful Shutdown ────────────────────────────────────────────────────────
const shutdown = async (signal) => {
  logger.info("Server", "SHUTDOWN_INITIATED", { signal });

  server.close(async () => {
    logger.info("Server", "HTTP_SERVER_CLOSED");
    try {
      stopJobs();
      await mongoose.connection.close();
      logger.info("Server", "MONGODB_DISCONNECTED");
    } catch (err) {
      logger.error("Server", "SHUTDOWN_ERROR", { error: err.message });
    } finally {
      process.exit(0);
    }
  });

  // Force exit after 10 seconds if graceful shutdown stalls
  setTimeout(() => {
    logger.error("Server", "FORCED_EXIT", { reason: "Graceful shutdown timed out" });
    process.exit(1);
  }, 10_000);
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

process.on("uncaughtException", (err) => {
  logger.error("Server", "UNCAUGHT_EXCEPTION", { error: err.message, stack: err.stack });
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  logger.error("Server", "UNHANDLED_REJECTION", { reason: String(reason) });
  process.exit(1);
});

export default app;