import { createReviewService, getVehicleReviewsService } from "./review.service.js";

export const createReview = async (req, res, next) => {
  try {
    const { bookingId, rating, comment } = req.body;
    const review = await createReviewService({
      bookingId,
      rating: parseInt(rating, 10),
      comment,
      reviewerId: req.user._id,
    });
    res.status(201).json({ success: true, review });
  } catch (error) {
    next(error);
  }
};

export const getVehicleReviews = async (req, res, next) => {
  try {
    const result = await getVehicleReviewsService(req.params.vehicleId, req.query);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};
