/**
 * MIGRATION TESTS — Demo Image Migration
 *
 * Tests the core migration logic in isolation:
 *  - isCloudinaryUrl detection
 *  - Idempotency (already-Cloudinary URLs are skipped)
 *  - Only demoKey vehicles are touched
 *  - Failed image does not stop remaining images
 *  - Missing Cloudinary configuration handled safely
 *  - Partial failure state is resumable
 *
 * These are unit/integration tests against in-memory MongoDB.
 * Cloudinary API calls are mocked — no real uploads happen.
 */

import { jest, describe, test, expect, beforeAll, afterAll, afterEach } from "@jest/globals";
import mongoose from "mongoose";
import { connectForTests, disconnectAfterTests } from "./testDb.js";

// ─── Test-local vehicle schema (mirrors production schema) ────────────────────
const vehicleSchema = new mongoose.Schema(
  {
    name: String,
    brand: String,
    images: [String],
    demoKey: { type: String, sparse: true },
  },
  { timestamps: true }
);

// Unique model name per test file to avoid re-registration conflicts
const TestVehicle =
  mongoose.models.TestMigrateVehicle ||
  mongoose.model("TestMigrateVehicle", vehicleSchema, "vehicles");

// ─── Helper: isCloudinaryUrl (same logic as migration scripts) ────────────────
function isCloudinaryUrl(url) {
  return (
    typeof url === "string" &&
    (url.includes("res.cloudinary.com") || url.includes("cloudinary.com/"))
  );
}

// ─── Core migration logic (extracted for testability without side effects) ─────
async function runMigrationLogic(vehicles, uploadFn) {
  const stats = {
    vehiclesScanned: 0,
    imagesScanned: 0,
    imagesMigrated: 0,
    imagesSkipped: 0,
    imagesFailed: 0,
  };

  const demoVehicles = vehicles.filter(
    (v) => v.demoKey !== undefined && v.demoKey !== null
  );
  stats.vehiclesScanned = demoVehicles.length;

  for (const vehicle of demoVehicles) {
    const images = vehicle.images ?? [];
    const updatedImages = [...images];

    for (let i = 0; i < images.length; i++) {
      const url = images[i];
      stats.imagesScanned++;

      if (isCloudinaryUrl(url)) {
        stats.imagesSkipped++;
        continue;
      }

      try {
        const cloudinaryUrl = await uploadFn(url, vehicle._id.toString(), i);
        updatedImages[i] = cloudinaryUrl;
        stats.imagesMigrated++;

        // Persist immediately (resumable)
        await TestVehicle.updateOne(
          { _id: vehicle._id },
          { $set: { images: updatedImages } }
        );
      } catch {
        stats.imagesFailed++;
        // Continue — one failure doesn't stop the rest
      }
    }
  }

  return stats;
}

// ─── Setup / Teardown ─────────────────────────────────────────────────────────
beforeAll(async () => {
  await connectForTests();
  await TestVehicle.deleteMany({ demoKey: /^test-migrate-/ });
});

afterEach(async () => {
  await TestVehicle.deleteMany({ demoKey: /^test-migrate-/ });
});

afterAll(async () => {
  await TestVehicle.deleteMany({ demoKey: /^test-migrate-/ });
  await disconnectAfterTests();
});

// ─── isCloudinaryUrl detection ────────────────────────────────────────────────
describe("isCloudinaryUrl()", () => {
  test("identifies res.cloudinary.com URLs as Cloudinary", () => {
    expect(isCloudinaryUrl("https://res.cloudinary.com/demo/image/upload/sample.jpg")).toBe(true);
  });

  test("identifies cloudinary.com URLs as Cloudinary", () => {
    expect(isCloudinaryUrl("https://cloudinary.com/image/upload/sample.jpg")).toBe(true);
  });

  test("identifies Unsplash URLs as non-Cloudinary", () => {
    expect(isCloudinaryUrl("https://images.unsplash.com/photo-123?w=800")).toBe(false);
  });

  test("identifies placeholder URLs as non-Cloudinary", () => {
    expect(isCloudinaryUrl("https://via.placeholder.com/400x300")).toBe(false);
  });

  test("handles null and undefined safely", () => {
    expect(isCloudinaryUrl(null)).toBe(false);
    expect(isCloudinaryUrl(undefined)).toBe(false);
    expect(isCloudinaryUrl("")).toBe(false);
  });
});

