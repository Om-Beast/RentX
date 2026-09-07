/**
 * Cancellation Service — centralized cancellation policy.
 *
 * All cancellation business rules live HERE — not scattered in controllers.
 *
 * Policy:
 *   - Cancel 48h+ before pickup  → 100% refund of base amount
 *   - Cancel 24–48h before pickup → 50% refund of base amount
 *   - Cancel < 24h before pickup  → No refund (forfeit base amount)
 *   - Security deposit is always fully refunded
 *   - Platform fee is always forfeited (non-refundable)
 *   - Owner or admin cancellation → always 100% refund
 *
 * Why centralized:
 *   If the policy changes (e.g. 72h cutoff instead of 48h), there's
 *   exactly one place to update. No hunting through controllers.
 */

import Booking, { BOOKING_STATUSES } from "../../models/Booking.js";
import Payment from "../../models/Payment.js";
import NotificationService from "../notifications/notification.service.js";
import logger from "../../utils/logger.js";
import { NotFoundError, ConflictError, AuthorizationError } from "../../utils/errors.js";

const CANCELLATION_POLICY = Object.freeze({
  FULL_REFUND_HOURS: 48,
  PARTIAL_REFUND_HOURS: 24,
  PARTIAL_REFUND_PERCENT: 0.5,
});

/**
 * Determine the refund amount for a cancellation.
 * Returns { refundAmount, refundPercent, policy }
 */
export function determineRefund(booking, cancellerRole) {
  // Owner/admin cancellations always get full refund
  if (cancellerRole === "ADMIN" || cancellerRole === "FLEET_OWNER") {
    return {
      refundAmount: booking.totalAmount - booking.platformFee,
      refundPercent: 100,
      policy: "OWNER_ADMIN_CANCELLATION_FULL_REFUND",
    };
  }

  const now = new Date();
  const pickupTime = new Date(booking.startDate);
  const hoursUntilPickup = (pickupTime - now) / (1000 * 60 * 60);

  // Security deposit always refunded in all customer cases
  const depositRefund = booking.securityDeposit;

  if (hoursUntilPickup >= CANCELLATION_POLICY.FULL_REFUND_HOURS) {
    return {
      refundAmount: booking.baseAmount + booking.gstAmount + depositRefund,
      refundPercent: 100,
      policy: "FULL_REFUND_48H_PLUS",
    };
  }

  if (hoursUntilPickup >= CANCELLATION_POLICY.PARTIAL_REFUND_HOURS) {
    const baseRefund = booking.baseAmount * CANCELLATION_POLICY.PARTIAL_REFUND_PERCENT;
    const gstRefund = booking.gstAmount * CANCELLATION_POLICY.PARTIAL_REFUND_PERCENT;
    return {
      refundAmount: Math.round(baseRefund + gstRefund + depositRefund),
      refundPercent: 50,
      policy: "PARTIAL_REFUND_24_48H",
    };
  }

  // < 24h — only deposit returned
  return {
    refundAmount: depositRefund,
    refundPercent: 0,
    policy: "NO_REFUND_UNDER_24H",
  };
}

export const cancelBookingWithRefund = async (bookingId, cancellerId, cancellerRole, reason = "") => {
  const booking = await Booking.findById(bookingId).populate("vehicle");
  if (!booking) throw new NotFoundError("Booking not found");

  const isCustomer = booking.user.toString() === cancellerId.toString();
  const isVehicleOwner = booking.vehicle?.owner?.toString() === cancellerId.toString();
  const isAdmin = cancellerRole === "ADMIN";

  if (!isCustomer && !isVehicleOwner && !isAdmin) {
    throw new AuthorizationError("You are not authorized to cancel this booking");
  }

  const cancellableStatuses = [
    BOOKING_STATUSES.PENDING_PAYMENT,
    BOOKING_STATUSES.PENDING_APPROVAL,
    BOOKING_STATUSES.CONFIRMED,
  ];

  if (!cancellableStatuses.includes(booking.bookingStatus)) {
    throw new ConflictError(
      `Cannot cancel booking with status: ${booking.bookingStatus}`,
      "INVALID_STATUS_TRANSITION"
    );
  }

  const refundInfo = determineRefund(booking, cancellerRole);

  booking.bookingStatus = BOOKING_STATUSES.CANCELLED;
  booking.cancelledBy = cancellerId;
  booking.cancelledAt = new Date();
  booking.cancellationReason = reason;
  booking.refundAmount = booking.paymentStatus === "paid" ? refundInfo.refundAmount : 0;
  booking.paymentStatus = booking.paymentStatus === "paid" ? "refund_pending" : booking.paymentStatus;

  booking.timeline.push({
    eventType: "BOOKING_CANCELLED",
    actor: cancellerId,
    note: `Cancelled by ${cancellerRole}. Policy: ${refundInfo.policy}. Refund: ₹${refundInfo.refundAmount}`,
  });

  await booking.save();

  logger.info("CancellationService", "BOOKING_CANCELLED", {
    bookingId,
    cancellerId,
    cancellerRole,
    refundPolicy: refundInfo.policy,
    refundAmount: refundInfo.refundAmount,
  });

  // Notify affected party
  const notifyUserId = isCustomer ? booking.vehicle?.owner : booking.user;
  if (notifyUserId) {
    try {
      await NotificationService.createNotification({
        user: notifyUserId,
        type: "BOOKING_CANCELLED",
        title: "Booking Cancelled",
        message: `A booking has been cancelled. ${
          refundInfo.refundAmount > 0
            ? `Refund of ₹${refundInfo.refundAmount} will be processed.`
            : "No refund applicable per cancellation policy."
        }`,
        priority: "HIGH",
        metadata: { bookingId, refundAmount: refundInfo.refundAmount },
      });
    } catch (e) { /* non-critical */ }
  }

  return { booking, refundInfo };
};
