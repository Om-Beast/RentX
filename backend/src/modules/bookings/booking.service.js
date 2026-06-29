import Booking from "../../models/Booking.js";
import Vehicle from "../../models/Vehicle.js";
import NotificationService from "../notifications/notification.service.js";
import TrustService from "../trust/trust.service.js";

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
     $in: [
      "pending_payment",
      "pending_owner_approval",
      "approved"
    ],
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

  bookingStatus: "pending_payment",

  timeline: [
    {
      eventType: "BOOKING_CREATED",
      actor: customerId,
      note: "Booking created successfully",
    },
  ],
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
    console.log("OWNER ID TYPE =", typeof ownerId);
   console.log("OWNER ID =", ownerId);
        const vehicles =
        await Vehicle.find({
          owner: ownerId,
        }).select("_id");
        console.log(
        "ALL OWNER VEHICLES =",
        await Vehicle.find({ owner: ownerId })
      );
          console.log("OWNER ID =", ownerId);
        console.log("OWNER VEHICLES =", vehicles);

        const vehicleIds =
          vehicles.map(
            (vehicle) => vehicle._id
          );
          console.log(
        "OWNER VEHICLE IDS =",
        vehicleIds
        );

      const bookings =
      await Booking.find({
        vehicle: {
          $in: vehicleIds,
        },
      })
        .populate("vehicle")
        .populate("user", "name email")
        .sort({
          createdAt: -1,
        });

    console.log(
      "OWNER BOOKINGS =",
      bookings
    );

    return bookings;
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
  booking.user.toString() ===
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

booking.timeline.push({
  eventType: "BOOKING_CANCELLED",
  actor: userId,
  note: "Booking cancelled",
});

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
      "pending_owner_approval"
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
      "approved";
      booking.timeline.push({
  eventType: "BOOKING_APPROVED",
  actor: requesterId,
  note: "Fleet owner approved booking",
});
await NotificationService.createNotification({
  user: booking.user,
  type: "BOOKING_APPROVED",
  title: "Booking Approved",
  message:
    "Your booking has been approved by the vehicle owner.",
  priority: "HIGH",
  metadata: {
    bookingId: booking._id,
    vehicleId: booking.vehicle._id,
  },
});
    await booking.save();
    await TrustService.applyEvent(
  booking.user,
  TrustService.EVENT_TYPES.OWNER_APPROVED,
  {
    bookingId: booking._id,
    actorId: requesterId,
  }
);

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
       "pending_owner_approval"
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


   booking.bookingStatus = "rejected";

booking.timeline.push({
  eventType: "BOOKING_REJECTED",
  actor: requesterId,
  note: "Fleet owner rejected booking",
});

await booking.save();
  };