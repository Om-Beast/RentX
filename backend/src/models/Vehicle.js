import mongoose from "mongoose";

const vehicleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    brand: {
      type: String,
      required: true,
    },

    type: {
      type: String,
      enum: ["car", "bike"],
      required: true,
    },

    model: {
      type: String,
      required: true,
    },

    year: {
      type: Number,
      required: true,
    },

    rentPerDay: {
      type: Number,
      required: true,
    },

    fuelType: {
      type: String,
      enum: ["petrol", "diesel", "electric", "hybrid"],
    },

    transmission: {
      type: String,
      enum: ["manual", "automatic"],
    },

    description: {
  type: String,
  required: true,
  },

  location: {
    type: String,
    required: true,
  },

  seats: {
    type: Number,
    required: true,
  },

  rating: {
    type: Number,
    default: 0,
  },

  totalReviews: {
    type: Number,
    default: 0,
  },

    images: [String],
    owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const Vehicle =
  mongoose.models.Vehicle ||
  mongoose.model("Vehicle", vehicleSchema);

export default Vehicle;