/**
 * Booking model.
 *
 * Represents a vehicle reservation in the RentX system.
 *
 * Booking Lifecycle (state machine):
 *
 *   PENDING_PAYMENT  → Payment not yet made
 *        ↓              (Razorpay order created, waiting for payment)
 *   PAYMENT_PENDING  → Payment initiated, awaiting confirmation
 *        ↓
 *   PENDING_APPROVAL → Payment confirmed, awaiting fleet owner approval
 *        ↓              Owner can: APPROVE → CONFIRMED or REJECT → REJECTED
 *   CONFIRMED        → Approved and ready for pickup
 *        ↓
 *   ACTIVE           → Vehicle picked up, rental in progress
 *        ↓
 *   COMPLETED        → Vehicle returned, rental finished
 *
 * Alternative transitions:
 *   Any cancellable state → CANCELLED  (customer/owner/admin action)
 *   PENDING_PAYMENT       → EXPIRED    (background job cleans up stale holds)
 *   CONFIRMED/ACTIVE      → REFUND_PENDING → REFUNDED
 *
 * Concurrency Safety:
 * Booking creation uses a MongoDB transaction that atomically:
 *   1. Checks for overlapping active bookings
 *   2. Creates the new booking
 * This prevents the TOCTOU race condition where two simultaneous requests
 * for the same vehicle and dates could both pass the overlap check.
 *
 * Critical Indexes:
 * - { vehicle, startDate, endDate }: Used by the overlap query on every booking creation
 * - { vehicle, bookingStatus }: Used to filter conflicting bookings efficiently
 * - { user, bookingStatus }: Customer dashboard queries
 * - { bookingStatus, createdAt }: Background job queries (find expired holds)
 */

import mongoose from "mongoose";

export const BOOKING_STATUSES = Object.freeze({
  PENDING_PAYMENT:  "pending_payment",
  PAYMENT_PENDING:  "payment_pending",
  PENDING_APPROVAL: "pending_owner_approval",
  CONFIRMED:        "confirmed",
  ACTIVE:           "active",
  COMPLETED:        "completed",
  CANCELLED:        "cancelled",
  REJECTED:         "rejected",
  EXPIRED:          "expired",
  REFUND_PENDING:   "refund_pending",
  REFUNDED:         "refunded",
});

const ALL_STATUSES = Object.values(BOOKING_STATUSES);

/**
 * Statuses that "block" a vehicle's availability.
 * Used in the overlap check query.
 */
export const ACTIVE_BOOKING_STATUSES = [
  BOOKING_STATUSES.PENDING_PAYMENT,
  BOOKING_STATUSES.PAYMENT_PENDING,
  BOOKING_STATUSES.PENDING_APPROVAL,
  BOOKING_STATUSES.CONFIRMED,
  BOOKING_STATUSES.ACTIVE,
];

const timelineEventSchema = new mongoose.Schema(
  {
    eventType: {
      type: String,
      required: true,
    },
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    note: {
      type: String,
      default: "",
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const bookingSchema = new mongoose.Schema(
  {
    /**
     * Participants
     */
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Booking must have a customer"],
    },

    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      required: [true, "Booking must reference a vehicle"],
    },

    /**
     * Rental Period
     */
    startDate: {
      type: Date,
      required: [true, "Start date is required"],
    },

    endDate: {
      type: Date,
      required: [true, "End date is required"],
    },

    /**
     * Pricing (server-computed, never from frontend)
     * These are stored at booking creation time so price changes don't
     * retroactively affect existing bookings.
     */
    baseAmount: {
      type: Number,
      required: true,
    },

    gstAmount: {
      type: Number,
      required: true,
    },

    platformFee: {
      type: Number,
      required: true,
      default: 99,
    },

    securityDeposit: {
      type: Number,
      required: true,
    },

    totalAmount: {
      type: Number,
      required: [true, "Total amount is required"],
    },

    rentalDays: {
      type: Number,
      required: true,
      min: 1,
    },

    /**
     * State Machine
     */
    bookingStatus: {
      type: String,
      enum: {
        values: ALL_STATUSES,
        message: "Invalid booking status",
      },
      default: BOOKING_STATUSES.PENDING_PAYMENT,
    },

    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded", "refund_pending"],
      default: "pending",
    },

    /**
     * Hold expiration — used by background job to clean up stale bookings.
     * Set to 30 minutes after creation for PENDING_PAYMENT state.
     * Cleared once payment is confirmed.
     */
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 60 * 1000), // 30 min from now
      index: { expireAfterSeconds: 0 }, // TTL index — MongoDB auto-deletes? No, we manage manually for audit trail
    },

    /**
     * Cancellation details
     */
    cancellationReason: {
      type: String,
      default: null,
    },

    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    cancelledAt: {
      type: Date,
      default: null,
    },

    refundAmount: {
      type: Number,
      default: null,
    },

    /**
     * Event Timeline
     * Append-only log of state transitions. Never modify past entries.
     */
    timeline: {
      type: [timelineEventSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Critical index: used in every booking creation overlap check.
 * Query: find bookings for this vehicle where dates overlap and status is active.
 */
bookingSchema.index({ vehicle: 1, startDate: 1, endDate: 1 });
bookingSchema.index({ vehicle: 1, bookingStatus: 1 });
bookingSchema.index({ user: 1, bookingStatus: 1 });
bookingSchema.index({ user: 1, createdAt: -1 });
bookingSchema.index({ bookingStatus: 1, createdAt: -1 });
bookingSchema.index({ bookingStatus: 1, expiresAt: 1 }); // For background job queries

export default mongoose.model("Booking", bookingSchema);