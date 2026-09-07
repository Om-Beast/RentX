import express from "express";
import { createReview, getVehicleReviews } from "./review.controller.js";
import { protect, authorize } from "../../middlewares/auth.middleware.js";

const router = express.Router();

// Submit a review (only customers with completed bookings)
router.post("/", protect, authorize("CUSTOMER"), createReview);

// Get reviews for a vehicle (public)
router.get("/vehicle/:vehicleId", getVehicleReviews);

export default router;
