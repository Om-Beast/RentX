import Booking from "../../models/Booking.js";

export const isVehicleAvailable = async (
  vehicleId,
  startDate,
  endDate
) => {

  console.log("Vehicle:", vehicleId);
  console.log("Start:", startDate);
  console.log("End:", endDate);
  

  const conflictingBooking =
    await Booking.findOne({
      vehicle: vehicleId,
      bookingStatus: {
        $in: ["pending", "confirmed"],
      },
      startDate: {
        $lte: endDate,
      },
      endDate: {
        $gte: startDate,
      },
    });

  console.log("CONFLICT:", conflictingBooking);

  return !conflictingBooking;
};