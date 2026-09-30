/**
 * migrateDemoImages.js — Upload legacy demo vehicle images to Cloudinary.
 *
 * SAFETY GUARANTEES:
 *  - Only targets vehicles with a `demoKey` field (12 demo vehicles)
 *  - Never calls deleteMany, updateMany, or modifies any other collection
 *  - Idempotent: already-Cloudinary URLs are skipped automatically
 *  - Partial-failure safe: saves each migrated image immediately so a restart
 *    resumes where it left off
 *  - A single failed image does NOT stop remaining images or vehicles
 *  - Never logs CLOUDINARY_API_SECRET
 *
 * Run:
 *   npm run migrate:demo-images
 *
 * Required env vars:
 *   MONGO_URI, CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
 */

import "dotenv/config";
import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";

// ─── Validate environment ─────────────────────────────────────────────────────
const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error("❌  MONGO_URI not set. Cannot connect to MongoDB.");
  process.exit(1);
}

const CLOUDINARY_OK =
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET;

if (!CLOUDINARY_OK) {
  console.error(
    "❌  Cloudinary credentials not configured.\n" +
      "    Required: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET"
  );
  process.exit(1);
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

console.log(`☁️  Cloudinary configured: cloud_name=${process.env.CLOUDINARY_CLOUD_NAME}`);

// ─── Inline schema (avoids model registration conflicts) ──────────────────────
const vehicleSchema = new mongoose.Schema(
  {
    owner: mongoose.Schema.Types.ObjectId,
    name: String,
    brand: String,
    type: String,
    city: String,
    images: [String],
    demoKey: { type: String, sparse: true },
    isAvailable: Boolean,
    listingStatus: String,
  },
  { timestamps: true }
);

const Vehicle =
  mongoose.models?.MigrateVehicle ||
  mongoose.model("MigrateVehicle", vehicleSchema, "vehicles");

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns true if the URL is already hosted on Cloudinary */
function isCloudinaryUrl(url) {
  return (
    typeof url === "string" &&
    (url.includes("res.cloudinary.com") || url.includes("cloudinary.com/"))
  );
}

/**
 * Upload a remote image URL to Cloudinary using remote fetch (no disk write).
 *
 * @param {string} sourceUrl  - Legacy URL to import
 * @param {string} vehicleId  - MongoDB _id string (used as folder name)
 * @param {number} index      - Image index within the vehicle (0-based)
 * @returns {Promise<string>} - Cloudinary secure_url
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
        crop: "limit",        // Never upscale
        quality: "auto:good",
        fetch_format: "auto", // WebP where supported
      },
    ],
    overwrite: false,         // Never re-upload if same public_id exists
  });

  return result.secure_url;
}

// ─── Main migration ───────────────────────────────────────────────────────────
async function migrateDemoImages() {
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🚗  RentX Demo Image Migration");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  await mongoose.connect(MONGO_URI);
  console.log("✅  Connected to MongoDB\n");

  // Only touch demo vehicles
  const demoVehicles = await Vehicle.find({ demoKey: { $exists: true, $ne: null } }).lean();

  if (demoVehicles.length === 0) {
    console.log("⚠️   No demo vehicles found (demoKey field missing). Run seed:demo first.");
    await mongoose.disconnect();
    return;
  }

  console.log(`📋  Found ${demoVehicles.length} demo vehicle(s) to process.\n`);

  const stats = {
    vehiclesScanned: demoVehicles.length,
    imagesScanned: 0,
    imagesMigrated: 0,
    imagesSkipped: 0,
    imagesFailed: 0,
  };

  for (const vehicle of demoVehicles) {
    const vehicleId = vehicle._id.toString();
    const label = `${vehicle.brand} ${vehicle.name} [${vehicle.demoKey}]`;
    console.log(`🔄  Processing: ${label}`);

    const images = vehicle.images ?? [];
    if (images.length === 0) {
      console.log(`     └─ No images. Skipping.\n`);
      continue;
    }

    const updatedImages = [...images];
    let vehicleModified = false;

    for (let i = 0; i < images.length; i++) {
      const url = images[i];
      stats.imagesScanned++;

      if (isCloudinaryUrl(url)) {
        console.log(`     [${i + 1}/${images.length}] ✓ Already Cloudinary — skipped`);
        stats.imagesSkipped++;
        continue;
      }

      console.log(`     [${i + 1}/${images.length}] ↑ Uploading: ${url.substring(0, 60)}...`);

      try {
        const cloudinaryUrl = await uploadRemoteImage(url, vehicleId, i);
        updatedImages[i] = cloudinaryUrl;
        vehicleModified = true;
        stats.imagesMigrated++;
        console.log(`     [${i + 1}/${images.length}] ✅ Done: ${cloudinaryUrl.substring(0, 60)}...`);

        // Save immediately — partial failures are resumable from where we left off
        await Vehicle.updateOne(
          { _id: vehicle._id },
          { $set: { images: updatedImages } }
        );
      } catch (err) {
        stats.imagesFailed++;
        console.error(`     [${i + 1}/${images.length}] ❌ Failed: ${err.message}`);
        // Continue processing remaining images
      }
    }

    if (vehicleModified) {
      console.log(`     └─ ✅ Vehicle updated in MongoDB.\n`);
    } else {
      console.log(`     └─ ✓ No changes needed.\n`);
    }
  }

  await mongoose.disconnect();

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📊  Migration Summary");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`   Vehicles scanned : ${stats.vehiclesScanned}`);
  console.log(`   Images scanned   : ${stats.imagesScanned}`);
  console.log(`   Images migrated  : ${stats.imagesMigrated}`);
  console.log(`   Images skipped   : ${stats.imagesSkipped}  (already Cloudinary)`);
  console.log(`   Images failed    : ${stats.imagesFailed}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  if (stats.imagesFailed > 0) {
    console.log(`⚠️   ${stats.imagesFailed} image(s) failed. Re-run to retry only failed images.`);
    process.exit(1);
  } else {
    console.log("✅  Migration complete — all images are now on Cloudinary.");
    process.exit(0);
  }
}

migrateDemoImages().catch((err) => {
  console.error("❌  Migration crashed:", err.message);
  process.exit(1);
});
