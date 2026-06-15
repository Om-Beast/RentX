
// FleetBookingRequests.jsx
// Pure React (JavaScript) – Fleet Owner Booking Requests page
// ---------------------------------------------------------------
// Technologies: React, TailwindCSS, Axios, Framer Motion
// ---------------------------------------------------------------

import React, { useEffect, useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";

/* -----------------------------------------------------------------
   Helper – format ISO date strings as a readable local date+time
   ----------------------------------------------------------------- */
const formatDate = (iso) =>
  new Date(iso).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

/* -----------------------------------------------------------------
   Main component
   ----------------------------------------------------------------- */
export default function FleetBookingRequests() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Retrieve the JWT token saved in localStorage (key: "token")
  const token = localStorage.getItem("token");

  // ---------------------------------------------------------------
  // Fetch bookings belonging to the logged‑in fleet owner
  // ---------------------------------------------------------------
  const fetchBookings = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(
        "http://localhost:5000/api/bookings/owner-bookings",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      // API assumed to return { success: true, data: [...] } or directly the array
      setBookings(data.bookings || []);
      setError(null);
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message ||
          "Failed to load bookings. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
    const interval = setInterval(fetchBookings, 30000); // refresh every 30 s
    return () => clearInterval(interval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ---------------------------------------------------------------
  // Accept / Reject actions
  // ---------------------------------------------------------------
  const handleAction = async (bookingId, action) => {
    try {
      const endpoint = `http://localhost:5000/api/bookings/${bookingId}/${action}`;
      await axios.patch(
        endpoint,
        {}, // no body needed
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Optimistically update UI
      setBookings((prev) =>
        prev.map((b) =>
          b._id === bookingId
            ? {
                ...b,
                status: action === "confirm" ? "CONFIRMED" : "CANCELLED",
              }
            : b
        )
      );
    } catch (err) {
      console.error(err);
      alert(
        err.response?.data?.message ||
          `Failed to ${action} booking. Please try again.`
      );
    }
  };

  // ---------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-900">
        <span className="text-lg text-white">Loading bookings…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-900">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <section className="min-h-screen bg-gradient-to-br from-indigo-900 via-gray-900 to-black p-6 pb-20 text-white">
      {/* Header */}
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-extrabold tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 to-cyan-400">
          Fleet Owner – Booking Requests
        </h1>
        <p className="mt-2 text-lg text-gray-300">
          Review and manage pending rental requests
        </p>
      </header>

      {/* Grid of booking cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <AnimatePresence>
          {bookings.map((booking) => (
            <motion.div
              key={booking._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="relative rounded-xl bg-white/10 backdrop-blur-xl border border-white/20 p-5 shadow-lg hover:shadow-2xl"
            >
              {/* Gradient accent strip */}
              <div className="absolute -top-1 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-t-xl" />

              <div className="space-y-3">
                {/* Vehicle name */}
                <h2 className="text-xl font-semibold text-white truncate">
                  {booking.vehicle?.name || "Vehicle"}
                </h2>

                {/* Booking details */}
                <div className="text-sm text-gray-300">
                  <p>
                    <span className="font-medium text-gray-200">
                      Customer:
                    </span>{" "}
                    {booking.user?.name || "—"}
                  </p>
                  <p>
                    <span className="font-medium text-gray-200">
                      Email:
                    </span>{" "}
                    {booking.user?.email || "—"}
                  </p>
                  <p>
                    <span className="font-medium text-gray-200">
                      Pickup:
                    </span>{" "}
                    {formatDate(booking.startDate)}
                  </p>
                  <p>
                    <span className="font-medium text-gray-200">
                      Return:
                    </span>{" "}
                    {formatDate(booking.endDate)}
                  </p>
                  <p>
                    <span className="font-medium text-gray-200">
                      Total Amount:
                    </span>{" "}
                    ₹{booking.totalPrice}
                  </p>
                </div>

                {/* Status badge */}
                <div className="mt-2">
                  <span
                    className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${
                      booking.bookingStatus === "PENDING"
                        ? "bg-yellow-500/20 text-yellow-300"
                        : booking.bookingStatus === "CONFIRMED"
                        ? "bg-green-500/20 text-green-300"
                        : booking.bookingStatus === "CANCELLED"
                        ? "bg-red-500/20 text-red-300"
                        : "bg-blue-500/20 text-blue-300"
                    }`}
                  >
                    {booking.bookingStatus}
                  </span>
                </div>

                {/* Action buttons – only for pending bookings */}
                {booking.bookingStatus === "PENDING" && (
                  <div className="mt-4 flex space-x-3">
                    <button
                      onClick={() => handleAction(booking._id, "confirm")}
                      className="flex-1 rounded-lg bg-green-600 hover:bg-green-700 text-white py-2 text-sm font-medium transition-colors"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleAction(booking._id, "reject")}
                      className="flex-1 rounded-lg bg-red-600 hover:bg-red-700 text-white py-2 text-sm font-medium transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Empty state */}
      {bookings.length === 0 && (
        <div className="mt-12 text-center text-gray-400">
          No booking requests at the moment.
        </div>
      )}
    </section>
  );
}
