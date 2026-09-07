/**
 * Review model.
 *
 * Business rules enforced by the unique index + service validation:
 * 1. One review per completed booking (unique index on bookingId)
 * 2. Reviewer must be the booking customer (checked in service)
 * 3. Booking must be 'completed' status (checked in service)
 * 4. Rating: integer 1–5
 * 5. Comment: 10–1000 characters
 *
 * On review creation, VehicleService.updateRating() is called to
 * atomically update Vehicle.rating and Vehicle.reviewCount with $inc.
 */

import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: [true, "Review must be linked to a booking"],
      unique: true, // Enforces one review per booking at DB level
    },

    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      required: [true, "Review must reference a vehicle"],
    },

    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Review must have a reviewer"],
    },

    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot exceed 5"],
      validate: {
        validator: Number.isInteger,
        message: "Rating must be an integer",
      },
    },

    comment: {
      type: String,
      required: [true, "Review comment is required"],
      trim: true,
      minlength: [10, "Review must be at least 10 characters"],
      maxlength: [1000, "Review cannot exceed 1000 characters"],
    },
  },
  {
    timestamps: true,
  }
);

reviewSchema.index({ vehicle: 1, createdAt: -1 });
reviewSchema.index({ reviewer: 1, createdAt: -1 });

const Review = mongoose.models.Review || mongoose.model("Review", reviewSchema);
export default Review;
