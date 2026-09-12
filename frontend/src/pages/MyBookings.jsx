import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../context/AuthContext";
import {
  Calendar, MapPin, Clock, CheckCircle, XCircle, AlertCircle,
  ChevronRight, Car, Package, RefreshCw
} from "lucide-react";

const STATUS_CONFIG = {
  pending_payment: { label: "Awaiting Payment", color: "amber", icon: Clock },
  payment_pending: { label: "Payment Processing", color: "blue", icon: RefreshCw },
  pending_owner_approval: { label: "Pending Approval", color: "yellow", icon: AlertCircle },
  confirmed: { label: "Confirmed", color: "emerald", icon: CheckCircle },
  active: { label: "Active Rental", color: "indigo", icon: Car },
  completed: { label: "Completed", color: "slate", icon: CheckCircle },
  cancelled: { label: "Cancelled", color: "red", icon: XCircle },
  rejected: { label: "Rejected", color: "red", icon: XCircle },
  expired: { label: "Expired", color: "slate", icon: Clock },
  refund_pending: { label: "Refund Pending", color: "yellow", icon: RefreshCw },
  refunded: { label: "Refunded", color: "emerald", icon: CheckCircle },
};

const COLOUR_CLASSES = {
  amber: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  blue: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  yellow: "bg-yellow-500/15 text-yellow-300 border-yellow-500/30",
  emerald: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  indigo: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30",
  slate: "bg-slate-500/15 text-slate-400 border-slate-500/30",
  red: "bg-red-500/15 text-red-300 border-red-500/30",
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || { label: status, color: "slate", icon: Package };
  const colours = COLOUR_CLASSES[cfg.color];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${colours}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

function VehicleImage({ images, name }) {
  const src = images?.[0] || null;
  if (src) {
    return (
      <img
        src={src} alt={name}
        onError={e => { e.currentTarget.style.display = "none"; e.currentTarget.nextSibling.style.display = "flex"; }}
        className="w-full h-full object-cover"
      />
    );
  }
  return (
    <div className="w-full h-full flex items-center justify-center bg-slate-800">
      <Car className="w-8 h-8 text-slate-600" />
    </div>
  );
}

function BookingCard({ booking, onCancel }) {
  const v = booking.vehicle;
  const canCancel = ["pending_payment", "pending_owner_approval", "confirmed"].includes(booking.bookingStatus);
  const [cancelling, setCancelling] = useState(false);

  const handleCancel = async () => {
    if (!window.confirm || !window.confirm("Cancel this booking? This action cannot be undone.")) {
      // For accessibility — use inline confirm
      if (!cancelling) {
        setCancelling(true);
        return;
      }
    }
    try {
      await onCancel(booking._id);
    } finally {
      setCancelling(false);
    }
  };

  const formatDate = (d) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  const nights = Math.max(1, Math.ceil((new Date(booking.endDate) - new Date(booking.startDate)) / (1000 * 60 * 60 * 24)));

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-colors">
      <div className="flex flex-col sm:flex-row">
        {/* Vehicle Image */}
        <div className="sm:w-44 h-36 sm:h-auto shrink-0 overflow-hidden relative">
          <VehicleImage images={v?.images} name={v?.name} />
          <div style={{ display: "none" }} className="absolute inset-0 flex items-center justify-center bg-slate-800">
            <Car className="w-8 h-8 text-slate-600" />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
            <div>
              <h3 className="font-semibold text-white text-sm sm:text-base">
                {v?.brand} {v?.name}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {v?.city || "—"}
              </p>
            </div>
            <StatusBadge status={booking.bookingStatus} />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
            <div>
              <p className="text-xs text-slate-500 mb-0.5">Pickup</p>
              <p className="text-slate-200 font-medium">{formatDate(booking.startDate)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-0.5">Return</p>
              <p className="text-slate-200 font-medium">{formatDate(booking.endDate)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-0.5">Duration</p>
              <p className="text-slate-200 font-medium">{nights} {nights === 1 ? "day" : "days"}</p>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs text-slate-500">Total Paid</p>
              <p className="font-bold text-white text-base">₹{(booking.totalAmount || booking.pricing?.totalAmount || 0).toLocaleString("en-IN")}</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              {booking.bookingStatus === "completed" && (
                <Link
                  to={`/vehicles/${v?._id}`}
                  className="px-3 py-1.5 rounded-lg border border-white/10 text-xs text-slate-400 hover:text-white hover:border-white/20 transition"
                >
                  Book Again
                </Link>
              )}
              {canCancel && (
                <button
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="px-3 py-1.5 rounded-lg border border-red-500/30 text-xs text-red-400 hover:bg-red-500/10 transition disabled:opacity-50"
                >
                  {cancelling ? "Confirm cancel?" : "Cancel"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [cancelling, setCancelling] = useState(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setError("");
      const res = await api.get("/api/bookings/my-bookings");
      setBookings(res.data.bookings || []);
    } catch (err) {
      setError(err.response?.data?.error?.message || "Failed to load bookings.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (bookingId) => {
    setCancelling(bookingId);
    try {
      await api.patch(`/api/bookings/${bookingId}/cancel`);
      setBookings(prev =>
        prev.map(b => b._id === bookingId ? { ...b, bookingStatus: "cancelled" } : b)
      );
    } catch (err) {
      setError(err.response?.data?.error?.message || "Failed to cancel booking.");
    } finally {
      setCancelling(null);
    }
  };

  const FILTERS = [
    { value: "all", label: "All" },
    { value: "active", label: "Active" },
    { value: "upcoming", label: "Upcoming" },
    { value: "completed", label: "Completed" },
    { value: "cancelled", label: "Cancelled" },
  ];

  const filtered = bookings.filter(b => {
    if (filter === "all") return true;
    if (filter === "active") return b.bookingStatus === "active";
    if (filter === "upcoming") return ["confirmed", "pending_owner_approval", "pending_payment", "payment_pending"].includes(b.bookingStatus);
    if (filter === "completed") return b.bookingStatus === "completed";
    if (filter === "cancelled") return ["cancelled", "rejected", "expired"].includes(b.bookingStatus);
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-950 pt-20 pb-16 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white tracking-tight">My Bookings</h1>
          <p className="mt-1 text-slate-400 text-sm">{bookings.length} booking{bookings.length !== 1 ? "s" : ""} total</p>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1 scrollbar-none">
          {FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                filter === f.value
                  ? "bg-indigo-600 text-white"
                  : "bg-white/5 text-slate-400 hover:bg-white/10 border border-white/10"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">{error}</div>
        )}

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-36 rounded-2xl bg-slate-800 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Calendar className="w-12 h-12 text-slate-700 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-400 mb-2">No bookings yet</h3>
            <p className="text-slate-600 text-sm mb-6">
              {filter === "all" ? "Start exploring vehicles to make your first booking." : `No ${filter} bookings.`}
            </p>
            <Link
              to="/vehicles"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl transition-colors"
            >
              Browse Vehicles <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(booking => (
              <BookingCard
                key={booking._id}
                booking={booking}
                onCancel={handleCancel}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}