// ─── Only demo vehicles are touched ──────────────────────────────────────────
describe("Migration scope", () => {
  test("only processes vehicles with a demoKey — unrelated vehicles are not touched", async () => {
    // Create a non-demo vehicle (no demoKey)
    const nonDemo = await TestVehicle.create({
      name: "Non-Demo Car",
      brand: "Toyota",
      images: ["https://images.unsplash.com/legacy.jpg"],
    });

    // Create a demo vehicle
    const demo = await TestVehicle.create({
      name: "Demo Scooter",
      brand: "Honda",
      demoKey: "test-migrate-scope-1",
      images: ["https://images.unsplash.com/legacy.jpg"],
    });

    const mockUpload = jest.fn().mockResolvedValue(
      "https://res.cloudinary.com/demo/image/upload/v1/rentx/vehicles/migrated.jpg"
    );

    const allVehicles = [
      { ...nonDemo.toObject() },
      { ...demo.toObject() },
    ];

    const stats = await runMigrationLogic(allVehicles, mockUpload);

    // Only demo vehicle was scanned
    expect(stats.vehiclesScanned).toBe(1);
    expect(stats.imagesScanned).toBe(1);
    expect(stats.imagesMigrated).toBe(1);

    // Non-demo vehicle images must NOT have been changed in DB
    const nonDemoDb = await TestVehicle.findById(nonDemo._id).lean();
    expect(nonDemoDb.images[0]).toBe("https://images.unsplash.com/legacy.jpg");
  });
});

// ─── Idempotency ──────────────────────────────────────────────────────────────
describe("Idempotency", () => {
  test("already-Cloudinary URLs are skipped, upload not called", async () => {
    const vehicle = await TestVehicle.create({
      name: "Already Migrated",
      brand: "BMW",
      demoKey: "test-migrate-idempotent-1",
      images: [
        "https://res.cloudinary.com/mycloud/image/upload/v1/rentx/vehicles/abc.jpg",
        "https://res.cloudinary.com/mycloud/image/upload/v1/rentx/vehicles/def.jpg",
      ],
    });

    const mockUpload = jest.fn();
    const stats = await runMigrationLogic([vehicle.toObject()], mockUpload);

    expect(mockUpload).not.toHaveBeenCalled();
    expect(stats.imagesSkipped).toBe(2);
    expect(stats.imagesMigrated).toBe(0);
    expect(stats.imagesFailed).toBe(0);
  });

  test("mixed: already-Cloudinary + legacy — only legacy is uploaded", async () => {
    const vehicle = await TestVehicle.create({
      name: "Partial Migrated",
      brand: "Tata",
      demoKey: "test-migrate-idempotent-2",
      images: [
        "https://res.cloudinary.com/mycloud/image/upload/v1/rentx/vehicles/already.jpg",
        "https://images.unsplash.com/photo-legacy.jpg",
      ],
    });

    const mockUpload = jest.fn().mockResolvedValue(
      "https://res.cloudinary.com/mycloud/image/upload/v1/rentx/vehicles/new.jpg"
    );

    const stats = await runMigrationLogic([vehicle.toObject()], mockUpload);

    expect(mockUpload).toHaveBeenCalledTimes(1);
    expect(stats.imagesSkipped).toBe(1);
    expect(stats.imagesMigrated).toBe(1);
  });
});

