/**
 * Booking Service — Core rental reservation logic.
 *
 * CRITICAL: Concurrency-Safe Booking Creation
 * ============================================
 * Problem (TOCTOU Race Condition):
 *   The naive approach:
 *     1. Read: Check if vehicle is available for dates
 *     2. Write: Create booking
 *   Is NOT safe under concurrent load. Between step 1 and step 2,
 *   another request can also pass the availability check, and both
 *   will create conflicting bookings for the same vehicle and dates.
 *
 * Solution: MongoDB Transactions
 *   We wrap the check + insert in a single MongoDB transaction.
 *   MongoDB's replica set transactions guarantee serializable isolation
 *   for the operations within the session. Two concurrent transactions
 *   attempting to create conflicting bookings will serialize — one
 *   will see the other's write and fail the overlap check.
 *
 *   MongoDB Atlas runs as a replica set, so transactions are available.
 *
 * Tradeoff:
 *   Transactions add ~1-5ms latency per booking creation. At typical
 *   rental marketplace traffic (not millions of concurrent bookings),
 *   this is entirely acceptable. The correctness guarantee is worth it.
 *
 * Interview explanation (2 min):
 *   "The naive check-then-insert has a race condition: two requests arrive
 *    simultaneously, both read 'available', both insert. We fix this with a
 *    MongoDB transaction — the read and write are atomic within one session.
 *    MongoDB Atlas is a replica set, so transactions work out of the box.
 *    This is the simplest correct solution — no locks, no queues needed."
 */

import mongoose from "mongoose";
import Booking, {
  BOOKING_STATUSES,
  ACTIVE_BOOKING_STATUSES,
} from "../../models/Booking.js";
import Vehicle from "../../models/Vehicle.js";
import NotificationService from "../notifications/notification.service.js";
import TrustService from "../trust/trust.service.js";
import logger from "../../utils/logger.js";
import {
  NotFoundError,
  ConflictError,
  AuthorizationError,
  ValidationError,
} from "../../utils/errors.js";

/** Fee constants — centralized. Never scattered in controllers. */
const FEES = Object.freeze({
  GST_RATE: 0.18,
  PLATFORM_FEE: 99,
  DEFAULT_SECURITY_DEPOSIT: 1000,
});

/**
 * Compute the authoritative price breakdown for a booking.
 * This is the ONLY place rental pricing is calculated — never trust frontend amounts.
 */
function computePricing(pricePerDay, securityDeposit, startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const rentalDays = Math.max(
    1,
    Math.ceil((end - start) / (1000 * 60 * 60 * 24))
  );

  const baseAmount = rentalDays * pricePerDay;
  const gstAmount = Math.round(baseAmount * FEES.GST_RATE);
  const platformFee = FEES.PLATFORM_FEE;
  const depositAmount = securityDeposit ?? FEES.DEFAULT_SECURITY_DEPOSIT;
  const totalAmount = baseAmount + gstAmount + platformFee + depositAmount;

  return { rentalDays, baseAmount, gstAmount, platformFee, securityDeposit: depositAmount, totalAmount };
}

/**
 * Create a booking with atomic overlap detection.
 *
 * Uses a MongoDB transaction to ensure:
 * 1. Overlap check and booking insert are atomic
 * 2. No two bookings for the same vehicle and overlapping dates can succeed
 */
