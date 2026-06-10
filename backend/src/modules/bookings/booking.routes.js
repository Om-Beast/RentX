import express from "express";

import {
  createBooking,
} from "./booking.controller.js";

import {
  protect,
} from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.post(
  "/",
  protect,
  createBooking
);

export default router;