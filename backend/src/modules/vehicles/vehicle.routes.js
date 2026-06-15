import express from "express";
import {
  addVehicle,
  getAllVehicles,
  getVehicleById,
  getMyVehicles,
  deleteVehicle,
  toggleVehicleAvailability,
  updateVehicle,
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

// Get all vehicles
router.get("/", getAllVehicles);

// Get logged in owner's vehicles
router.get(
  "/my-vehicles",
  protect,
  authorize("FLEET_OWNER"),
  getMyVehicles
);

// Get single vehicle by id
router.get("/:id", getVehicleById);

/*
==================================
PROTECTED ROUTES
==================================
*/

// Add vehicle
router.post(
  "/",
  protect,
  authorize("FLEET_OWNER", "ADMIN"),
  addVehicle
);
router.delete(
  "/:id",
  protect,
  authorize("FLEET_OWNER"),
  deleteVehicle
);

router.put(
  "/:id",
  protect,
  authorize("FLEET_OWNER", "ADMIN"),
  updateVehicle
);

router.patch(
  "/:id/toggle-availability",
  protect,
  authorize("FLEET_OWNER", "ADMIN"),
  toggleVehicleAvailability
);

export default router;