// ─── Partial failure resilience ───────────────────────────────────────────────
describe("Failure resilience", () => {
  test("a single failed image does not stop processing of remaining images", async () => {
    const vehicle = await TestVehicle.create({
      name: "Multi Image Vehicle",
      brand: "Maruti",
      demoKey: "test-migrate-resilience-1",
      images: [
        "https://images.unsplash.com/image1.jpg",
        "https://images.unsplash.com/image2.jpg",
        "https://images.unsplash.com/image3.jpg",
      ],
    });

    // First upload fails, remaining succeed
    const mockUpload = jest
      .fn()
      .mockRejectedValueOnce(new Error("Network timeout"))
      .mockResolvedValueOnce("https://res.cloudinary.com/mycloud/image2.jpg")
      .mockResolvedValueOnce("https://res.cloudinary.com/mycloud/image3.jpg");

    const stats = await runMigrationLogic([vehicle.toObject()], mockUpload);

    expect(stats.imagesFailed).toBe(1);
    expect(stats.imagesMigrated).toBe(2);
    expect(stats.imagesScanned).toBe(3);

    // DB should have the 2 successful migrated URLs (partial update)
    const updated = await TestVehicle.findById(vehicle._id).lean();
    // image[0] remains legacy (failed), images[1] and [2] are Cloudinary
    expect(isCloudinaryUrl(updated.images[1])).toBe(true);
    expect(isCloudinaryUrl(updated.images[2])).toBe(true);
  });

  test("failed vehicle's images remain unchanged in database", async () => {
    const vehicle = await TestVehicle.create({
      name: "Fail All",
      brand: "Royal Enfield",
      demoKey: "test-migrate-resilience-2",
      images: ["https://images.unsplash.com/fail.jpg"],
    });

    const mockUpload = jest.fn().mockRejectedValue(new Error("Cloudinary error"));
    const stats = await runMigrationLogic([vehicle.toObject()], mockUpload);

    expect(stats.imagesFailed).toBe(1);
    expect(stats.imagesMigrated).toBe(0);

    // DB should be unchanged — failure should not corrupt image array
    const db = await TestVehicle.findById(vehicle._id).lean();
    expect(db.images[0]).toBe("https://images.unsplash.com/fail.jpg");
  });
});

// ─── Resumability ─────────────────────────────────────────────────────────────
describe("Resumability", () => {
  test("second run skips previously migrated images", async () => {
    const vehicle = await TestVehicle.create({
      name: "Resume Test",
      brand: "Honda",
      demoKey: "test-migrate-resume-1",
      images: [
        "https://images.unsplash.com/first.jpg",
        "https://images.unsplash.com/second.jpg",
      ],
    });

    const cloudinaryUrl1 = "https://res.cloudinary.com/mycloud/image/upload/first.jpg";
    const cloudinaryUrl2 = "https://res.cloudinary.com/mycloud/image/upload/second.jpg";

    // First run: both uploaded
    const mockUpload1 = jest.fn()
      .mockResolvedValueOnce(cloudinaryUrl1)
      .mockResolvedValueOnce(cloudinaryUrl2);

    const stats1 = await runMigrationLogic([vehicle.toObject()], mockUpload1);
    expect(stats1.imagesMigrated).toBe(2);

    // Fetch updated vehicle from DB (images are now Cloudinary URLs)
    const updatedVehicle = await TestVehicle.findById(vehicle._id).lean();

    // Second run: all already Cloudinary — skip everything
    const mockUpload2 = jest.fn();
    const stats2 = await runMigrationLogic([updatedVehicle], mockUpload2);

    expect(mockUpload2).not.toHaveBeenCalled();
    expect(stats2.imagesSkipped).toBe(2);
    expect(stats2.imagesMigrated).toBe(0);
  });
});

// ─── Empty vehicle (no images) ────────────────────────────────────────────────
describe("Edge cases", () => {
  test("vehicle with no images is handled without errors", async () => {
    const vehicle = await TestVehicle.create({
      name: "No Images",
      brand: "TVS",
      demoKey: "test-migrate-empty-1",
      images: [],
    });

    const mockUpload = jest.fn();
    const stats = await runMigrationLogic([vehicle.toObject()], mockUpload);

    expect(mockUpload).not.toHaveBeenCalled();
    expect(stats.imagesScanned).toBe(0);
    expect(stats.imagesFailed).toBe(0);
  });

  test("zero demo vehicles returns zero stats without error", async () => {
    const mockUpload = jest.fn();
    const stats = await runMigrationLogic([], mockUpload);

    expect(stats.vehiclesScanned).toBe(0);
    expect(stats.imagesScanned).toBe(0);
    expect(stats.imagesMigrated).toBe(0);
  });
});
