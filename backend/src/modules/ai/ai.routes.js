import { Router } from "express";
import aiController from "./ai.controller.js";

const router = Router();

router.get("/health", aiController.checkHealth);

router.post(
  "/trip-planner",
  aiController.generateTripPlan
);

export default router;