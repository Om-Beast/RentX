import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["CUSTOMER", "FLEET_OWNER"],
      default: "CUSTOMER",
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    trustScore: {
      type: Number,
      default: 100,
    },
  },
  {
    timestamps: true,
  }
);

const User =
  mongoose.models.User ||
  mongoose.model("User", userSchema);
  console.log("USER MODEL LOADED");

export default User;