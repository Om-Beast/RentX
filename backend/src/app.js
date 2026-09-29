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
import adminRoutes from "./modules/admin/admin.routes.js";

const app = express();

// ─── Trust Proxy ──────────────────────────────────────────────────────────────
// Render.com sits behind a load balancer that adds X-Forwarded-For headers.
// Without trust proxy, express-rate-limit sees the proxy IP for every request
// and throws ERR_ERL_UNEXPECTED_X_FORWARDED_FOR. Setting "1" trusts only the
// first proxy hop (Render's load balancer), not arbitrary client-supplied headers.
app.set("trust proxy", 1);

// ─── CORS ─────────────────────────────────────────────────────────────────────
// Function-based origin supports multiple origins without wildcards (required
// for credentials: true). Supports Vercel production, local dev, and env override.
const ALLOWED_ORIGINS = new Set([
  "http://localhost:5173",
  "http://localhost:3000",
  "https://rent-x-sd4b.vercel.app",
]);
if (process.env.FRONTEND_URL) {
  ALLOWED_ORIGINS.add(process.env.FRONTEND_URL);
}

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, Postman, server-to-server)
      if (!origin) return callback(null, true);
      if (ALLOWED_ORIGINS.has(origin)) return callback(null, true);
      // In non-production, allow any localhost port for developer convenience
      if (process.env.NODE_ENV !== "production" && /^http:\/\/localhost:\d+$/.test(origin)) {
        return callback(null, true);
      }
      callback(new Error(`CORS: origin '${origin}' not allowed`));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-idempotency-key", "x-request-id"],
    credentials: true,
  })
);

// ─── Core Middleware ──────────────────────────────────────────────────────────
app.use(requestId);

// Webhook route MUST use raw body BEFORE express.json() strips it
app.use("/api/payments/webhook", express.raw({ type: "application/json" }));

app.use(express.json({ limit: "10mb" }));

// General rate limiter on all /api/* routes
app.use("/api", generalLimiter);

// ─── Root Route ───────────────────────────────────────────────────────────────
app.get("/", (_req, res) => {
  res.json({
    success: true,
    service: "RentX API",
    version: "1.0.0",
    status: "ok",
    description: "Vehicle rental marketplace backend",
    health: "/health",
    apiBase: "/api",
    docs: "https://github.com/Om-Beast/RentX",
  });
});

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatus =
    dbState === 1 ? "connected" :
    dbState === 2 ? "connecting" :
    dbState === 3 ? "disconnecting" : "disconnected";
  const isHealthy = dbStatus === "connected";
  res.status(isHealthy ? 200 : 503).json({
    success: isHealthy,
    service: "RentX API",
    version: "1.0.0",
    status: isHealthy ? "ok" : "degraded",
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
app.use("/api/admin", adminRoutes);

// ─── API Catalog (after route mounts) ────────────────────────────────────────
app.get("/api", (_req, res) => {
  res.json({
    success: true,
    service: "RentX API",
    version: "1.0.0",
    endpoints: {
      auth: "/api/auth",
      vehicles: "/api/vehicles",
      bookings: "/api/bookings",
      payments: "/api/payments",
      dashboard: "/api/dashboard",
      notifications: "/api/notifications",
      ai: "/api/ai",
      reviews: "/api/reviews",
      admin: "/api/admin",
    },
  });
});

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
