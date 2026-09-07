import express from "express";
import { discoverVehicles, generateDescription, getRecommendations } from "./ai.controller.js";
import { protect, authorize } from "../../middlewares/auth.middleware.js";
import { aiLimiter } from "../../middlewares/rateLimit.middleware.js";

const router = express.Router();

// All AI routes rate-limited — each call costs money
router.post("/discover", aiLimiter, discoverVehicles);
router.post("/generate-description", protect, authorize("FLEET_OWNER"), aiLimiter, generateDescription);
router.get("/recommendations", protect, aiLimiter, getRecommendations);

export default router;