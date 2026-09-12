import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../context/AuthContext";
import { Car, CheckCircle, XCircle, Clock, AlertCircle, RefreshCw } from "lucide-react";

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const STATUS_CONFIG = {
  pending_owner_approval: { label: "Awaiting Your Action", color: "yellow", icon: Clock },
  confirmed: { label: "Approved", color: "emerald", icon: CheckCircle },
  rejected: { label: "Rejected", color: "red", icon: XCircle },
  cancelled: { label: "Cancelled by Customer", color: "slate", icon: XCircle },
  active: { label: "Active Rental", color: "indigo", icon: Car },
  completed: { label: "Completed", color: "slate", icon: CheckCircle },
  pending_payment: { label: "Awaiting Payment", color: "amber", icon: Clock },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || { label: status, color: "slate", icon: Clock };
  const Icon = cfg.icon;
  const colors = {
    yellow: "bg-yellow-500/15 text-yellow-300 border-yellow-500/30",
    emerald: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    red: "bg-red-500/15 text-red-300 border-red-500/30",
    slate: "bg-slate-500/15 text-slate-400 border-slate-500/30",
    indigo: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30",
    amber: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${colors[cfg.color]}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

export default function FleetBookingRequests() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [actioning, setActioning] = useState(null);

  const fetchBookings = async () => {
    try {
      setError("");
      const { data } = await api.get("/api/bookings/owner-bookings");
      setBookings(data.bookings || []);
    } catch (err) {
      setError(err.response?.data?.error?.message || "Failed to load bookings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
    const interval = setInterval(fetchBookings, 30000); // poll every 30s
    return () => clearInterval(interval);
  }, []);

  const handleAction = async (bookingId, action) => {
    setActioning(bookingId + action);
    setActionError("");
    try {
      await api.patch(`/api/bookings/${bookingId}/${action}`);
      // Optimistic update with correct status values from booking model
      const newStatus = action === "confirm" ? "confirmed" : "rejected";
      setBookings(prev =>
        prev.map(b => b._id === bookingId ? { ...b, bookingStatus: newStatus } : b)
      );
    } catch (err) {
      setActionError(err.response?.data?.error?.message || `Failed to ${action} booking.`);
    } finally {
      setActioning(null);
    }
  };

  const pendingCount = bookings.filter(b => b.bookingStatus === "pending_owner_approval").length;

  return (
    <div className="min-h-screen bg-slate-950 pt-20 pb-16 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Booking Requests</h1>
            <p className="mt-1 text-slate-400 text-sm">
              {pendingCount > 0
                ? `${pendingCount} request${pendingCount !== 1 ? "s" : ""} awaiting your action`
                : "All requests processed"}
            </p>
          </div>
          <button
            onClick={fetchBookings}
            className="p-2 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:border-white/20 transition"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {actionError && (
          <div className="mb-4 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 flex items-center gap-2 text-sm text-red-400">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {actionError}
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">{error}</div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-40 rounded-2xl bg-slate-800 animate-pulse" />)}
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-20">
            <Car className="w-12 h-12 text-slate-700 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-400 mb-2">No booking requests yet</h3>
            <p className="text-slate-600 text-sm">Requests will appear here when customers book your vehicles.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence>
              {bookings.map(booking => {
                const isPending = booking.bookingStatus === "pending_owner_approval";
                const nights = Math.max(1, Math.ceil((new Date(booking.endDate) - new Date(booking.startDate)) / (1000 * 60 * 60 * 24)));
                const amount = booking.totalAmount || booking.pricing?.totalAmount || 0;

                return (
                  <motion.div
                    key={booking._id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.25 }}
                    className={`relative bg-white/5 border rounded-2xl p-4 ${
                      isPending ? "border-yellow-500/30 shadow-yellow-500/10 shadow-lg" : "border-white/10"
                    }`}
                  >
                    {/* Accent strip for pending */}
                    {isPending && (
                      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-yellow-500 to-amber-500 rounded-t-2xl" />
                    )}

                    <div className="space-y-3">
                      {/* Vehicle */}
                      <div>
                        <h2 className="font-semibold text-white text-sm truncate">
                          {booking.vehicle?.brand} {booking.vehicle?.name}
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">{booking.vehicle?.type} · {booking.vehicle?.city}</p>
                      </div>

                      {/* Customer */}
                      <div className="bg-white/[0.03] rounded-xl p-3 space-y-1">
                        <p className="text-sm text-white font-medium">{booking.user?.name || "—"}</p>
                        <p className="text-xs text-slate-500">{booking.user?.email || "—"}</p>
                        {booking.user?.trustScore && (
                          <p className="text-xs text-indigo-400">Trust Score: {booking.user.trustScore}/1000</p>
                        )}
                      </div>

                      {/* Dates */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <p className="text-slate-600 mb-0.5">Pickup</p>
                          <p className="text-slate-300 font-medium">{formatDate(booking.startDate)}</p>
                        </div>
                        <div>
                          <p className="text-slate-600 mb-0.5">Return</p>
                          <p className="text-slate-300 font-medium">{formatDate(booking.endDate)}</p>
                        </div>
                      </div>

                      {/* Amount + duration */}
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-slate-600">{nights} {nights === 1 ? "day" : "days"}</p>
                          <p className="text-sm font-bold text-white">₹{amount.toLocaleString("en-IN")}</p>
                        </div>
                        <StatusBadge status={booking.bookingStatus} />
                      </div>

                      {/* Action buttons — only for pending */}
                      {isPending && (
                        <div className="flex gap-2 pt-1">
                          <button
                            onClick={() => handleAction(booking._id, "confirm")}
                            disabled={actioning !== null}
                            className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1"
                          >
                            {actioning === booking._id + "confirm" ? (
                              <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                              <CheckCircle className="w-3.5 h-3.5" />
                            )}
                            Accept
                          </button>
                          <button
                            onClick={() => handleAction(booking._id, "reject")}
                            disabled={actioning !== null}
                            className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1"
                          >
                            {actioning === booking._id + "reject" ? (
                              <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                              <XCircle className="w-3.5 h-3.5" />
                            )}
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
