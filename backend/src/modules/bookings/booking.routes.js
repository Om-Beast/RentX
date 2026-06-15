import express from "express";

import {
  createBooking,
  getMyBookings,
  getOwnerBookings,
  cancelBooking,
  confirmBooking,
  rejectBooking,
} from "./booking.controller.js";

import {
  protect,
  authorize,
} from "../../middlewares/auth.middleware.js";

const router = express.Router();

// Customer creates booking
router.post(
  "/",
  protect,
  authorize("CUSTOMER"),
  createBooking
);

// Customer sees own bookings
router.get(
  "/my-bookings",
  protect,
  authorize("CUSTOMER"),
  getMyBookings
);

// Fleet owner sees bookings on his vehicles
router.get(
  "/owner-bookings",
  protect,
  authorize("FLEET_OWNER", "ADMIN"),
  getOwnerBookings
);

// Cancel booking
router.patch(
  "/:id/cancel",
  protect,
  cancelBooking
);
router.patch(
  "/:id/confirm",
  protect,
  authorize("FLEET_OWNER", "ADMIN"),
  confirmBooking
);

router.patch(
  "/:id/reject",
  protect,
  authorize("FLEET_OWNER", "ADMIN"),
  rejectBooking
);

export default router;