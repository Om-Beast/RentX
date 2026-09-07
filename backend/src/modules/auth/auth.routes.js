import express from "express";
import { registerUser, loginUser, getMe } from "./auth.controller.js";
import { protect } from "../../middlewares/auth.middleware.js";
import { loginLimiter, registerLimiter } from "../../middlewares/rateLimit.middleware.js";

const router = express.Router();

router.post("/register", registerLimiter, registerUser);
router.post("/login", loginLimiter, loginUser);
router.get("/me", protect, getMe);

export default router;