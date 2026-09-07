/**
 * User model.
 *
 * Represents all platform participants: customers, fleet owners, and admins.
 *
 * Trust Score:
 * - Range: 0–1000 (integer)
 * - New users start at 500 (neutral)
 * - Increases for positive actions (completed bookings, verified documents)
 * - Decreases for negative actions (cancellations, payment failures, late returns)
 * - Used by the risk engine to classify users and inform booking decisions
 *
 * Indexes:
 * - email: unique index (enforced by schema)
 * - role: for admin queries filtering by role
 * - createdAt: for sorting/analytics
 */

import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [100, "Name cannot exceed 100 characters"],
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
    },

    role: {
      type: String,
      enum: {
        values: ["CUSTOMER", "FLEET_OWNER", "ADMIN"],
        message: "Role must be CUSTOMER, FLEET_OWNER, or ADMIN",
      },
      default: "CUSTOMER",
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    isSuspended: {
      type: Boolean,
      default: false,
    },

    /**
     * Trust score: 0–1000.
     * New users start at 500 (neutral baseline).
     * The TrustService manages all score mutations — never update directly.
     */
    trustScore: {
      type: Number,
      default: 500,
      min: [0, "Trust score cannot be negative"],
      max: [1000, "Trust score cannot exceed 1000"],
    },

    phone: {
      type: String,
      trim: true,
      default: null,
    },

    profileImage: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Explicit index declarations for query performance
userSchema.index({ role: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ trustScore: 1 });

const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;