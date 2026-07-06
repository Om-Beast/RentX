import mongoose from "mongoose";

export const TRUST_EVENT_TYPES = Object.freeze({
  BOOKING_COMPLETED: "BOOKING_COMPLETED",
  BOOKING_CANCELLED: "BOOKING_CANCELLED",
  LATE_RETURN: "LATE_RETURN",
  PAYMENT_SUCCESS: "PAYMENT_SUCCESS",
  PAYMENT_FAILED: "PAYMENT_FAILED",
  DAMAGE_REPORTED: "DAMAGE_REPORTED",
  OWNER_REVIEW: "OWNER_REVIEW",
  CUSTOMER_REVIEW: "CUSTOMER_REVIEW",
  LICENSE_VERIFIED: "LICENSE_VERIFIED",
  IDENTITY_VERIFIED: "IDENTITY_VERIFIED",
  ADMIN_OVERRIDE: "ADMIN_OVERRIDE",
});

const trustHistorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    eventType: {
      type: String,
      enum: Object.values(TRUST_EVENT_TYPES),
      required: true,
      index: true,
    },

    scoreDelta: {
      type: Number,
      required: true,
    },

    previousScore: {
      type: Number,
      required: true,
      min: 0,
    },

    newScore: {
      type: Number,
      required: true,
      min: 0,
    },

    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    reason: {
      type: String,
      required: true,
      trim: true,
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

trustHistorySchema.index({ user: 1, createdAt: -1 });

const TrustHistory =
  mongoose.models.TrustHistory ||
  mongoose.model("TrustHistory", trustHistorySchema);

export default TrustHistory;