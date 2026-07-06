import { Router } from "express";
import bookingRiskController from "../controllers/bookingRisk.controller.js";

const router = Router();

router.post(
  "/analyze",
  bookingRiskController.analyze
);

export default router;