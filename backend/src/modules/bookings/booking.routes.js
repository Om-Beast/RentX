import express from "express";
import {
  createBooking,
  getMyBookings,
  getOwnerBookings,
  cancelBooking,
  confirmBooking,
  rejectBooking,
  getBookingById,
} from "./booking.controller.js";
import { protect, authorize } from "../../middlewares/auth.middleware.js";
import { bookingLimiter } from "../../middlewares/rateLimit.middleware.js";
import { getBookedDates, checkAvailability } from "./booking.availability.controller.js";

const router = express.Router();

// Customer creates a booking (rate limited)
router.post("/", protect, authorize("CUSTOMER"), bookingLimiter, createBooking);

// Customer views own bookings
router.get("/my-bookings", protect, authorize("CUSTOMER"), getMyBookings);

// Fleet owner views bookings on their vehicles
router.get("/owner-bookings", protect, authorize("FLEET_OWNER", "ADMIN"), getOwnerBookings);

// Get booked dates for a vehicle (for calendar display)
router.get("/availability/:vehicleId", getBookedDates);

// Check specific date range availability
router.get("/check-availability", checkAvailability);

// Get single booking (customer/owner/admin — ownership checked in service)
router.get("/:id", protect, getBookingById);

// Cancel booking
router.patch("/:id/cancel", protect, cancelBooking);

// Owner approves
router.patch("/:id/confirm", protect, authorize("FLEET_OWNER", "ADMIN"), confirmBooking);

// Owner rejects
router.patch("/:id/reject", protect, authorize("FLEET_OWNER", "ADMIN"), rejectBooking);

export default router;