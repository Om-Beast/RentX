/**
 * server.js — Entry point for production.
 * Connects to DB, starts HTTP server, starts background jobs.
 * Tests do NOT import this file — they import app.js directly.
 */
import "dotenv/config";
import connectDB from "./config/db.js";
import app from "./app.js";
import logger from "./utils/logger.js";
import { startJobs } from "./jobs/index.js";

// 1. Connect to database (exits with code 1 on failure)
await connectDB();

// 2. Start HTTP server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  logger.info("Server", "SERVER_STARTED", { port: PORT, env: process.env.NODE_ENV || "development" });
  // 3. Start background jobs after server is ready
  startJobs();
});

export default app;