/**
 * Vehicle model.
 *
 * Represents a rental listing in the RentX marketplace.
 *
 * Key design decisions:
 * - `type` supports the full vehicle category set (not just car/bike)
 * - `city` is the primary geographic filter for search
 * - `latitude`/`longitude` enable future geo-proximity queries
 * - `pricePerDay` (was rentPerDay) is the base daily rate; frontend always
 *   shows server-computed total (base + GST + platformFee + securityDeposit)
 * - `listingStatus` separates a listing's lifecycle from availability
 * - Compound indexes are designed around actual query patterns:
 *     search: { type, city, isAvailable, pricePerDay }
 *     owner views: { owner }
 *
 * Rating aggregation:
 * - `rating` and `reviewCount` are maintained by ReviewService.updateVehicleRating()
 * - Updated atomically with $inc on each new review — no N+1 recomputation
 */

import mongoose from "mongoose";

const VEHICLE_TYPES = [
  "car",
  "bike",
  "scooter",
  "suv",
  "sedan",
  "hatchback",
  "luxury",
  "ev",
  "other",
];

const FUEL_TYPES = ["petrol", "diesel", "electric", "hybrid", "cng"];
const TRANSMISSION_TYPES = ["manual", "automatic"];
const LISTING_STATUS = ["draft", "active", "paused", "deactivated"];

const vehicleSchema = new mongoose.Schema(
  {
    /**
     * Identity & Ownership
     */
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Vehicle must have an owner"],
      index: true,
    },

    /**
     * Core Listing Info
     */
    name: {
      type: String,
      required: [true, "Vehicle name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },

    brand: {
      type: String,
      required: [true, "Brand is required"],
      trim: true,
    },

    model: {
      type: String,
      required: [true, "Model is required"],
      trim: true,
    },

    year: {
      type: Number,
      required: [true, "Year is required"],
      min: [2000, "Year must be 2000 or later"],
      max: [new Date().getFullYear() + 1, "Year cannot be in the future"],
    },

    type: {
      type: String,
      enum: {
        values: VEHICLE_TYPES,
        message: `Vehicle type must be one of: ${VEHICLE_TYPES.join(", ")}`,
      },
      required: [true, "Vehicle type is required"],
      index: true,
    },

    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      minlength: [20, "Description must be at least 20 characters"],
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },

    /**
     * Pricing
     * pricePerDay is the BASE daily rate (before GST, platform fee, deposit).
     * The backend always computes the final payable amount — never trust frontend.
     */
    pricePerDay: {
      type: Number,
      required: [true, "Price per day is required"],
      min: [100, "Price per day must be at least ₹100"],
      index: true,
    },

    securityDeposit: {
      type: Number,
      default: 1000,
      min: [0, "Security deposit cannot be negative"],
    },

    /**
     * Technical Specifications
     */
    fuelType: {
      type: String,
      enum: {
        values: FUEL_TYPES,
        message: `Fuel type must be one of: ${FUEL_TYPES.join(", ")}`,
      },
      default: "petrol",
    },

    transmission: {
      type: String,
      enum: {
        values: TRANSMISSION_TYPES,
        message: "Transmission must be manual or automatic",
      },
      default: "manual",
    },

    seats: {
      type: Number,
      required: [true, "Number of seats is required"],
      min: [1, "Seats must be at least 1"],
      max: [50, "Seats cannot exceed 50"],
    },

    features: {
      type: [String],
      default: [],
    },

    /**
     * Location
     * city is used for primary filtering; lat/lng for future geo queries.
     */
    location: {
      type: String,
      required: [true, "Pickup location/address is required"],
      trim: true,
    },

    city: {
      type: String,
      required: [true, "City is required"],
      trim: true,
      index: true,
    },

    latitude: {
      type: Number,
      default: null,
    },

    longitude: {
      type: Number,
      default: null,
    },

    /**
     * Media
     */
    images: {
      type: [String],
      default: [],
      validate: {
        validator: (arr) => arr.length <= 10,
        message: "Cannot upload more than 10 images per vehicle",
      },
    },

    /**
     * Availability & Status
     * isAvailable: manual toggle by owner (e.g. temporarily unavailable for maintenance)
     * listingStatus: lifecycle state of the listing itself
     */
    isAvailable: {
      type: Boolean,
      default: true,
      index: true,
    },

    listingStatus: {
      type: String,
      enum: {
        values: LISTING_STATUS,
        message: `Listing status must be one of: ${LISTING_STATUS.join(", ")}`,
      },
      default: "active",
    },

    /**
     * Aggregated Rating
     * Maintained by ReviewService — not directly writable by users.
     * Updated atomically on each review submission.
     */
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },

    reviewCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    /**
     * Rules shown to renters during booking
     */
    rules: {
      type: String,
      default: "",
      maxlength: [1000, "Rules cannot exceed 1000 characters"],
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Compound index for the primary vehicle search query:
 * "Show me available SUVs in Delhi under ₹2000/day"
 */
vehicleSchema.index({ type: 1, city: 1, isAvailable: 1, pricePerDay: 1 });
vehicleSchema.index({ listingStatus: 1, isAvailable: 1 });
vehicleSchema.index({ rating: -1 });
vehicleSchema.index({ createdAt: -1 });

const Vehicle =
  mongoose.models.Vehicle || mongoose.model("Vehicle", vehicleSchema);

export { VEHICLE_TYPES, FUEL_TYPES, TRANSMISSION_TYPES };
export default Vehicle;