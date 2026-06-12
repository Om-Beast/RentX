import express from "express";

import {
  createBooking,
  getBookings,
  cancelBooking,
  confirmBooking,
} from "./booking.controller.js";

import {
  protect,
} from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", getBookings);

router.post(
  "/",
  createBooking
);

router.patch(
  "/:id/cancel",
  protect,
  cancelBooking
);

router.patch(
  "/:id/confirm",
  protect,
  confirmBooking
);

export default router;