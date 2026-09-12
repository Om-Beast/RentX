/**
 * payment.api.js — Payment and booking API calls.
 *
 * Uses the shared `api` axios instance from AuthContext, which:
 * - Reads the JWT from localStorage under the key 'rentx_token'
 * - Adds 'Authorization: Bearer <token>' automatically to every request
 * - Has the correct baseURL already set
 *
 * We never read localStorage directly here — that's the AuthContext's job.
 */
import { api } from "../context/AuthContext";

/**
 * Create a booking reservation.
 *
 * Expected Backend Response:
 * { "success": true, "booking": { "_id": "..." } }
 *
 * @param {object} bookingData - { vehicleId, startDate, endDate }
 * @param {string} idempotencyKey - UUID for deduplication (server ignores duplicate keys)
 */
export const createBooking = async (bookingData, idempotencyKey) => {
  const response = await api.post("/api/bookings", bookingData, {
    headers: { "x-idempotency-key": idempotencyKey },
  });
  return response; // raw axios response — hook extracts .data strictly
};

/**
 * Create a Razorpay payment order for a given booking.
 *
 * Expected Backend Response:
 * { "success": true, "data": { "orderId": "...", "amount": 1234, "currency": "INR" } }
 *
 * @param {string} bookingId
 * @param {string} idempotencyKey
 */
export const createPaymentOrder = async (bookingId, idempotencyKey) => {
  const response = await api.post(
    "/api/payments/create-order",
    { bookingId },
    { headers: { "x-idempotency-key": idempotencyKey } }
  );
  return response;
};

/**
 * Verify Razorpay payment signature on the server.
 *
 * Expected Backend Response:
 * { "success": true, "data": { "paymentId": "...", "status": "paid" } }
 *
 * @param {object} verificationData - { razorpayOrderId, razorpayPaymentId, razorpaySignature }
 */
export const verifyPaymentSignature = async (verificationData) => {
  const response = await api.post("/api/payments/verify", verificationData);
  return response;
};