import express from "express";
import {
  addVehicle,
  getAllVehicles,
  getVehicleById,
  getMyVehicles,
  deleteVehicle,
  toggleVehicleAvailability,
  updateVehicle,
  uploadVehicleImages,
  deleteVehicleImage,
} from "./vehicle.controller.js";

import {
  protect,
  authorize,
} from "../../middlewares/auth.middleware.js";

const router = express.Router();

/*
==================================
PUBLIC ROUTES
==================================
*/

// Get all vehicles (with server-side filters + pagination)
router.get("/", getAllVehicles);

// Get single vehicle by id
router.get("/:id", getVehicleById);

/*
==================================
AUTHENTICATED — FLEET OWNER / ADMIN
==================================
*/

// Get logged-in owner's vehicles
router.get(
  "/my-vehicles",
  protect,
  authorize("FLEET_OWNER", "ADMIN"),
  getMyVehicles
);

// Add vehicle (metadata only — no images at creation time)
router.post(
  "/",
  protect,
  authorize("FLEET_OWNER", "ADMIN"),
  addVehicle
);

// Update vehicle metadata (IDOR-protected, field allowlist)
router.put(
  "/:id",
  protect,
  authorize("FLEET_OWNER", "ADMIN"),
  updateVehicle
);

// Also support PATCH for partial updates (same handler)
router.patch(
  "/:id",
  protect,
  authorize("FLEET_OWNER", "ADMIN"),
  updateVehicle
);

// Toggle availability on/off
router.patch(
  "/:id/toggle-availability",
  protect,
  authorize("FLEET_OWNER", "ADMIN"),
  toggleVehicleAvailability
);

// Delete vehicle
router.delete(
  "/:id",
  protect,
  authorize("FLEET_OWNER", "ADMIN"),
  deleteVehicle
);

/*
==================================
IMAGE UPLOAD — CLOUDINARY PIPELINE
==================================
*/

/**
 * POST /api/vehicles/:id/images
 * Upload 1–10 images for a vehicle.
 *
 * Content-Type: multipart/form-data
 * Field name: "images" (array)
 *
 * The controller creates the multer middleware dynamically
 * (after ownership check) so the Cloudinary folder includes the ownerId.
 *
 * Returns: { success: true, images: [{ url, publicId }] }
 */
router.post(
  "/:id/images",
  protect,
  authorize("FLEET_OWNER", "ADMIN"),
  uploadVehicleImages
);

/**
 * DELETE /api/vehicles/:id/images/:publicId
 * Remove a single image from a vehicle by its Cloudinary publicId.
 *
 * The publicId must be URL-encoded (slashes → %2F).
 */
router.delete(
  "/:id/images/:publicId",
  protect,
  authorize("FLEET_OWNER", "ADMIN"),
  deleteVehicleImage
);

export default router;