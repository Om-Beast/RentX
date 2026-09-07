import express from "express";
import { protect, authorize } from "../../middlewares/auth.middleware.js";
import { getDashboardStats, getRecentBookings, getOwnerAnalytics } from "./dashboard.controller.js";

const router = express.Router();

// All dashboard routes require authentication + fleet owner or admin role
router.get("/stats", protect, authorize("FLEET_OWNER", "ADMIN"), getDashboardStats);
router.get("/recent-bookings", protect, authorize("FLEET_OWNER", "ADMIN"), getRecentBookings);
router.get("/analytics", protect, authorize("FLEET_OWNER", "ADMIN"), getOwnerAnalytics);

export default router;