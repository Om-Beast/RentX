import PaymentService from "./payment.service.js";
import logger from "../../utils/logger.js";

class PaymentController {
  async createOrder(req, res, next) {
    try {
      const { bookingId } = req.body;
      const idempotencyKey = req.headers["x-idempotency-key"];

      if (!bookingId) {
        return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "bookingId is required" } });
      }

      const orderData = await PaymentService.createOrder({
        bookingId,
        userId: req.user._id,
        idempotencyKey,
      });

      return res.status(201).json({ success: true, ...orderData });
    } catch (error) {
      next(error);
    }
  }

  async verifyPayment(req, res, next) {
    try {
      const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

      if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
        return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Missing payment verification details" } });
      }

      const payment = await PaymentService.verifySignature({
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
      });

      return res.status(200).json({
        success: true,
        message: "Payment verified successfully",
        paymentId: payment._id,
        status: payment.status,
      });
    } catch (error) {
      next(error);
    }
  }

  async webhookHandler(req, res) {
    try {
      const webhookSignature = req.headers["x-razorpay-signature"];
      if (!webhookSignature) {
        return res.status(400).send("Webhook signature missing");
      }

      // req.body is raw buffer from express.raw() in server.js
      const webhookBody = JSON.parse(req.body.toString());
      await PaymentService.processWebhook(webhookBody, webhookSignature);

      // Always return 200 to Razorpay — prevent unnecessary retries
      return res.status(200).send("OK");
    } catch (error) {
      logger.warn("PaymentController", "WEBHOOK_ERROR", { error: error.message });
      // Return 200 even on errors (except auth failures) to prevent Razorpay retries
      return res.status(200).send("Webhook received");
    }
  }
}

export default new PaymentController();