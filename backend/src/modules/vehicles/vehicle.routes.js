import express from "express";
import {
  addVehicle,
  getAllVehicles,
} from "./vehicle.controller.js";

import {
  protect,
  authorize,
} from "../../middlewares/auth.middleware.js";

const router = express.Router();

// Customer sab vehicles dekh sakta hai
router.get("/", getAllVehicles);

// Sirf Fleet Owner/Admin vehicle add kar sakta hai
router.post(
  "/",
  protect,
  authorize("FLEET_OWNER", "ADMIN"),
  addVehicle
);

export default router;