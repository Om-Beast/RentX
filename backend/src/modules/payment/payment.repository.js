import Payment from "../../models/Payment.js";
import Booking from "../../models/Booking.js";

class PaymentRepository {
  async findByIdempotencyKey(idempotencyKey) {
    if (!idempotencyKey) return null;
    return Payment.findOne({ idempotencyKey });
  }

  async findSuccessfulPaymentByBookingId(bookingId) {
    return Payment.findOne({ booking: bookingId, status: "paid" });
  }

  async findByOrderId(razorpayOrderId) {
    return Payment.findOne({ razorpayOrderId });
  }

  async getSecureBookingDetailsForPayment(bookingId) {
    return Booking.findById(bookingId).populate(
      "vehicle",
      "pricePerDay securityDeposit owner"
    );
  }

  async createPayment(paymentData, session = null) {
    const payment = new Payment(paymentData);
    return payment.save({ session });
  }

  async updatePaymentStatus(razorpayOrderId, updateData, session = null) {
    return Payment.findOneAndUpdate(
      { razorpayOrderId },
      { $set: updateData },
      { new: true, session }
    );
  }

  /**
   * Update booking state after a payment event.
   * Uses $push with $each to APPEND to timeline — never replace it.
   *
   * Bug fixed: original code used $set: { timeline: [...] } which
   * destroyed the entire existing timeline history on every payment event.
   */
  async updateBookingAfterPayment(bookingId, statusUpdate, timelineEvents = [], session = null) {
    const update = { $set: statusUpdate };
    if (timelineEvents.length > 0) {
      update.$push = {
        timeline: {
          $each: timelineEvents.map((e) => ({
            ...e,
            createdAt: e.createdAt || new Date(),
          })),
        },
      };
    }
    return Booking.findByIdAndUpdate(bookingId, update, { new: true, session });
  }

  async findRefundablePayment(bookingId) {
    return Payment.findOne({ booking: bookingId, status: "paid" });
  }

  async recordRefund(paymentId, refundData, session = null) {
    return Payment.findByIdAndUpdate(
      paymentId,
      { $set: { status: "refunded", refundDetails: refundData } },
      { new: true, session }
    );
  }

  async getPaymentForInvoice(paymentId) {
    return Payment.findById(paymentId)
      .populate("user", "name email phone")
      .populate({
        path: "booking",
        populate: {
          path: "vehicle",
          select: "name brand model year pricePerDay type",
        },
      });
  }

  async getRevenueAnalytics(startDate, endDate) {
    return Payment.aggregate([
      {
        $match: {
          status: "paid",
          paidAt: { $gte: new Date(startDate), $lte: new Date(endDate) },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$paidAt" },
            month: { $month: "$paidAt" },
            day: { $dayOfMonth: "$paidAt" },
          },
          dailyRevenue: { $sum: "$amount" },
          transactionCount: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
    ]);
  }
}

export default new PaymentRepository();
