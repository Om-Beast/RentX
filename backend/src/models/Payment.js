import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    amount: {
      type: Number,
      required: true,
    },

    currency: {
      type: String,
      default: "INR",
    },

    razorpayOrderId: {
        type: String,
        unique: true,
        sparse: true,
        },

    razorpayPaymentId: {
      type: String,
      default: null,
      unique: true,
      sparse: true,
    },

    idempotencyKey: {
      type: String,
      unique: true,
      sparse: true,
    },

    status: {
      type: String,
      enum: [
        "created",
        "paid",
        "failed",
        "refunded",
      ],
      default: "created",
    },

    errorDescription: {
      type: String,
      default: null,
    },

    paidAt: {
      type: Date,
      default: null,
    },
    refundDetails: {
        refundId: String,
        refundAmount: Number,
        refundReason: String,
        refundedAt: Date,
        },
  },
  {
    timestamps: true,
  }
);

paymentSchema.index({ booking: 1 });

paymentSchema.index({ user: 1 });

paymentSchema.index({ status: 1 });

paymentSchema.set("autoIndex", false);



export default mongoose.model(
  "Payment",
  paymentSchema
);