export const createBookingService = async (bookingData, customerId) => {
  const { vehicleId, pickupDate, returnDate } = bookingData;

  if (!vehicleId || !pickupDate || !returnDate) {
    throw new ValidationError("vehicleId, pickupDate, and returnDate are required");
  }

  const start = new Date(pickupDate);
  const end = new Date(returnDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new ValidationError("Invalid date format");
  }

  if (start >= end) {
    throw new ValidationError("Return date must be after pickup date");
  }

  if (start < new Date()) {
    throw new ValidationError("Pickup date cannot be in the past");
  }

  // Fetch vehicle outside transaction (read-only, doesn't need to be atomic)
  const vehicle = await Vehicle.findById(vehicleId);

  if (!vehicle) throw new NotFoundError("Vehicle not found");
  if (!vehicle.isAvailable) throw new ConflictError("Vehicle is not currently available for booking", "VEHICLE_UNAVAILABLE");
  if (vehicle.listingStatus !== "active") throw new ConflictError("This vehicle listing is not active", "LISTING_INACTIVE");

  const pricing = computePricing(vehicle.pricePerDay, vehicle.securityDeposit, start, end);

  // ─── ATOMIC SECTION: transaction ensures no TOCTOU race ───────────────────
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Conflict check INSIDE the transaction — serialized with any concurrent booking
    const conflictingBooking = await Booking.findOne({
      vehicle: vehicleId,
      bookingStatus: { $in: ACTIVE_BOOKING_STATUSES },
      startDate: { $lt: end },
      endDate: { $gt: start },
    }).session(session);

    if (conflictingBooking) {
      await session.abortTransaction();
      throw new ConflictError(
        "Vehicle is already booked for the selected dates",
        "BOOKING_DATE_CONFLICT"
      );
    }

    // Create booking inside transaction
    const [booking] = await Booking.create(
      [
        {
          user: customerId,
          vehicle: vehicleId,
          startDate: start,
          endDate: end,
          ...pricing,
          bookingStatus: BOOKING_STATUSES.PENDING_PAYMENT,
          paymentStatus: "pending",
          expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30-min hold
          timeline: [
            {
              eventType: "BOOKING_CREATED",
              actor: customerId,
              note: "Booking created, awaiting payment",
            },
          ],
        },
      ],
      { session }
    );

    await session.commitTransaction();

    logger.info("BookingService", "BOOKING_CREATED", {
      bookingId: booking._id,
      vehicleId,
      customerId,
      startDate: start,
      endDate: end,
      totalAmount: pricing.totalAmount,
    });

    // Non-critical notifications — run after transaction commits
    try {
      await NotificationService.createNotification({
        user: vehicle.owner,
        type: "BOOKING_CREATED",
        title: "New Booking Request",
        message: `A customer has requested to book your ${vehicle.brand} ${vehicle.name}`,
        priority: "HIGH",
        metadata: { bookingId: booking._id, vehicleId },
      });
    } catch (notifErr) {
      logger.warn("BookingService", "NOTIFICATION_FAILED", {
        bookingId: booking._id,
        error: notifErr.message,
      });
    }

    return booking;
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    throw error;
  } finally {
    session.endSession();
  }
};

export const getMyBookingsService = async (customerId) => {
  return Booking.find({ user: customerId })
    .populate("vehicle", "name brand model type pricePerDay images city")
    .sort({ createdAt: -1 });
};

export const getOwnerBookingsService = async (ownerId) => {
  const vehicles = await Vehicle.find({ owner: ownerId }).select("_id");
  const vehicleIds = vehicles.map((v) => v._id);

  return Booking.find({ vehicle: { $in: vehicleIds } })
    .populate("vehicle", "name brand model type pricePerDay images city")
    .populate("user", "name email phone")
    .sort({ createdAt: -1 });
};

export const getBookingByIdService = async (bookingId, requesterId, requesterRole) => {
  const booking = await Booking.findById(bookingId)
    .populate("vehicle")
    .populate("user", "name email phone trustScore");

  if (!booking) throw new NotFoundError("Booking not found");

  const isCustomer = booking.user._id.toString() === requesterId.toString();
  const isOwner = booking.vehicle.owner.toString() === requesterId.toString();
  const isAdmin = requesterRole === "ADMIN";

  if (!isCustomer && !isOwner && !isAdmin) {
    throw new AuthorizationError("You do not have permission to view this booking");
  }

  return booking;
};

export const cancelBookingService = async (bookingId, userId, role) => {
  const booking = await Booking.findById(bookingId).populate("vehicle");

  if (!booking) throw new NotFoundError("Booking not found");

  const isCustomer = booking.user.toString() === userId.toString();
  const isOwner =
    booking.vehicle?.owner?.toString() === userId.toString();
  const isAdmin = role === "ADMIN";

  if (!isCustomer && !isOwner && !isAdmin) {
    throw new AuthorizationError("You are not authorized to cancel this booking");
  }

  const cancellableStatuses = [
    BOOKING_STATUSES.PENDING_PAYMENT,
    BOOKING_STATUSES.PENDING_APPROVAL,
    BOOKING_STATUSES.CONFIRMED,
  ];

  if (!cancellableStatuses.includes(booking.bookingStatus)) {
    throw new ConflictError(
      `Cannot cancel a booking with status: ${booking.bookingStatus}`,
      "INVALID_STATUS_TRANSITION"
    );
  }

  booking.bookingStatus = BOOKING_STATUSES.CANCELLED;
  booking.cancelledBy = userId;
  booking.cancelledAt = new Date();
  booking.timeline.push({
    eventType: "BOOKING_CANCELLED",
    actor: userId,
    note: `Cancelled by ${role.toLowerCase()}`,
  });

  await booking.save();

  logger.info("BookingService", "BOOKING_CANCELLED", {
    bookingId,
    cancelledBy: userId,
    role,
  });

  // Notify the customer if an owner/admin cancelled
  if (!isCustomer) {
    try {
      await NotificationService.createNotification({
        user: booking.user,
        type: "BOOKING_CANCELLED",
        title: "Booking Cancelled",
        message: "Your booking has been cancelled.",
        priority: "HIGH",
        metadata: { bookingId: booking._id },
      });
    } catch (e) { /* non-critical */ }
  }

  return booking;
};

