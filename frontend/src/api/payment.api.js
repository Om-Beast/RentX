import axios from 'axios';

// Configure your base axios instance as needed
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
});

// Assuming you have a standard interceptor for JWT authentication
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Expected Backend Response:
 * { "success": true, "booking": { "_id": "..." } }
 */
export const createBooking = async (bookingData, idempotencyKey) => {
  const response = await API.post('/api/bookings', bookingData, {
    headers: { 'x-idempotency-key': idempotencyKey }
  });
  return response; // Returning raw axios response to extract strictly in the hook
};

/**
 * Expected Backend Response:
 * { "success": true, "message": "...", "data": { "orderId": "...", "amount": 1234, "currency": "INR" } }
 */
export const createPaymentOrder = async (bookingId, idempotencyKey) => {
  const response = await API.post('/api/payments/create-order', { bookingId }, {
    headers: { 'x-idempotency-key': idempotencyKey }
  });
  return response;
};

/**
 * Expected Backend Response:
 * { "success": true, "message": "...", "data": { "paymentId": "...", "status": "paid" } }
 */
export const verifyPaymentSignature = async (verificationData) => {
  const response = await API.post('/api/payments/verify', verificationData);
  return response;
};