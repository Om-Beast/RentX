import { Router } from "express";
import PaymentController from "./payment.controller.js";
import { protect } from "../../middlewares/auth.middleware.js";

const router = Router();

// ---------------------------------------------------------
// @route   POST /api/payments/create-order
// @desc    Initiate a payment and create a Razorpay order
// @access  Private (Logged-in customers)
// ---------------------------------------------------------
router.post(
  '/create-order',
  protect, // Authentication required
  PaymentController.createOrder
);

// ---------------------------------------------------------
// @route   POST /api/payments/verify
// @desc    Verify payment signature from frontend callback
// @access  Private (Logged-in customers)
// ---------------------------------------------------------
router.post(
  '/verify',
  protect, // Authentication required
  PaymentController.verifyPayment
);

// ---------------------------------------------------------
// @route   POST /api/payments/webhook
// @desc    Razorpay server-to-server webhook callback
// @access  Public (Relies on cryptographic signature, NOT user auth)
// ---------------------------------------------------------
// IMPORTANT: DO NOT apply `protect` middleware here.
// Razorpay sends requests from their servers without a user JWT.
router.post(
  '/webhook',
  // Note: Ensure `app.use(express.json())` is configured in your main Express file
  // so `req.body` is parsed properly before reaching this handler.
  PaymentController.webhookHandler
);

export default router;