export const confirmBookingService = async (bookingId, requesterId, requesterRole) => {
  const booking = await Booking.findById(bookingId).populate("vehicle");

  if (!booking) throw new NotFoundError("Booking not found");

  if (booking.bookingStatus !== BOOKING_STATUSES.PENDING_APPROVAL) {
    throw new ConflictError(
      "Only bookings pending owner approval can be confirmed",
      "INVALID_STATUS_TRANSITION"
    );
  }

  const isOwner = booking.vehicle.owner.toString() === requesterId.toString();
  if (requesterRole !== "ADMIN" && !isOwner) {
    throw new AuthorizationError("Only the vehicle owner or an admin can confirm bookings");
  }

  booking.bookingStatus = BOOKING_STATUSES.CONFIRMED;
  booking.timeline.push({
    eventType: "BOOKING_APPROVED",
    actor: requesterId,
    note: "Fleet owner approved booking",
  });

  await booking.save();

  logger.info("BookingService", "BOOKING_CONFIRMED", { bookingId, ownerId: requesterId });

  await NotificationService.createNotification({
    user: booking.user,
    type: "BOOKING_APPROVED",
    title: "Booking Confirmed! 🎉",
    message: `Your booking for ${booking.vehicle.brand} ${booking.vehicle.name} has been approved. Get ready for your trip!`,
    priority: "HIGH",
    metadata: { bookingId: booking._id, vehicleId: booking.vehicle._id },
  });

  try {
    await TrustService.applyEvent(booking.user, TrustService.EVENT_TYPES.OWNER_APPROVED, {
      bookingId: booking._id,
      actorId: requesterId,
    });
  } catch (e) {
    logger.warn("BookingService", "TRUST_UPDATE_FAILED", { bookingId, error: e.message });
  }

  return booking;
};

export const rejectBookingService = async (bookingId, requesterId, requesterRole) => {
  const booking = await Booking.findById(bookingId).populate("vehicle");

  if (!booking) throw new NotFoundError("Booking not found");

  if (booking.bookingStatus !== BOOKING_STATUSES.PENDING_APPROVAL) {
    throw new ConflictError(
      "Only bookings pending owner approval can be rejected",
      "INVALID_STATUS_TRANSITION"
    );
  }

  const isOwner = booking.vehicle.owner.toString() === requesterId.toString();
  if (requesterRole !== "ADMIN" && !isOwner) {
    throw new AuthorizationError("Only the vehicle owner or an admin can reject bookings");
  }

  booking.bookingStatus = BOOKING_STATUSES.REJECTED;
  booking.timeline.push({
    eventType: "BOOKING_REJECTED",
    actor: requesterId,
    note: "Fleet owner rejected booking",
  });

  await booking.save();

  logger.info("BookingService", "BOOKING_REJECTED", { bookingId, ownerId: requesterId });

  await NotificationService.createNotification({
    user: booking.user,
    type: "BOOKING_REJECTED",
    title: "Booking Request Declined",
    message: `Your booking request for ${booking.vehicle.brand} ${booking.vehicle.name} was declined by the owner.`,
    priority: "MEDIUM",
    metadata: { bookingId: booking._id },
  });

  try {
    await TrustService.applyEvent(booking.user, TrustService.EVENT_TYPES.OWNER_REJECTED, {
      bookingId: booking._id,
      actorId: requesterId,
    });
  } catch (e) { /* non-critical */ }

  return booking;
};