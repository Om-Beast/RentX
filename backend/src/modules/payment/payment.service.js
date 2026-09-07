import dotenv from "dotenv";
dotenv.config();

import crypto from "crypto";
import Razorpay from "razorpay";
import mongoose from "mongoose";
import PaymentRepository from "./payment.repository.js";
import NotificationService from "../notifications/notification.service.js";
import TrustService from "../trust/trust.service.js";
import logger from "../../utils/logger.js";
import {
  NotFoundError,
  AuthorizationError,
  PaymentError,
  ConflictError,
  ExternalServiceError,
} from "../../utils/errors.js";

// Razorpay client — initialized once at module load
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const FEES = Object.freeze({
  GST_RATE: 0.18,
  PLATFORM_FEE: 99,
  DEFAULT_SECURITY_DEPOSIT: 1000,
});

class PaymentService {
  /**
   * Authoritative amount calculation.
   * NEVER trust amounts from the frontend.
   * Always recompute from vehicle.pricePerDay and booking dates.
   */
  _calculateSecureAmount(startDate, endDate, pricePerDay, securityDeposit) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffDays = Math.max(
      1,
      Math.ceil((end - start) / (1000 * 60 * 60 * 24))
    );
    const baseAmount = diffDays * pricePerDay;
    const gstAmount = Math.round(baseAmount * FEES.GST_RATE);
    const platformFee = FEES.PLATFORM_FEE;
    const deposit = securityDeposit ?? FEES.DEFAULT_SECURITY_DEPOSIT;
    return { total: baseAmount + gstAmount + platformFee + deposit, baseAmount, gstAmount, platformFee, deposit };
  }

  /**
   * Create a Razorpay order.
   *
   * Idempotency: if the same x-idempotency-key is sent again (e.g. client retry),
   * we return the existing order instead of creating a duplicate.
   */
  async createOrder({ bookingId, userId, idempotencyKey, currency = "INR" }) {
    // 1. Idempotency check
    if (idempotencyKey) {
      const existing = await PaymentRepository.findByIdempotencyKey(idempotencyKey);
      if (existing) {
        logger.info("PaymentService", "IDEMPOTENT_ORDER_HIT", {
          idempotencyKey,
          orderId: existing.razorpayOrderId,
        });
        return {
          isIdempotent: true,
          orderId: existing.razorpayOrderId,
          amount: existing.amount * 100,
          currency: existing.currency,
        };
      }
    }

    // 2. Fetch booking with vehicle (never trust frontend amounts)
    const booking = await PaymentRepository.getSecureBookingDetailsForPayment(bookingId);
    if (!booking) throw new NotFoundError("Booking not found");

    // 3. Authorization — only the booking customer can pay
    if (booking.user.toString() !== userId.toString()) {
      throw new AuthorizationError("You are not authorized to pay for this booking");
    }

    // 4. Prevent double payment
    if (booking.paymentStatus === "paid") {
      throw new ConflictError("This booking has already been paid", "ALREADY_PAID");
    }

    const existingPaid = await PaymentRepository.findSuccessfulPaymentByBookingId(bookingId);
    if (existingPaid) {
      throw new ConflictError("A successful payment already exists for this booking", "ALREADY_PAID");
    }

    // 5. Compute authoritative amount
    const { total: secureAmount } = this._calculateSecureAmount(
      booking.startDate,
      booking.endDate,
      booking.vehicle.pricePerDay,
      booking.vehicle.securityDeposit
    );

    // 6. Create Razorpay order
    let razorpayOrder;
    try {
      razorpayOrder = await razorpay.orders.create({
        amount: secureAmount * 100, // paise
        currency,
        receipt: `rcpt_${bookingId.toString().substring(0, 10)}`,
        notes: {
          bookingId: bookingId.toString(),
          userId: userId.toString(),
        },
      });
    } catch (err) {
      logger.error("PaymentService", "RAZORPAY_ORDER_CREATION_FAILED", { bookingId }, err);
      throw new ExternalServiceError("Payment gateway unavailable. Please try again.", "RAZORPAY");
    }

    // 7. Persist payment record
    await PaymentRepository.createPayment({
      booking: bookingId,
      user: userId,
      amount: secureAmount,
      currency,
      razorpayOrderId: razorpayOrder.id,
      status: "created",
      idempotencyKey,
    });

    logger.info("PaymentService", "PAYMENT_ORDER_CREATED", {
      bookingId,
      orderId: razorpayOrder.id,
      amount: secureAmount,
    });

    return {
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
    };
  }

  /**
   * Verify Razorpay payment signature and confirm the booking.
   *
   * Idempotency: if this payment was already verified (status === 'paid'),
   * return the existing record without re-processing.
   */
  async verifySignature({ razorpayOrderId, razorpayPaymentId, razorpaySignature }) {
    // 1. Verify HMAC signature — cryptographic proof payment came from Razorpay
    const body = `${razorpayOrderId}|${razorpayPaymentId}`;
    const expectedSig = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSig !== razorpaySignature) {
      logger.warn("PaymentService", "INVALID_PAYMENT_SIGNATURE", { orderId: razorpayOrderId });
      throw new PaymentError("Payment signature verification failed", "INVALID_SIGNATURE");
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const payment = await PaymentRepository.findByOrderId(razorpayOrderId);
      if (!payment) throw new NotFoundError("Payment record not found");

      // Idempotency — already processed
      if (payment.status === "paid") {
        await session.abortTransaction();
        logger.info("PaymentService", "PAYMENT_ALREADY_VERIFIED", { orderId: razorpayOrderId });
        return payment;
      }

      // 2. Mark payment as paid
      const updatedPayment = await PaymentRepository.updatePaymentStatus(
        razorpayOrderId,
        { razorpayPaymentId, status: "paid", paidAt: new Date() },
        session
      );

      // 3. Advance booking state — append timeline (using $push not $set)
      await PaymentRepository.updateBookingAfterPayment(
        payment.booking,
        {
          paymentStatus: "paid",
          bookingStatus: "pending_owner_approval",
          expiresAt: null, // clear the hold expiry — payment done
        },
        [
          { eventType: "PAYMENT_COMPLETED", actor: payment.user, note: "Payment verified successfully" },
          { eventType: "PENDING_OWNER_APPROVAL", actor: payment.user, note: "Awaiting fleet owner approval" },
        ],
        session
      );

      await session.commitTransaction();

      logger.info("PaymentService", "PAYMENT_VERIFIED", {
        paymentId: razorpayPaymentId,
        orderId: razorpayOrderId,
        bookingId: payment.booking,
      });

      // Non-critical: trust + notification
      try {
        await TrustService.applyEvent(payment.user, TrustService.EVENT_TYPES.PAYMENT_SUCCESS, {
          bookingId: payment.booking,
        });
        await NotificationService.createNotification({
          user: payment.user,
          type: "PAYMENT_COMPLETED",
          title: "Payment Successful ✅",
          message: "Your payment was received. The vehicle owner will review your request.",
          priority: "HIGH",
          metadata: { bookingId: payment.booking },
        });
      } catch (e) {
        logger.warn("PaymentService", "POST_PAYMENT_HOOK_FAILED", { error: e.message });
      }

      return updatedPayment;
    } catch (error) {
      if (session.inTransaction()) await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Process Razorpay webhook events.
   * Webhooks are the authoritative source of truth for payment state.
   * All processing is idempotent — duplicate events are safely ignored.
   */
  async processWebhook(webhookBody, webhookSignature) {
    const expectedSig = crypto
      .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(JSON.stringify(webhookBody))
      .digest("hex");

    if (expectedSig !== webhookSignature) {
      logger.warn("PaymentService", "INVALID_WEBHOOK_SIGNATURE");
      throw new PaymentError("Invalid webhook signature", "INVALID_WEBHOOK_SIGNATURE");
    }

    const { event, payload } = webhookBody;
    const paymentEntity = payload?.payment?.entity;
    if (!paymentEntity) return;

    const orderId = paymentEntity.order_id;
    const paymentId = paymentEntity.id;

    logger.info("PaymentService", "WEBHOOK_RECEIVED", { event, orderId });

    switch (event) {
      case "payment.captured":
        await this._handleSuccessfulWebhook(orderId, paymentId);
        break;
      case "payment.failed":
        await this._handleFailedWebhook(orderId, paymentEntity);
        break;
      case "refund.processed":
        await this._handleRefundWebhook(paymentEntity);
        break;
      default:
        logger.info("PaymentService", "WEBHOOK_UNHANDLED_EVENT", { event });
    }
  }

  async _handleSuccessfulWebhook(orderId, paymentId) {
    const payment = await PaymentRepository.findByOrderId(orderId);
    if (!payment || payment.status === "paid") return; // Idempotent

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      await PaymentRepository.updatePaymentStatus(orderId, { razorpayPaymentId: paymentId, status: "paid", paidAt: new Date() }, session);
      await PaymentRepository.updateBookingAfterPayment(
        payment.booking,
        { paymentStatus: "paid", bookingStatus: "pending_owner_approval" },
        [{ eventType: "WEBHOOK_PAYMENT_CAPTURED", note: "Confirmed via Razorpay webhook" }],
        session
      );
      await session.commitTransaction();
      logger.info("PaymentService", "WEBHOOK_PAYMENT_CAPTURED", { orderId });
    } catch (err) {
      await session.abortTransaction();
      logger.error("PaymentService", "WEBHOOK_CAPTURE_FAILED", { orderId }, err);
    } finally {
      session.endSession();
    }
  }

  async _handleFailedWebhook(orderId, paymentEntity) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const payment = await PaymentRepository.updatePaymentStatus(
        orderId,
        { status: "failed", errorDescription: paymentEntity.error_description },
        session
      );
      if (payment) {
        await PaymentRepository.updateBookingAfterPayment(
          payment.booking,
          { paymentStatus: "failed" },
          [{ eventType: "PAYMENT_FAILED", note: paymentEntity.error_description || "Payment failed" }],
          session
        );
        try {
          await TrustService.applyEvent(payment.user, TrustService.EVENT_TYPES.PAYMENT_FAILED, {
            bookingId: payment.booking,
          });
        } catch (e) { /* non-critical */ }
      }
      await session.commitTransaction();
      logger.info("PaymentService", "WEBHOOK_PAYMENT_FAILED", { orderId });
    } catch (err) {
      await session.abortTransaction();
      logger.error("PaymentService", "WEBHOOK_FAILED_HANDLER_ERROR", { orderId }, err);
    } finally {
      session.endSession();
    }
  }

  async _handleRefundWebhook(refundEntity) {
    const orderId = refundEntity.order_id;
    const payment = await PaymentRepository.findByOrderId(orderId);
    if (!payment || payment.status === "refunded") return;

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      await PaymentRepository.updatePaymentStatus(orderId, {
        status: "refunded",
        refundDetails: {
          refundId: refundEntity.id,
          refundAmount: refundEntity.amount / 100,
          refundedAt: new Date(),
        },
      }, session);
      await PaymentRepository.updateBookingAfterPayment(
        payment.booking,
        { paymentStatus: "refunded", bookingStatus: "refunded" },
        [{ eventType: "REFUND_PROCESSED", note: "Refund confirmed via webhook" }],
        session
      );
      await session.commitTransaction();
      logger.info("PaymentService", "WEBHOOK_REFUND_PROCESSED", { orderId });
    } catch (err) {
      await session.abortTransaction();
      logger.error("PaymentService", "WEBHOOK_REFUND_FAILED", { orderId }, err);
    } finally {
      session.endSession();
    }
  }
}

export default new PaymentService();