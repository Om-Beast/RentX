import express from "express";
import {
  getAllUsers,
  getUserById,
  toggleUserSuspension,
  getAllVehiclesAdmin,
  moderateVehicle,
  getAllBookingsAdmin,
  getAllPaymentsAdmin,
  getPlatformAnalytics,
} from "./admin.controller.js";
import { protect, authorize } from "../../middlewares/auth.middleware.js";

const router = express.Router();

// All admin routes require authentication AND ADMIN role
// This is enforced ONCE here — every handler can safely assume req.user.role === "ADMIN"
router.use(protect, authorize("ADMIN"));

// ─── Users ───────────────────────────────────
router.get("/users", getAllUsers);
router.get("/users/:id", getUserById);
router.patch("/users/:id/suspend", toggleUserSuspension);

// ─── Vehicles ─────────────────────────────────
router.get("/vehicles", getAllVehiclesAdmin);
router.patch("/vehicles/:id/moderate", moderateVehicle);

// ─── Bookings ─────────────────────────────────
router.get("/bookings", getAllBookingsAdmin);

// ─── Payments ─────────────────────────────────
router.get("/payments", getAllPaymentsAdmin);

// ─── Analytics ────────────────────────────────
router.get("/analytics", getPlatformAnalytics);

export default router;
