import Vehicle, { VEHICLE_TYPES, FUEL_TYPES, TRANSMISSION_TYPES } from "../../models/Vehicle.js";
import { addVehicleService, getAllVehiclesService } from "./vehicle.service.js";
import { AuthorizationError, NotFoundError, ValidationError } from "../../utils/errors.js";
import logger from "../../utils/logger.js";
import {
  createVehicleUploadMiddleware,
  deleteCloudinaryImage,
  CLOUDINARY_CONFIGURED,
} from "../../utils/cloudinary.js";

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

/**
 * POST /api/vehicles/:id/images
 * Upload vehicle images via Cloudinary.
 *
 * Two-phase approach:
 * 1. Ownership check (cheap DB read) BEFORE multer/Cloudinary processing
 * 2. Multer + Cloudinary storage streams files to CDN
 * 3. URLs appended to vehicle.images array
 *
 * This prevents unauthorized uploads consuming Cloudinary bandwidth/credits.
 */
export const uploadVehicleImages = async (req, res, next) => {
  try {
    // Phase 1: ownership check BEFORE processing files
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) throw new NotFoundError("Vehicle not found");
    if (
      vehicle.owner.toString() !== req.user._id.toString() &&
      req.user.role !== "ADMIN"
    ) {
      throw new AuthorizationError("You can only upload images to your own vehicles");
    }

    // Enforce per-vehicle limit (existing + incoming)
    const MAX_IMAGES = 10;
    const currentCount = vehicle.images?.length ?? 0;
    if (currentCount >= MAX_IMAGES) {
      throw new ValidationError(
        `Vehicle already has ${currentCount} images. Maximum is ${MAX_IMAGES}. Remove some before adding more.`
      );
    }

    // Phase 2: run multer (dynamic per ownerId for folder organisation)
    const uploadMiddleware = createVehicleUploadMiddleware(req.user._id.toString());
    const multerFields = uploadMiddleware.array("images", MAX_IMAGES - currentCount);

    await new Promise((resolve, reject) => {
      multerFields(req, res, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });

    if (!req.files || req.files.length === 0) {
      throw new ValidationError("No files received. Send images as multipart/form-data with field name 'images'.");
    }

    // Phase 3: extract URLs and append to vehicle
    const newUrls = req.files.map((f) => f.path); // Cloudinary secure_url is in file.path
    const updatedImages = [...(vehicle.images || []), ...newUrls].slice(0, MAX_IMAGES);

    const updated = await Vehicle.findByIdAndUpdate(
      req.params.id,
      { $set: { images: updatedImages } },
      { new: true }
    );

    logger.info("VehicleController", "IMAGES_UPLOADED", {
      vehicleId: req.params.id,
      count: req.files.length,
      cloudinaryConfigured: CLOUDINARY_CONFIGURED,
    });

    res.status(200).json({
      success: true,
      message: `${req.files.length} image(s) uploaded successfully`,
      images: updated.images,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/vehicles/:id/images/:publicId
 * Remove a single image from a vehicle.
 *
 * publicId must be URL-encoded (slashes → %2F).
 * Example: DELETE /api/vehicles/abc/images/rentx%2Fvehicles%2Fabc%2F1234_car
 */
export const deleteVehicleImage = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) throw new NotFoundError("Vehicle not found");
    if (
      vehicle.owner.toString() !== req.user._id.toString() &&
      req.user.role !== "ADMIN"
    ) {
      throw new AuthorizationError("You can only manage images on your own vehicles");
    }

    const publicId = decodeURIComponent(req.params.publicId);

    // The publicId can be embedded in the URL or be the URL itself
    // Remove both exact URL matches and publicId matches from the array
    const updatedImages = (vehicle.images || []).filter(
      (img) => img !== publicId && !img.includes(publicId)
    );

    if (updatedImages.length === vehicle.images.length) {
      throw new NotFoundError("Image not found on this vehicle");
    }

    await Vehicle.findByIdAndUpdate(req.params.id, { $set: { images: updatedImages } });

    // Best-effort Cloudinary deletion (non-fatal)
    await deleteCloudinaryImage(publicId).catch((err) => {
      logger.error("VehicleController", "CLOUDINARY_DELETE_FAILED", {
        vehicleId: req.params.id,
        publicId,
        error: err.message,
      });
    });

    res.status(200).json({
      success: true,
      message: "Image removed",
      images: updatedImages,
    });
  } catch (error) {
    next(error);
  }
};
