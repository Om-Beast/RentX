import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      required: true,
    },

    startDate: {
      type: Date,
      required: true,
    },

    endDate: {
      type: Date,
      required: true,
    },

    totalPrice: {
      type: Number,
      required: true,
    },

   bookingStatus: {
  type: String,
  enum: [
    "pending_payment",
    "pending_owner_approval",
    "approved",
    "rejected",
    "cancelled",
    "completed"
  ],
  default: "pending_payment",
},

    paymentStatus: {
      type: String,
      enum: [
        "pending",
        "paid",
        "failed",
        "refunded"
      ],
      default: "pending",
    },
    timeline: [
  {
    eventType: {
      type: String,
      required: true,
    },

    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    note: String,

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
],
  },
  {
    timestamps: true,
  }
);

export default mongoose.model(
  "Booking",
  bookingSchema
);