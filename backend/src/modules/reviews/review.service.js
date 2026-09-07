import Review from "../../models/Review.js";
import Booking from "../../models/Booking.js";
import Vehicle from "../../models/Vehicle.js";
import { BOOKING_STATUSES } from "../../models/Booking.js";
import {
  ValidationError,
  NotFoundError,
  ConflictError,
  AuthorizationError,
} from "../../utils/errors.js";
import logger from "../../utils/logger.js";

/**
 * Submit a review for a completed booking.
 *
 * Business rules:
 * 1. Booking must have status 'completed'
 * 2. Reviewer must be the booking customer (not vehicle owner, not admin)
 * 3. One review per booking (enforced by unique index + service check)
 * 4. Rating: 1-5 integer
 * 5. Comment: 10-1000 characters
 */
export const createReviewService = async ({ bookingId, rating, comment, reviewerId }) => {
  const booking = await Booking.findById(bookingId).populate("vehicle");

  if (!booking) throw new NotFoundError("Booking not found");

  if (booking.bookingStatus !== BOOKING_STATUSES.COMPLETED) {
    throw new ValidationError("You can only review completed bookings");
  }

  if (booking.user.toString() !== reviewerId.toString()) {
    throw new AuthorizationError("You can only review your own bookings");
  }

  const existingReview = await Review.findOne({ booking: bookingId });
  if (existingReview) {
    throw new ConflictError("You have already reviewed this booking", "REVIEW_EXISTS");
  }

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new ValidationError("Rating must be an integer between 1 and 5");
  }

  const review = await Review.create({
    booking: bookingId,
    vehicle: booking.vehicle._id,
    reviewer: reviewerId,
    rating,
    comment: comment?.trim(),
  });

  // Update vehicle rating aggregate atomically
  await updateVehicleRating(booking.vehicle._id);

  logger.info("ReviewService", "REVIEW_CREATED", {
    reviewId: review._id,
    vehicleId: booking.vehicle._id,
    rating,
  });

  return review;
};

/**
 * Recompute vehicle rating from all reviews.
 * Called after every review create/delete.
 * Uses aggregation so we don't download all reviews to Node.
 */
async function updateVehicleRating(vehicleId) {
  const [result] = await Review.aggregate([
    { $match: { vehicle: vehicleId } },
    { $group: { _id: null, avgRating: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);

  await Vehicle.findByIdAndUpdate(vehicleId, {
    $set: {
      rating: result ? Math.round(result.avgRating * 10) / 10 : 0,
      reviewCount: result ? result.count : 0,
    },
  });
}

export const getVehicleReviewsService = async (vehicleId, { page = 1, limit = 10 } = {}) => {
  const safePage = Math.max(1, parseInt(page, 10));
  const safeLimit = Math.min(50, Math.max(1, parseInt(limit, 10)));
  const skip = (safePage - 1) * safeLimit;

  const [reviews, total] = await Promise.all([
    Review.find({ vehicle: vehicleId })
      .populate("reviewer", "name profileImage trustScore")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit)
      .lean(),
    Review.countDocuments({ vehicle: vehicleId }),
  ]);

  return {
    reviews,
    pagination: {
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit),
    },
  };
};
