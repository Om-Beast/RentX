/**
 * migrateDemoImages.js — Server-integrated one-time migration runner.
 *
 * Triggered ONLY when: RUN_DEMO_IMAGE_MIGRATION=true in environment.
 * Never runs on normal startup.
 * Runs asynchronously — does NOT block HTTP server startup.
 * Never crashes the server on failure.
 * Idempotent: already-Cloudinary URLs are skipped automatically.
 *
 * Usage (Render environment variables):
 *   1. Add:    RUN_DEMO_IMAGE_MIGRATION=true  → Deploy/restart
 *   2. Check logs for migration summary
 *   3. Remove: RUN_DEMO_IMAGE_MIGRATION       → Deploy/restart (normal boot)
 */

import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";
import logger from "../utils/logger.js";
import { CLOUDINARY_CONFIGURED } from "../utils/cloudinary.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isCloudinaryUrl(url) {
  return (
    typeof url === "string" &&
    (url.includes("res.cloudinary.com") || url.includes("cloudinary.com/"))
  );
}

/**
 * Upload a remote image to Cloudinary using remote fetch (no disk I/O).
 * Applies production-grade transformations on ingest.
 */
async function uploadRemoteImage(sourceUrl, vehicleId, index) {
  const publicId = `${vehicleId}_img${index}_${Date.now()}`;
  const result = await cloudinary.uploader.upload(sourceUrl, {
    folder: `rentx/vehicles/${vehicleId}`,
    public_id: publicId,
    resource_type: "image",
    transformation: [
      {
        width: 1200,
        height: 800,
        crop: "limit",
        quality: "auto:good",
        fetch_format: "auto",
      },
    ],
    overwrite: false,
  });
  return result.secure_url;
}

// ─── Migration runner ─────────────────────────────────────────────────────────

/**
 * Run the demo image migration.
 * Called from server.js after HTTP server is ready.
 * All errors are caught — this function NEVER throws.
 */
export async function runDemoImageMigration() {
  logger.info("Migration", "DEMO_IMAGE_MIGRATION_START", {
    message: "Starting demo image migration. Triggered by RUN_DEMO_IMAGE_MIGRATION=true",
  });

  if (!CLOUDINARY_CONFIGURED) {
    logger.error("Migration", "DEMO_IMAGE_MIGRATION_ABORTED", {
      reason: "Cloudinary credentials not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET.",
    });
    return;
  }

  try {
    // Inline schema — avoids circular imports and model re-registration in ESM
    const vehicleSchema = new mongoose.Schema(
      {
        owner: mongoose.Schema.Types.ObjectId,
        name: String,
        brand: String,
        images: [String],
        demoKey: { type: String, sparse: true },
      },
      { timestamps: true }
    );

    // Use a unique model name to avoid conflicts with the main Vehicle model
    const MigrateVehicle =
      mongoose.models.MigrateVehicle ||
      mongoose.model("MigrateVehicle", vehicleSchema, "vehicles");

    // Only target demo vehicles — never modifies unrelated vehicles
    const demoVehicles = await MigrateVehicle.find({
      demoKey: { $exists: true, $ne: null },
    }).lean();

    if (demoVehicles.length === 0) {
      logger.warn("Migration", "DEMO_IMAGE_MIGRATION_NO_VEHICLES", {
        message: "No vehicles with demoKey found. Run seed:demo first.",
      });
      return;
    }

    logger.info("Migration", "DEMO_IMAGE_MIGRATION_VEHICLES_FOUND", {
      count: demoVehicles.length,
    });

    const stats = {
      vehiclesScanned: demoVehicles.length,
      imagesScanned: 0,
      imagesMigrated: 0,
      imagesSkipped: 0,
      imagesFailed: 0,
    };

    for (const vehicle of demoVehicles) {
      const vehicleId = vehicle._id.toString();
      const images = vehicle.images ?? [];

      logger.info("Migration", "PROCESSING_VEHICLE", {
        vehicleId,
        demoKey: vehicle.demoKey,
        imageCount: images.length,
      });

      const updatedImages = [...images];

      for (let i = 0; i < images.length; i++) {
        const url = images[i];
        stats.imagesScanned++;

        if (isCloudinaryUrl(url)) {
          stats.imagesSkipped++;
          logger.info("Migration", "IMAGE_SKIPPED", {
            vehicleId,
            index: i,
            reason: "already_cloudinary",
          });
          continue;
        }

        try {
          logger.info("Migration", "IMAGE_UPLOAD_START", { vehicleId, index: i });
          const cloudinaryUrl = await uploadRemoteImage(url, vehicleId, i);
          updatedImages[i] = cloudinaryUrl;
          stats.imagesMigrated++;

          // Save immediately so restarts resume from where we left off
          await MigrateVehicle.updateOne(
            { _id: vehicle._id },
            { $set: { images: updatedImages } }
          );

          logger.info("Migration", "IMAGE_UPLOAD_SUCCESS", {
            vehicleId,
            index: i,
            cloudinaryUrl,
          });
        } catch (err) {
          stats.imagesFailed++;
          logger.error("Migration", "IMAGE_UPLOAD_FAILED", {
            vehicleId,
            index: i,
            error: err.message,
          });
          // Continue processing remaining images even when one fails
        }
      }
    }

    // Final summary in logs
    logger.info("Migration", "DEMO_IMAGE_MIGRATION_COMPLETE", {
      vehiclesScanned: stats.vehiclesScanned,
      imagesScanned: stats.imagesScanned,
      imagesMigrated: stats.imagesMigrated,
      imagesSkipped: stats.imagesSkipped,
      imagesFailed: stats.imagesFailed,
      status: stats.imagesFailed === 0 ? "SUCCESS" : "PARTIAL_FAILURE",
    });

    if (stats.imagesFailed > 0) {
      logger.warn("Migration", "DEMO_IMAGE_MIGRATION_PARTIAL", {
        message: `${stats.imagesFailed} image(s) failed. Set RUN_DEMO_IMAGE_MIGRATION=true and restart to retry.`,
      });
    }
  } catch (err) {
    // Catch-all: never crash the server
    logger.error("Migration", "DEMO_IMAGE_MIGRATION_CRASHED", {
      error: err.message,
      stack: err.stack,
    });
  }
}
