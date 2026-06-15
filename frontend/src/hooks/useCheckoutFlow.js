
import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createBooking, createPaymentOrder, verifyPaymentSignature } from '../api/payment.api';
import { loadRazorpayScript } from '../utils/razorpay.utils';

// Helper to generate a unique key for Idempotency Headers securely
const generateUUID = () => {
  return typeof crypto.randomUUID === 'function' 
    ? crypto.randomUUID() 
    : Math.random().toString(36).substring(2) + Date.now().toString(36);
};

export const useCheckoutFlow = () => {
  // Finite State Machine (FSM) to strictly control the payment flow UI states
  const [checkoutState, setCheckoutState] = useState('IDLE'); 
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  
  // Ref ensures Idempotency Keys survive re-renders.
  // If a network request drops and the user clicks retry, we send the exact SAME keys 
  // to the backend, preventing duplicate bookings or duplicate Razorpay orders.
  const idempotencyKeys = useRef({
    booking: generateUUID(),
    payment: generateUUID()
  });

  const handleCheckout = useCallback(async (bookingDetails) => {
    // 1. Prevent Double Clicks & Overlapping Calls
    const activeStates = ['CREATING_BOOKING', 'INITIALIZING_PAYMENT', 'AWAITING_GATEWAY', 'VERIFYING'];
    if (activeStates.includes(checkoutState)) {
      return; 
    }

    try {
      setError(null);
      setCheckoutState('CREATING_BOOKING');

      // 2. Create Booking
      const bookingRes = await createBooking(bookingDetails, idempotencyKeys.current.booking);
      
      // Strict extraction based on backend schema: { "success": true, "booking": { "_id": "bookingId" } }
      if (!bookingRes.data || !bookingRes.data.success) {
        throw new Error('Booking failed to initialize.');
      }
      const bookingId = bookingRes.data.booking._id;

      // 3. Initialize Razorpay Order
      setCheckoutState('INITIALIZING_PAYMENT');
      const orderRes = await createPaymentOrder(bookingId, idempotencyKeys.current.payment);
      
      // Strict extraction based on backend schema: { "success": true, "data": { "orderId": "...", "amount": 1234, "currency": "INR" } }
      if (!orderRes.data || !orderRes.data.success) {
        throw new Error('Payment order creation failed.');
      }
      const { orderId, amount, currency } = orderRes.data.data;

      // 4. Load Razorpay SDK Script
      const isScriptLoaded = await loadRazorpayScript();
      if (!isScriptLoaded) {
        throw new Error('Failed to load Razorpay payment gateway. Please check your internet connection.');
      }

      // 5. Open Razorpay Checkout Modal
      setCheckoutState('AWAITING_GATEWAY');

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: amount.toString(), // Razorpay expects amount as stringified paise
        currency: currency,
        name: 'RentX',
        description: `Booking #${bookingId.substring(0, 8)}`,
        order_id: orderId,
        handler: async (response) => {

      console.log("RAZORPAY SUCCESS =", response);

      try {
        setCheckoutState('VERIFYING');

        const verifyRes = await verifyPaymentSignature({
          razorpayOrderId: response.razorpay_order_id,
          razorpayPaymentId: response.razorpay_payment_id,
          razorpaySignature: response.razorpay_signature,
        });

        console.log("VERIFY RESPONSE =", verifyRes);

        if (!verifyRes.data || !verifyRes.data.success) {
          throw new Error('Payment verification failed on the server.');
        }

        setCheckoutState('SUCCESS');
        navigate(`/booking-success/${bookingId}`, { replace: true });

      } catch (verifyErr) {
        console.error("VERIFY ERROR =", verifyErr);
        setError('Payment verification failed.');
        setCheckoutState('ERROR');
      }
    },
        modal: {
          ondismiss: () => {
            // Allows the user to click "Pay" again. Safe due to idempotency keys.
            setError('Payment cancelled. You can securely try again.');
            setCheckoutState('ERROR'); 
          }
        },
        theme: {
          color: '#3B82F6' // Standard Tailwind Blue-500
        }
      };

      const rzp = new window.Razorpay(options);
      
      rzp.on('payment.failed', function (response) {
         console.log("PAYMENT FAILED =", response);
        setError(`Payment Failed: ${response.error.description}`);
        setCheckoutState('ERROR');
      });

      rzp.open();

    } catch (err) {
      console.error('Checkout Flow Execution Error:', err);
      // Fallback extraction checks if error came from Axios backend response or local Throw
      setError(err.response?.data?.message || err.message || 'An unexpected error occurred during checkout.');
      setCheckoutState('ERROR');
    }
  }, [checkoutState, navigate]);

  return {
    handleCheckout,
    checkoutState,
    error,
    // Helper boolean explicitly for UI <button disabled={isProcessing}> 
    isProcessing: ['CREATING_BOOKING', 'INITIALIZING_PAYMENT', 'AWAITING_GATEWAY', 'VERIFYING'].includes(checkoutState)
  };
};
