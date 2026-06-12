import express from "express";

import {
  getDashboardStats,
  getRecentBookings,
} from "./dashboard.controller.js";

const router = express.Router();

router.get(
  "/stats",
  getDashboardStats
);

router.get(
  "/recent-bookings",
  getRecentBookings
);

export default router;