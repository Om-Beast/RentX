import mongoose from "mongoose";
import {
  RISK_LEVELS,
  RECOMMENDATIONS,
} from "../config/riskWeights.js";

const riskFactorSchema = new mongoose.Schema(
  {
    factor: {
      type: String,
      required: true,
    },
    score: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    weight: {
      type: Number,
      required: true,
    },
    weightedScore: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
  },
  { _id: false }
);

const inputSignalsSchema = new mongoose.Schema(
  {
    trustScore: Number,
    totalBookings: Number,
    completedBookings: Number,
    cancelledBookings: Number,
    cancellationRate: Number,
    lateReturns: Number,
    lateReturnRate: Number,
    paymentDefaults: Number,
    paymentReliabilityScore: Number,
    averageReviewScore: Number,
    totalReviews: Number,
    vehicleCategory: String,
    bookingDurationDays: Number,
    rentalAmount: Number,
    isNewCustomer: Boolean,
    isPeakSeason: Boolean,
    isWeekendBooking: Boolean,
  },
  { _id: false }
);

const bookingRiskSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
      index: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      required: true,
    },

    fleetOwnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    riskLevel: {
      type: String,
      enum: Object.values(RISK_LEVELS),
      required: true,
      index: true,
    },

    riskScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },

    confidenceScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },

    recommendation: {
      type: String,
      enum: Object.values(RECOMMENDATIONS),
      required: true,
    },

    riskFactors: {
      type: [riskFactorSchema],
      default: [],
    },

    inputSignals: {
      type: inputSignalsSchema,
      required: true,
    },

    explanation: {
      type: String,
      required: true,
    },

    explanationSource: {
      type: String,
      enum: ["GEMINI", "TEMPLATE_FALLBACK"],
      default: "TEMPLATE_FALLBACK",
    },

    processingTimeMs: {
      type: Number,
      default: 0,
    },

    modelVersion: {
      type: String,
      default: "1.0.0",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

bookingRiskSchema.index({
  fleetOwnerId: 1,
  createdAt: -1,
});

bookingRiskSchema.index({
  riskLevel: 1,
  createdAt: -1,
});

bookingRiskSchema.index({
  bookingId: 1,
});

export default mongoose.models.BookingRisk ||
mongoose.model("BookingRisk", bookingRiskSchema);