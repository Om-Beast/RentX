/**
 * app.js — Pure Express application (no DB connection, no server listen).
 *
 * This separation allows tests to import the app without triggering
 * connectDB() or process.exit(). Tests handle their own DB connection.
 *
 * Imported by: server.js (production) and tests (test environment).
 */
import express from "express";
import cors from "cors";
import mongoose from "mongoose";

import requestId from "./middlewares/requestId.middleware.js";
import errorHandler from "./middlewares/errorHandler.middleware.js";
import { generalLimiter } from "./middlewares/rateLimit.middleware.js";

import authRoutes from "./modules/auth/auth.routes.js";
import vehicleRoutes from "./modules/vehicles/vehicle.routes.js";
import bookingRoutes from "./modules/bookings/booking.routes.js";
import dashboardRoutes from "./modules/dashboard/dashboard.routes.js";
import paymentRoutes from "./modules/payment/payment.routes.js";
import notificationRoutes from "./modules/notifications/notification.routes.js";
import aiRoutes from "./modules/ai/ai.routes.js";
import reviewRoutes from "./modules/reviews/review.routes.js";

const app = express();

// ─── Core Middleware ──────────────────────────────────────────────────────────
app.use(requestId);

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-idempotency-key", "x-request-id"],
    credentials: true,
  })
);

// Webhook route MUST use raw body BEFORE express.json() strips it
app.use("/api/payments/webhook", express.raw({ type: "application/json" }));

app.use(express.json({ limit: "10mb" }));

// General rate limiter
app.use("/api", generalLimiter);

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get("/health", (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatus = dbState === 1 ? "connected" : dbState === 2 ? "connecting" : "disconnected";
  res.status(dbStatus === "connected" ? 200 : 503).json({
    status: dbStatus === "connected" ? "ok" : "degraded",
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    database: dbStatus,
    environment: process.env.NODE_ENV || "development",
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/reviews", reviewRoutes);

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: { code: "NOT_FOUND", message: `Route ${req.method} ${req.path} not found`, requestId: req.requestId },
  });
});

// ─── Global Error Handler (must be last) ─────────────────────────────────────
app.use(errorHandler);

export default app;
