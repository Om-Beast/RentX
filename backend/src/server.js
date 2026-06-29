import "dotenv/config";

import express from "express";
import cors from "cors";

import connectDB from "./config/db.js";

import authRoutes from "./modules/auth/auth.routes.js";
import vehicleRoutes from "./modules/vehicles/vehicle.routes.js";
import bookingRoutes from "./modules/bookings/booking.routes.js";
import dashboardRoutes from "./modules/dashboard/dashboard.routes.js";
import paymentRoutes from "./modules/payment/payment.routes.js";
import notificationRoutes from "./modules/notifications/notification.routes.js";
import aiRoutes from "./modules/ai/ai.routes.js";

// Database Connect
await connectDB();

const app = express();

// Middleware
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "x-idempotency-key",
    ],
  })
);

app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/payments", paymentRoutes);
app.use(
  "/api/notifications",
  notificationRoutes
);
app.use("/api/ai", aiRoutes);

// Health Check
app.get("/", (req, res) => {
  res.send("RentX Backend Running 🚀");
});

// Server Start
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});