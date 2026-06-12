import {
  createBookingService,
  getBookingsService,
  cancelBookingService,
  confirmBookingService,
} from "./booking.service.js";

export const createBooking = async (req, res) => {
  try {
    console.log("🔥 BOOKING CONTROLLER HIT");
    console.log(req.body);

    const booking = await createBookingService(req.body);

    res.status(201).json({
      success: true,
      booking,
    });
  } catch (error) {

    console.log("❌ ERROR:");
    console.log(error);

    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getBookings = async (
  req,
  res
) => {
  try {
    const customerId =
      req.query.customerId;

    const bookings =
      await getBookingsService(
        customerId
      );

    res.status(200).json({
      success: true,
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const cancelBooking = async (
  req,
  res
) => {
  try {
    const booking =
      await cancelBookingService(
        req.params.id
      );

    res.status(200).json({
      success: true,
      booking,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const confirmBooking = async (
  req,
  res
) => {
  try {
    const booking =
      await confirmBookingService(
        req.params.id
      );

    res.status(200).json({
      success: true,
      booking,
    });
  } catch (error) {
   res.status(error.statusCode || 500).json({
  success:false,
  message:error.message
});
  }
};