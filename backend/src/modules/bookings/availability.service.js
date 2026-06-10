import Booking from "../../models/Booking.js";

export const isVehicleAvailable = async (
  vehicleId,
  startDate,
  endDate
) => {
  const conflictingBooking =
    await Booking.findOne({
      vehicle: vehicleId,

      bookingStatus: {
        $in: [
          "pending",
          "confirmed"
        ]
      },

      startDate: {
        $lte: endDate
      },

      endDate: {
        $gte: startDate
      }
    });

  return !conflictingBooking;
};
