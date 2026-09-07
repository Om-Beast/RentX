import {
  createBookingService,
  getMyBookingsService,
  getOwnerBookingsService,
  cancelBookingService,
  confirmBookingService,
  rejectBookingService,
  getBookingByIdService,
} from "./booking.service.js";

export const createBooking = async (req, res, next) => {
  try {
    const booking = await createBookingService(req.body, req.user._id);
    res.status(201).json({ success: true, booking });
  } catch (error) {
    next(error);
  }
};

export const getMyBookings = async (req, res, next) => {
  try {
    const bookings = await getMyBookingsService(req.user._id);
    res.status(200).json({ success: true, bookings });
  } catch (error) {
    next(error);
  }
};

export const getOwnerBookings = async (req, res, next) => {
  try {
    const bookings = await getOwnerBookingsService(req.user._id);
    res.status(200).json({ success: true, bookings });
  } catch (error) {
    next(error);
  }
};

export const getBookingById = async (req, res, next) => {
  try {
    const booking = await getBookingByIdService(req.params.id, req.user._id, req.user.role);
    res.status(200).json({ success: true, booking });
  } catch (error) {
    next(error);
  }
};

export const cancelBooking = async (req, res, next) => {
  try {
    const booking = await cancelBookingService(req.params.id, req.user._id, req.user.role);
    res.status(200).json({ success: true, booking });
  } catch (error) {
    next(error);
  }
};

export const confirmBooking = async (req, res, next) => {
  try {
    const booking = await confirmBookingService(req.params.id, req.user._id, req.user.role);
    res.status(200).json({ success: true, booking });
  } catch (error) {
    next(error);
  }
};

export const rejectBooking = async (req, res, next) => {
  try {
    const booking = await rejectBookingService(req.params.id, req.user._id, req.user.role);
    res.status(200).json({ success: true, booking });
  } catch (error) {
    next(error);
  }
};