import Booking from "../../models/Booking.js";
import Vehicle from "../../models/Vehicle.js";

import {
  createBooking,
  getBookingsByCustomer,
} from "./booking.repository.js";

import { isVehicleAvailable } from "./availability.service.js";

export const createBookingService = async (
  bookingData
) => {
  const {
    vehicle,
    startDate,
    endDate,
  } = bookingData;

  // Date Validation
  if (
    new Date(startDate) >=
    new Date(endDate)
  ) {
    throw new Error(
      "End date must be after start date"
    );
  }

  // Availability Check
  const available =
    await isVehicleAvailable(
      vehicle,
      startDate,
      endDate
    );

  if (!available) {
    throw new Error(
      "Vehicle already booked for selected dates"
    );
  }

  // Vehicle Fetch
  const vehicleDoc =
    await Vehicle.findById(vehicle);

  if (!vehicleDoc) {
    throw new Error(
      "Vehicle not found"
    );
  }

  // Total Price Calculation
  const days = Math.ceil(
    (new Date(endDate) -
      new Date(startDate)) /
      (1000 * 60 * 60 * 24)
  );

  bookingData.totalPrice =
    days * vehicleDoc.rentPerDay;

  return await createBooking(
    bookingData
  );
};

export const getBookingsService = async (
  customerId
) => {
  return await getBookingsByCustomer(
    customerId
  );
};

export const cancelBookingService = async (
  bookingId
) => {
  return await Booking.findByIdAndUpdate(
    bookingId,
    {
      bookingStatus: "cancelled",
    },
    {
      new: true,
    }
  );
};

export const confirmBookingService = async (
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