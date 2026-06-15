import dotenv from "dotenv";
dotenv.config();

import crypto from "crypto";
import Razorpay from "razorpay";
import mongoose from "mongoose";
import PaymentRepository from "./payment.repository.js";

// Initialize Razorpay
console.log(
  "RAZORPAY_KEY_ID =",
  process.env.RAZORPAY_KEY_ID
);

console.log(
  "RAZORPAY_KEY_SECRET =",
  process.env.RAZORPAY_KEY_SECRET
);
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

class PaymentService {
  /**
   * Calculate secure amount based on dates and rentPerDay
   */
  _calculateSecureAmount(startDate, endDate, rentPerDay) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1; // Minimum 1 day
    
   const rentAmount =
  diffDays * rentPerDay;

const gst = Math.round(
  rentAmount * 0.18
);

const platformFee = 99;

const securityDeposit = 1000;

return (
  rentAmount +
  gst +
  platformFee +
  securityDeposit
);
  }

  /**
   * Create a Razorpay Order
   */
  async createOrder({ bookingId, userId, idempotencyKey, currency = 'INR' }) {
    // 1. Idempotency Check: Prevent duplicate order creation
    if (idempotencyKey) {
      const existingPayment = await PaymentRepository.findByIdempotencyKey(idempotencyKey);
      if (existingPayment) {
        return {
          isIdempotent: true,
          orderId: existingPayment.razorpayOrderId,
          amount: existingPayment.amount,
          currency: existingPayment.currency
        };
      }
    }

    // 2. Fetch Secure Booking Details (NEVER trust frontend amounts)
    const booking = await PaymentRepository.getSecureBookingDetailsForPayment(bookingId);
    
    if (!booking) {
      const error = new Error('Booking not found');
      error.statusCode = 404;
      throw error;
    }

    // 3. Verify Ownership
    if (booking.user.toString() !== userId.toString()) {
      const error = new Error('Unauthorized: You do not own this booking');
      error.statusCode = 403;
      throw error;
    }

    // 4. Prevent Double Payment: Check if booking is already paid
    if (booking.paymentStatus === 'paid') {
      const error = new Error('Booking is already paid');
      error.statusCode = 400;
      throw error;
    }

    const alreadyPaid = await PaymentRepository.findSuccessfulPaymentByBookingId(bookingId);
    if (alreadyPaid) {
      const error = new Error('A successful payment already exists for this booking');
      error.statusCode = 400;
      throw error;
    }

    // 5. Calculate Secure Payable Amount
    const secureAmount = this._calculateSecureAmount(
      booking.startDate, 
      booking.endDate, 
      booking.vehicle.rentPerDay
    );

    // 6. Create order on Razorpay
    const options = {
      amount: secureAmount * 100, // Razorpay expects amount in paise
      currency,
      receipt: `rcpt_bkg_${bookingId.toString().substring(0, 10)}`,
      notes: {
        bookingId: bookingId.toString(),
        userId: userId.toString()
      }
    };

    const razorpayOrder = await razorpay.orders.create(options);

    // 7. Save initial payment to Database
    const paymentData = {
      booking: bookingId,
      user: userId,
      amount: secureAmount,
      currency,
      razorpayOrderId: razorpayOrder.id,
      status: 'created', // Using lowercase enum correctly
      idempotencyKey
    };

    await PaymentRepository.createPayment(paymentData);

    // Audit Log 
    console.info(`[AUDIT] Order Created: ${razorpayOrder.id} | Booking: ${bookingId} | Amount: ${secureAmount}`);

    return {
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency
    };
  }

  /**
   * Verify Razorpay Payment Signature
   */
  async verifySignature({ razorpayOrderId, razorpayPaymentId, razorpaySignature }) {
    // 1. Verify Signature locally using crypto
    const body = razorpayOrderId + "|" + razorpayPaymentId;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpaySignature) {
      console.warn(`[SECURITY ALERT] Invalid signature for Order: ${razorpayOrderId}`);
      const error = new Error('Invalid payment signature');
      error.statusCode = 400;
      throw error;
    }

    // 2. Start a Database Transaction to ensure atomicity
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const payment = await PaymentRepository.findByOrderId(razorpayOrderId);
      if (!payment) {
        throw new Error('Payment record not found');
      }

      if (payment.status === 'paid') {
        // Idempotency: Already processed
        await session.abortTransaction();
        session.endSession();
        return payment;
      }

      // 3. Update Payment Status to 'paid'
      const updatedPayment = await PaymentRepository.updatePaymentStatus(
        razorpayOrderId,
        {
          razorpayPaymentId,
          status: 'paid', // Using lowercase enum
          paidAt: new Date()
        },
        session
      );

      // 4. Sync Booking Fields using lowercase enums
      await PaymentRepository.updateBookingStatus(
  payment.booking,
  {
    paymentStatus: 'paid',
    bookingStatus: 'pending_owner_approval',
    timeline: [
      {
        status: 'payment_completed',
        note: 'Payment verified successfully',
        createdAt: new Date(),
      },
      {
        status: 'pending_owner_approval',
        note: 'Waiting for owner approval',
        createdAt: new Date(),
      },
    ],
  },
  session
);

      await session.commitTransaction();
      console.info(`[AUDIT] Payment Verified: ${razorpayPaymentId} | Order: ${razorpayOrderId}`);

      return updatedPayment;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Handle Razorpay Webhooks
   */
  async processWebhook(webhookBody, webhookSignature) {
    // 1. Verify Webhook Signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(JSON.stringify(webhookBody))
      .digest('hex');

    if (expectedSignature !== webhookSignature) {
      console.error('[SECURITY ALERT] Invalid Webhook Signature');
      const error = new Error('Invalid webhook signature');
      error.statusCode = 401;
      throw error;
    }

    const eventType = webhookBody.event;
    const paymentEntity = webhookBody.payload.payment.entity;
    const orderId = paymentEntity.order_id;
    const paymentId = paymentEntity.id;

    switch (eventType) {
      case 'payment.captured':
        await this._handleSuccessfulPaymentWebhook(orderId, paymentId);
        break;
      case 'payment.failed':
        await this._handleFailedPaymentWebhook(orderId, paymentEntity);
        break;
      case 'refund.processed':
        await this._handleRefundWebhook(paymentEntity);
        break;
      default:
        console.info(`[WEBHOOK] Unhandled event type: ${eventType}`);
    }

    return true;
  }

  /**
   * Webhook: Payment Captured
   */
  async _handleSuccessfulPaymentWebhook(orderId, paymentId) {
    const payment = await PaymentRepository.findByOrderId(orderId);
    if (!payment || payment.status === 'paid') return; // Already processed

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      await PaymentRepository.updatePaymentStatus(orderId, {
        razorpayPaymentId: paymentId,
        status: 'paid',
        paidAt: new Date()
      }, session);
      
      await PaymentRepository.updateBookingStatus(
        payment.booking, 
        { paymentStatus: 'paid', bookingStatus: 'confirmed' }, 
        session
      );
      
      await session.commitTransaction();
      console.info(`[AUDIT] Webhook processed: Payment PAID | Order: ${orderId}`);
    } catch (err) {
      await session.abortTransaction();
      console.error(`[WEBHOOK ERROR] payment.captured failed for ${orderId}`, err);
    } finally {
      session.endSession();
    }
  }

  /**
   * Webhook: Payment Failed
   */
  async _handleFailedPaymentWebhook(orderId, paymentEntity) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const payment = await PaymentRepository.updatePaymentStatus(orderId, {
        status: 'failed',
        errorDescription: paymentEntity.error_description
      }, session);

      if (payment) {
        await PaymentRepository.updateBookingStatus(
          payment.booking, 
          { paymentStatus: 'failed' }, 
          session
        );
      }
      
      await session.commitTransaction();
      console.info(`[AUDIT] Webhook processed: Payment FAILED | Order: ${orderId}`);
    } catch (err) {
      await session.abortTransaction();
      console.error(`[WEBHOOK ERROR] payment.failed failed for ${orderId}`, err);
    } finally {
      session.endSession();
    }
  }

  /**
   * Webhook: Refund Processed (Refund-ready Architecture)
   */
  async _handleRefundWebhook(refundEntity) {
    // Implementation uses the existing order finding pattern from previous hooks
    const orderId = refundEntity.order_id;
    const payment = await PaymentRepository.findByOrderId(orderId);
    if (!payment || payment.status === 'refunded') return;

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      await PaymentRepository.updatePaymentStatus(orderId, {
        status: 'refunded'
      }, session);
      
      // If payment is refunded, booking gets cancelled
      await PaymentRepository.updateBookingStatus(
        payment.booking, 
        { paymentStatus: 'refunded', bookingStatus: 'cancelled' }, 
        session
      );
      
      await session.commitTransaction();
      console.info(`[AUDIT] Webhook processed: Refund Initiated | Order: ${orderId}`);
    } catch (err) {
      await session.abortTransaction();
      console.error(`[WEBHOOK ERROR] refund.processed failed for ${orderId}`, err);
    } finally {
      session.endSession();
    }
  }
}

export default new PaymentService();