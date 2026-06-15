import PaymentService from './payment.service.js';

class PaymentController {
  /**
   * @route POST /api/payments/create-order
   * @desc Create a Razorpay order securely
   * @access Private (Requires Authentication)
   */
  async createOrder(req, res) {
    try {
      const { bookingId } = req.body;
      const userId = req.user._id; // Assuming auth middleware attaches user object
      const idempotencyKey = req.headers['x-idempotency-key'];

      if (!bookingId) {
        return res.status(400).json({ 
          success: false, 
          message: 'bookingId is required' 
        });
      }

      const orderData = await PaymentService.createOrder({
        bookingId,
        userId,
        idempotencyKey
      });

      return res.status(201).json({
        success: true,
        message: 'Order created successfully',
        data: orderData
      });
    } catch (error) {
      console.error(`[PaymentController - createOrder]:`, error);
      const statusCode = error.statusCode || 500;
      return res.status(statusCode).json({ 
        success: false, 
        message: error.message || 'Internal Server Error' 
      });
    }
  }

  /**
   * @route POST /api/payments/verify
   * @desc Verify Razorpay payment signature
   * @access Private (Requires Authentication)
   */
  async verifyPayment(req, res) {
    try {
      console.log("VERIFY BODY =", req.body);
      const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

      if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
        return res.status(400).json({ 
          success: false, 
          message: 'Missing payment verification details' 
        });
      }

      const payment = await PaymentService.verifySignature({
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature
      });

      return res.status(200).json({
        success: true,
        message: 'Payment verified successfully',
        data: {
          paymentId: payment._id,
          status: payment.status
        }
      });
    } catch (error) {
      console.error(`[PaymentController - verifyPayment]:`, error);
      const statusCode = error.statusCode || 500;
      return res.status(statusCode).json({ 
        success: false, 
        message: error.message || 'Internal Server Error' 
      });
    }
  }

  /**
   * @route POST /api/payments/webhook
   * @desc Handle Razorpay Webhooks (payment.captured, payment.failed, refund.processed)
   * @access Public (Requires Webhook Signature Verification)
   */
  async webhookHandler(req, res) {
    try {
      const webhookSignature = req.headers['x-razorpay-signature'];
      
      if (!webhookSignature) {
        return res.status(400).send('Webhook signature missing');
      }

      // Pass the parsed JSON body and signature to the service for processing
      await PaymentService.processWebhook(req.body, webhookSignature);

      // Always return 200 OK to Razorpay immediately to acknowledge receipt 
      // and prevent webhook retries
      return res.status(200).send('OK');
    } catch (error) {
      console.error(`[PaymentController - webhookHandler]:`, error);
      
      // We still return 200 OK if the error was handled internally (e.g., duplicate webhook).
      // Return 400 or 500 ONLY if you want Razorpay to retry the webhook later.
      const statusCode = error.statusCode === 401 ? 401 : 200;
      return res.status(statusCode).send('Webhook Processing Completed With Errors');
    }
  }
}

export default new PaymentController();