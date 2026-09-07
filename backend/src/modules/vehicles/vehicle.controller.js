import Vehicle, { VEHICLE_TYPES, FUEL_TYPES, TRANSMISSION_TYPES } from "../../models/Vehicle.js";
import { addVehicleService, getAllVehiclesService } from "./vehicle.service.js";
import { AuthorizationError, NotFoundError, ValidationError } from "../../utils/errors.js";
import logger from "../../utils/logger.js";

/** Fields a fleet owner is allowed to update on their vehicle listing */
const ALLOWED_UPDATE_FIELDS = [
  "name", "brand", "model", "year", "type", "description",
  "pricePerDay", "securityDeposit", "fuelType", "transmission",
  "seats", "features", "location", "city", "latitude", "longitude",
  "images", "isAvailable", "listingStatus", "rules",
];

export const addVehicle = async (req, res, next) => {
  try {
    const vehicle = await addVehicleService(req.body, req.user._id);
    logger.info("VehicleController", "VEHICLE_CREATED", {
      vehicleId: vehicle._id,
      ownerId: req.user._id,
    });
    res.status(201).json({ success: true, vehicle });
  } catch (error) {
    next(error);
  }
};

export const getAllVehicles = async (req, res, next) => {
  try {
    const result = await getAllVehiclesService(req.query);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

export const getVehicleById = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id).populate(
      "owner",
      "name email trustScore createdAt"
    );
    if (!vehicle) throw new NotFoundError("Vehicle not found");
    res.status(200).json({ success: true, vehicle });
  } catch (error) {
    next(error);
  }
};

export const getMyVehicles = async (req, res, next) => {
  try {
    const vehicles = await Vehicle.find({ owner: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: vehicles.length, vehicles });
  } catch (error) {
    next(error);
  }
};

export const deleteVehicle = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) throw new NotFoundError("Vehicle not found");
    if (vehicle.owner.toString() !== req.user._id.toString()) {
      throw new AuthorizationError("You can only delete your own vehicles");
    }

    await Vehicle.findByIdAndDelete(req.params.id);
    logger.info("VehicleController", "VEHICLE_DELETED", {
      vehicleId: req.params.id,
      ownerId: req.user._id,
    });
    res.status(200).json({ success: true, message: "Vehicle deleted successfully" });
  } catch (error) {
    next(error);
  }
};

export const toggleVehicleAvailability = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) throw new NotFoundError("Vehicle not found");
    if (vehicle.owner.toString() !== req.user._id.toString()) {
      throw new AuthorizationError("You can only update your own vehicles");
    }

    vehicle.isAvailable = !vehicle.isAvailable;
    await vehicle.save();
    res.status(200).json({ success: true, isAvailable: vehicle.isAvailable });
  } catch (error) {
    next(error);
  }
};

export const updateVehicle = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) throw new NotFoundError("Vehicle not found");
    if (vehicle.owner.toString() !== req.user._id.toString() && req.user.role !== "ADMIN") {
      throw new AuthorizationError("You can only update your own vehicles");
    }

    // SECURITY: only allow whitelisted fields — prevents owner/id injection
    const updates = {};
    for (const field of ALLOWED_UPDATE_FIELDS) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      throw new ValidationError("No valid fields provided for update");
    }

    const updatedVehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    logger.info("VehicleController", "VEHICLE_UPDATED", {
      vehicleId: req.params.id,
      updatedFields: Object.keys(updates),
    });

    res.status(200).json({ success: true, vehicle: updatedVehicle });
  } catch (error) {
    next(error);
  }
};
