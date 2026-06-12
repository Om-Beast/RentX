import Booking from "../../models/Booking.js";

export const createBooking = async (bookingData) => {
  return await Booking.create(bookingData);
};

export const getBookingsByCustomer = async (userId) => {
  return await Booking.find({
    user: userId,
  })
    .populate("vehicle")
    .sort({ createdAt: -1 });
};

export const getBookingById = async (bookingId) => {
  return await Booking.findById(bookingId)
    .populate("vehicle")
    .populate("customer");
};
export const confirmBookingById = async (
  bookingId
) => {
  return await Booking.findByIdAndUpdate(
    bookingId,
    {
      bookingStatus: "confirmed",
    },
    {
      new: true,
    }
  );
};