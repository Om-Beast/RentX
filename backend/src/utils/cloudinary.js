/**
 * cloudinary.js — Cloudinary upload pipeline for RentX vehicle images.
 *
 * ARCHITECTURE:
 * - multer handles multipart/form-data parsing in memory (no local disk write)
 * - multer-storage-cloudinary streams directly from memory to Cloudinary
 * - Files are stored under: rentx/vehicles/<ownerId>/
 * - MIME validation: only image/jpeg, image/png, image/webp
 * - Size limit: 5MB per file
 * - Count limit: max 10 files per upload (enforced at middleware level)
 *
 * GRACEFUL DEGRADATION:
 * If CLOUDINARY_CLOUD_NAME is not set, the middleware still loads but
 * upload attempts will throw a clear ConfigurationError.
 * This allows the app to start and serve URL-based images (seed data)
 * even without Cloudinary credentials configured.
 *
 * EXTERNAL SETUP REQUIRED:
 * Add to backend/.env:
 *   CLOUDINARY_CLOUD_NAME=your_cloud_name
 *   CLOUDINARY_API_KEY=your_api_key
 *   CLOUDINARY_API_SECRET=your_api_secret
 */

import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";
import { ExternalServiceError, ValidationError } from "./errors.js";
import logger from "./logger.js";

const CLOUDINARY_CONFIGURED =
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

/**
 * Allowed MIME types and extensions for vehicle images.
 * Checked at two points:
 * 1. multer fileFilter (early rejection before stream)
 * 2. Cloudinary transformation settings (additional server-side validation)
 */
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const ALLOWED_EXTENSIONS = /\.(jpg|jpeg|png|webp)$/i;
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const MAX_FILES_PER_REQUEST = 10;

/**
 * Factory: creates a multer instance for a specific vehicle owner.
 * The ownerId is embedded in the Cloudinary folder path for organization.
 *
 * @param {string} ownerId — MongoDB ObjectId of the vehicle owner
 * @returns multer middleware instance
 */
export function createVehicleUploadMiddleware(ownerId) {
  if (!CLOUDINARY_CONFIGURED) {
    // Return a middleware that immediately throws a clear error
    return (_req, _res, next) => {
      next(
        new ExternalServiceError(
          "Image upload is not available. " +
            "Cloudinary credentials are not configured on this server. " +
            "Please add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET to environment."
        )
      );
    };
  }

  const storage = new CloudinaryStorage({
    cloudinary,
    params: async (_req, file) => {
      // Generate a stable public_id: ownerId + timestamp + original name (sanitized)
      const sanitizedName = file.originalname
        .replace(/[^a-zA-Z0-9.-]/g, "_")
        .replace(/\.[^.]+$/, ""); // strip extension — Cloudinary adds it

      return {
        folder: `rentx/vehicles/${ownerId}`,
        public_id: `${Date.now()}_${sanitizedName}`,
        allowed_formats: ["jpg", "jpeg", "png", "webp"],
        transformation: [
          {
            width: 1200,
            height: 800,
            crop: "limit", // never upscale, only downscale
            quality: "auto:good",
            fetch_format: "auto", // WebP where supported
          },
        ],
        // Cloudinary resource type
        resource_type: "image",
      };
    },
  });

  const fileFilter = (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return cb(
        new ValidationError(
          `Invalid file type: ${file.mimetype}. Only JPG, PNG and WebP images are allowed.`
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
    storage,
    fileFilter,
    limits: {
      fileSize: MAX_FILE_SIZE_BYTES, // per-file limit
      files: MAX_FILES_PER_REQUEST,
    },
  });
}

/**
 * Delete a specific image from Cloudinary by its publicId.
 * Called when an owner replaces or removes an image.
 *
 * @param {string} publicId — Cloudinary public_id (e.g. "rentx/vehicles/abc123/1234_car")
 * @returns {object} Cloudinary deletion result
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
 * Delete all images in a vehicle's Cloudinary folder.
 * Called when a vehicle is deleted.
 *
 * @param {string} ownerId
 * @param {string} vehiclePublicIdPrefix — e.g. "rentx/vehicles/abc123"
 */
export async function deleteVehicleImages(ownerId) {
  if (!CLOUDINARY_CONFIGURED) return { result: "skipped" };
  try {
    const prefix = `rentx/vehicles/${ownerId}`;
    const result = await cloudinary.api.delete_resources_by_prefix(prefix);
    logger.info("Cloudinary", "VEHICLE_IMAGES_DELETED", { ownerId, result });
    return result;
  } catch (err) {
    // Non-fatal — log and continue. Orphaned images can be cleaned up later.
    logger.error("Cloudinary", "VEHICLE_IMAGES_DELETE_FAILED", { ownerId, error: err.message });
  }
}

/**
 * Transform a multer-cloudinary file object into the normalized image record
 * we store in the Vehicle model's images array.
 *
 * This provides a consistent shape regardless of whether images are from
 * Cloudinary uploads or URL strings (seed data).
 *
 * @param {object} file — multer file object from cloudinary storage
 * @returns {{ url: string, publicId: string, width: number, height: number }}
 */
export function normalizeCloudinaryFile(file) {
  return {
    url: file.path,         // Cloudinary secure URL
    publicId: file.filename, // Cloudinary public_id
    width: file.width ?? null,
    height: file.height ?? null,
  };
}

export { CLOUDINARY_CONFIGURED };
export default cloudinary;
