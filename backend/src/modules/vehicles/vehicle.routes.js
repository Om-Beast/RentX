import express from "express";
import { addVehicle } from "./vehicle.controller.js";
import {
  protect,
  authorize,
} from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.post(
  "/",
  protect,
  authorize("FLEET_OWNER", "ADMIN"),
  addVehicle
);

export default router;