import Booking from "../../models/Booking.js";

export const createBooking = async (bookingData) => {
  return await Booking.create(bookingData);
};

export const getBookingsByCustomer = async (customerId) => {
  return await Booking.find({
    customer: customerId,
  })
    .populate("vehicle")
    .sort({ createdAt: -1 });
};

export const getBookingById = async (bookingId) => {
  return await Booking.findById(bookingId)
    .populate("vehicle")
    .populate("customer");
};