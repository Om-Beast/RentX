import Booking from "../../models/Booking.js";
import Vehicle from "../../models/Vehicle.js";

export const createBookingService = async (
  bookingData,
  customerId
) => {
 const {
  vehicleId,
  pickupDate,
  returnDate,
} = bookingData;

  const vehicle = await Vehicle.findById(
    vehicleId
  );

  if (!vehicle) {
    throw new Error("Vehicle not found");
  }

  if (!vehicle.isAvailable) {
    throw new Error(
      "Vehicle is not available"
    );
  }

  const overlappingBooking =
  await Booking.findOne({
    vehicle: vehicleId,

    bookingStatus: {
      $in: ["pending", "confirmed"],
    },

    startDate: {
      $lt: new Date(returnDate),
    },

    endDate: {
      $gt: new Date(pickupDate),
    },
  });

  if (overlappingBooking) {
    throw new Error(
      "Vehicle already booked for selected dates"
    );
  }

  const rentalDays = Math.ceil(
    (new Date(returnDate) -
      new Date(pickupDate)) /
      (1000 * 60 * 60 * 24)
  );
  const totalPrice =
  rentalDays * vehicle.rentPerDay;

const gst = Math.round(
  totalPrice * 0.18
);

const platformFee = 99;

const securityDeposit = 1000;


  const finalAmount =
    totalPrice +
    gst +
    platformFee +
    securityDeposit;

  const booking = await Booking.create({
  user: customerId,

  vehicle: vehicleId,

  startDate: pickupDate,

  endDate: returnDate,

 totalPrice: finalAmount,

  bookingStatus: "pending",
});

  return booking;
};

export const getMyBookingsService =
  async (customerId) => {
    return await Booking.find({
  user: customerId,
})
      .populate("vehicle")
      .sort({
        createdAt: -1,
      });
  };

export const getOwnerBookingsService =
  async (ownerId) => {
    const vehicles =
      await Vehicle.find({
        owner: ownerId,
      }).select("_id");

    const vehicleIds =
      vehicles.map(
        (vehicle) => vehicle._id
      );

    return await Booking.find({
      vehicle: {
        $in: vehicleIds,
      },
    })
      .populate("vehicle")
      .populate("user", "name email")
      .sort({
        createdAt: -1,
      });
  };

export const cancelBookingService =
  async (
    bookingId,
    userId,
    role
  ) => {
    const booking =
      await Booking.findById(
        bookingId
      );

    if (!booking) {
      throw new Error(
        "Booking not found"
      );
    }

    const isOwner =
      booking.customer.toString() ===
      userId.toString();

    if (
      role !== "ADMIN" &&
      !isOwner
    ) {
      throw new Error(
        "Not authorized"
      );
    }

    if (
      booking.bookingStatus ===
      "cancelled"
    ) {
      throw new Error(
        "Booking already cancelled"
      );
    }

    booking.bookingStatus =
      "cancelled";

    await booking.save();

    return booking;
  };
  export const confirmBookingService =
  async (
    bookingId,
    requesterId,
    requesterRole
  ) => {
    const booking =
      await Booking.findById(
        bookingId
      ).populate("vehicle");

    if (!booking) {
      throw new Error(
        "Booking not found"
      );
    }

    if (
      booking.bookingStatus !==
      "pending"
    ) {
      throw new Error(
        "Only pending bookings can be confirmed"
      );
    }

    const isOwner =
      booking.vehicle.owner.toString() ===
      requesterId.toString();

    if (
      requesterRole !==
        "ADMIN" &&
      !isOwner
    ) {
      throw new Error(
        "Not authorized"
      );
    }

    booking.bookingStatus =
      "confirmed";

    await booking.save();

    return booking;
  };

export const rejectBookingService =
  async (
    bookingId,
    requesterId,
    requesterRole
  ) => {
    const booking =
      await Booking.findById(
        bookingId
      ).populate("vehicle");

    if (!booking) {
      throw new Error(
        "Booking not found"
      );
    }

    if (
      booking.bookingStatus !==
      "pending"
    ) {
      throw new Error(
        "Only pending bookings can be rejected"
      );
    }

    const isOwner =
      booking.vehicle.owner.toString() ===
      requesterId.toString();

    if (
      requesterRole !==
        "ADMIN" &&
      !isOwner
    ) {
      throw new Error(
        "Not authorized"
      );
    }

    booking.bookingStatus =
      "cancelled";

    await booking.save();

    return booking;
  };