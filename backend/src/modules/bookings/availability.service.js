import Booking from "../../models/Booking.js";
import { ACTIVE_BOOKING_STATUSES } from "../../models/Booking.js";

/**
 * Check if a vehicle is available for the given date range.
 * Used for the availability calendar display on vehicle detail page.
 *
 * Note: This is a READ-ONLY check for UI purposes.
 * The actual conflict check during booking creation is done INSIDE
 * a MongoDB transaction in booking.service.js to prevent race conditions.
 */
export const isVehicleAvailable = async (vehicleId, startDate, endDate) => {
  const conflictingBooking = await Booking.findOne({
    vehicle: vehicleId,
    bookingStatus: { $in: ACTIVE_BOOKING_STATUSES },
    startDate: { $lt: new Date(endDate) },
    endDate: { $gt: new Date(startDate) },
  });

  return !conflictingBooking;
};

/**
 * Get all booked date ranges for a vehicle (for calendar display).
 */
export const getBookedDateRanges = async (vehicleId) => {
  const bookings = await Booking.find({
    vehicle: vehicleId,
    bookingStatus: { $in: ACTIVE_BOOKING_STATUSES },
  }).select("startDate endDate").lean();

  return bookings.map((b) => ({
    startDate: b.startDate,
    endDate: b.endDate,
  }));
};