
import Payment from '../../models/Payment.js';
import Booking from '../../models/Booking.js';

class PaymentRepository {
  /**
   * Find a payment by its idempotency key to prevent duplicate API requests
   */
  async findByIdempotencyKey(idempotencyKey) {
    if (!idempotencyKey) return null;
    return Payment.findOne({ idempotencyKey });
  }

  /**
   * Find an existing successful payment for a specific booking
   * Prevents double payment for the same booking
   */
  async findSuccessfulPaymentByBookingId(bookingId) {
    return Payment.findOne({
      booking: bookingId,
      status: 'paid'
    });
  }

  /**
   * Find payment by Razorpay Order ID
   */
  async findByOrderId(razorpayOrderId) {
    return Payment.findOne({ razorpayOrderId });
  }

  /**
   * Fetch a booking along with its vehicle to securely calculate the amount
   * CRITICAL: Do NOT trust amount from frontend. Calculate it based on vehicle rates and booking dates.
   */
  async getSecureBookingDetailsForPayment(bookingId) {
    return Booking.findById(bookingId).populate('vehicle');
  }

  /**
   * Create a new payment record (usually in 'created' state initially)
   */
  async createPayment(paymentData, session = null) {
    const payment = new Payment(paymentData);
    return payment.save({ session });
  }

  /**
   * Update payment status and details (e.g., after successful verification)
   */
  async updatePaymentStatus(razorpayOrderId, updateData, session = null) {
    return Payment.findOneAndUpdate(
      { razorpayOrderId },
      { $set: updateData },
      { new: true, session }
    );
  }

  /**
   * Update related booking fields (e.g., both bookingStatus and paymentStatus)
   * updateData takes an object like: { paymentStatus: 'paid', bookingStatus: 'confirmed' }
   */
  async updateBookingStatus(bookingId, updateData, session = null) {
    return Booking.findByIdAndUpdate(
      bookingId,
      { $set: updateData },
      { new: true, session }
    );
  }

  /**
   * Refund Support: Find payment eligible for refund by booking ID
   */
  async findRefundablePayment(bookingId) {
    return Payment.findOne({
      booking: bookingId,
      status: 'paid'
    });
  }

  /**
   * Refund Support: Update payment with refund details
   */
  async recordRefund(paymentId, refundData, session = null) {
    return Payment.findByIdAndUpdate(
      paymentId,
      {
        $set: {
          status: 'refunded',
          refundDetails: refundData // Assumes you add a refundDetails subdoc to Payment schema later
        },
      },
      { new: true, session }
    );
  }

  /**
   * Invoice Generation Support: Fetch a payment with fully populated details
   */
  async getPaymentForInvoice(paymentId) {
    return Payment.findById(paymentId)
      .populate('user', 'name email phone')
      .populate({
        path: 'booking',
        populate: {
          path: 'vehicle',
          select: 'name brand model year rentPerDay type'
        }
      });
  }

  /**
   * Analytics Support: Get revenue metrics aggregated by day within a date range
   */
  async getRevenueAnalytics(startDate, endDate) {
    return Payment.aggregate([
      {
        $match: {
          status: 'paid',
          paidAt: { $gte: new Date(startDate), $lte: new Date(endDate) }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$paidAt' },
            month: { $month: '$paidAt' },
            day: { $dayOfMonth: '$paidAt' }
          },
          dailyRevenue: { $sum: '$amount' },
          transactionCount: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);
  }
}

export default new PaymentRepository();
