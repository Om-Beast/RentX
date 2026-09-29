/**
 * cloudinary.js — Cloudinary upload pipeline for RentX vehicle images.
 *
 * ARCHITECTURE:
 * Uses a custom multer StorageEngine that streams files via cloudinary v2's
 * upload_stream(). This removes the dependency on multer-storage-cloudinary
 * (which requires cloudinary@1.x and conflicts with the modern cloudinary@2.x SDK).
 *
 * Files are stored under: rentx/vehicles/<vehicleId>/
 *
 * Scoped to vehicleId (not ownerId) so that deleting a vehicle's images only
 * removes THAT vehicle's images. If two vehicles share an owner, deleting one
 * never touches the other's Cloudinary folder.
 *
 * GRACEFUL DEGRADATION:
 * If CLOUDINARY_* env vars are absent, upload endpoints return a clear
 * ConfigurationError. The marketplace continues to work with URL-based images.
 *
 * EXTERNAL SETUP REQUIRED:
 * Add to backend/.env:
 *   CLOUDINARY_CLOUD_NAME=your_cloud_name
 *   CLOUDINARY_API_KEY=your_api_key
 *   CLOUDINARY_API_SECRET=your_api_secret
 */

import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
import path from "path";
import { ExternalServiceError, ValidationError } from "./errors.js";
import logger from "./logger.js";

export const CLOUDINARY_CONFIGURED =
  !!(process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET);

if (CLOUDINARY_CONFIGURED) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  logger.info("Cloudinary", "CLOUDINARY_CONFIGURED", {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
  });
} else {
  logger.info("Cloudinary", "CLOUDINARY_NOT_CONFIGURED", {
    message:
      "Cloudinary credentials not found. Image upload endpoint unavailable. " +
      "Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in .env",
  });
}

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);
const ALLOWED_EXTENSIONS = /\.(jpg|jpeg|png|webp)$/i;
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_FILES_PER_REQUEST = 10;

/**
 * Custom multer StorageEngine that streams files directly to Cloudinary.
 * Satisfies the multer StorageEngine contract:
 *   _handleFile(req, file, cb)
 *   _removeFile(req, file, cb)
 */
class CloudinaryStreamStorage {
  constructor(vehicleId) {
    this.vehicleId = String(vehicleId);
  }

  _handleFile(_req, file, cb) {
    // Generate a stable, filesystem-safe public_id
    const sanitizedName = path
      .basename(file.originalname)
      .replace(/[^a-zA-Z0-9.-]/g, "_")
      .replace(/\.[^.]+$/, ""); // strip extension — Cloudinary adds it

    const uploadOptions = {
      folder: `rentx/vehicles/${this.vehicleId}`,
      public_id: `${Date.now()}_${sanitizedName}`,
      resource_type: "image",
      allowed_formats: ["jpg", "jpeg", "png", "webp"],
      transformation: [
        {
          width: 1200,
          height: 800,
          crop: "limit",       // never upscale, only downscale to fit
          quality: "auto:good",
          fetch_format: "auto", // serve WebP to supported browsers
        },
      ],
    };

    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          return cb(new ExternalServiceError(`Cloudinary upload failed: ${error.message}`));
        }
        // Attach result fields to the multer file object
        cb(null, {
          path: result.secure_url,     // used as image URL in Vehicle.images[]
          filename: result.public_id,  // used for targeted deletion
          size: result.bytes,
          width: result.width,
          height: result.height,
          format: result.format,
        });
      }
    );

    // Pipe the incoming multipart file stream into Cloudinary
    file.stream.pipe(uploadStream);
  }

  _removeFile(_req, file, cb) {
    // If the upload completed, attempt cleanup on rollback
    if (file.filename) {
      cloudinary.uploader.destroy(file.filename, (err) => cb(err || null));
    } else {
      cb(null);
    }
  }
}

/**
 * Creates a multer middleware instance scoped to a specific vehicle.
 *
 * IMPORTANT: Ownership authorization must be checked BEFORE calling this
 * middleware — the controller verifies ownership before calling createVehicleUploadMiddleware.
 *
 * @param {string} vehicleId — MongoDB ObjectId of the vehicle (as string)
 * @returns {import("multer").Multer} multer middleware
 */
export function createVehicleUploadMiddleware(vehicleId) {
  if (!CLOUDINARY_CONFIGURED) {
    return (_req, _res, next) =>
      next(
        new ExternalServiceError(
          "Image upload is not available. Cloudinary credentials are not configured on this server. " +
            "Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET to backend/.env"
        )
      );
  }

  const fileFilter = (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      return cb(
        new ValidationError(
          `Invalid file type: ${file.mimetype}. Only JPG, PNG, and WebP images are allowed.`
        )
      );
    }
    if (!ALLOWED_EXTENSIONS.test(file.originalname)) {
      return cb(
        new ValidationError(
          `Invalid file extension. Only .jpg, .jpeg, .png, .webp are accepted.`
        )
      );
    }
    cb(null, true);
  };

  return multer({
    storage: new CloudinaryStreamStorage(vehicleId),
    fileFilter,
    limits: {
      fileSize: MAX_FILE_SIZE_BYTES,
      files: MAX_FILES_PER_REQUEST,
    },
  });
}

/**
 * Delete a single image from Cloudinary by its publicId.
 * Called when an owner removes a specific image from a vehicle.
 *
 * @param {string} publicId — Cloudinary public_id (e.g. "rentx/vehicles/abc123/1234_car")
 */
export async function deleteCloudinaryImage(publicId) {
  if (!CLOUDINARY_CONFIGURED) {
    logger.info("Cloudinary", "DELETE_SKIPPED_NOT_CONFIGURED", { publicId });
    return { result: "skipped" };
  }
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    logger.info("Cloudinary", "IMAGE_DELETED", { publicId, result: result.result });
    return result;
  } catch (err) {
    logger.error("Cloudinary", "DELETE_FAILED", { publicId, error: err.message });
    throw new ExternalServiceError(`Failed to delete image from Cloudinary: ${err.message}`);
  }
}

/**
 * Delete ALL images in a specific vehicle's Cloudinary folder.
 * Scoped to rentx/vehicles/<vehicleId>/ — never touches other vehicles' images.
 * Called when a vehicle is deleted.
 *
 * @param {string} vehicleId — MongoDB ObjectId of the vehicle being deleted
 */
export async function deleteVehicleImages(vehicleId) {
  if (!CLOUDINARY_CONFIGURED) return { result: "skipped" };
  try {
    const prefix = `rentx/vehicles/${vehicleId}`;
    const result = await cloudinary.api.delete_resources_by_prefix(prefix);
    logger.info("Cloudinary", "VEHICLE_IMAGES_DELETED", { vehicleId, prefix, result });
    return result;
  } catch (err) {
    // Non-fatal — orphaned images can be cleaned up later via Cloudinary console
    logger.error("Cloudinary", "VEHICLE_IMAGES_DELETE_FAILED", { vehicleId, error: err.message });
  }
}

/**
 * Normalize a multer file object (from CloudinaryStreamStorage) into the
 * standard image record shape stored in Vehicle.images[].
 *
 * @param {object} file — multer file with Cloudinary fields attached
 * @returns {{ url: string, publicId: string, width: number|null, height: number|null }}
 */
export function normalizeCloudinaryFile(file) {
  return {
    url: file.path,
    publicId: file.filename,
    width: file.width ?? null,
    height: file.height ?? null,
  };
}

export default cloudinary;
