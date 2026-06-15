import {
  createBookingService,
  getMyBookingsService,
  getOwnerBookingsService,
  cancelBookingService,
  confirmBookingService,
  rejectBookingService,
} from "./booking.service.js";

export const createBooking = async (
  req,
  res
) => {
  try {
    const booking =
      await createBookingService(
        req.body,
        req.user._id
      );

    res.status(201).json({
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

export const getMyBookings =
  async (req, res) => {
    try {
      const bookings =
        await getMyBookingsService(
          req.user._id
        );

      res.status(200).json({
        success: true,
        bookings,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

export const getOwnerBookings =
  async (req, res) => {
    try {
      const bookings =
        await getOwnerBookingsService(
          req.user._id
        );

      res.status(200).json({
        success: true,
        bookings,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

export const cancelBooking =
  async (req, res) => {
    try {
      const booking =
        await cancelBookingService(
          req.params.id,
          req.user._id,
          req.user.role
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
  export const confirmBooking =
  async (req, res) => {
    try {
      const booking =
        await confirmBookingService(
          req.params.id,
          req.user._id,
          req.user.role
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

export const rejectBooking =
  async (req, res) => {
    try {
      const booking =
        await rejectBookingService(
          req.params.id,
          req.user._id,
          req.user.role
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