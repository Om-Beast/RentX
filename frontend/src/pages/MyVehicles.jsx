import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../context/AuthContext";
import { Car, Eye, Pencil, Trash2, ToggleLeft, ToggleRight, Plus, AlertCircle } from "lucide-react";

const TYPE_COLOURS = {
  car: "bg-blue-500/15 text-blue-300",
  suv: "bg-emerald-500/15 text-emerald-300",
  sedan: "bg-cyan-500/15 text-cyan-300",
  hatchback: "bg-teal-500/15 text-teal-300",
  bike: "bg-orange-500/15 text-orange-300",
  scooter: "bg-amber-500/15 text-amber-300",
  luxury: "bg-purple-500/15 text-purple-300",
  ev: "bg-green-500/15 text-green-300",
  other: "bg-slate-500/15 text-slate-400",
};

function VehicleImage({ images, name }) {
  const src = images?.[0];
  if (src) {
    return (
      <img
        src={src} alt={name}
        onError={e => { e.currentTarget.style.display = "none"; e.currentTarget.nextSibling.style.display = "flex"; }}
        className="w-full h-full object-cover"
      />
    );
  }
  return null;
}

function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
        <div className="flex items-start gap-3 mb-5">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <p className="text-slate-200 text-sm">{message}</p>
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-400 text-sm hover:bg-white/5 transition">
            Cancel
          </button>
          <button onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-medium transition">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MyVehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [togglingId, setTogglingId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      setError("");
      const res = await api.get("/api/vehicles/my-vehicles");
      setVehicles(res.data.vehicles || []);
    } catch (err) {
      setError(err.response?.data?.error?.message || "Failed to load vehicles.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    setConfirmDelete(null);
    setDeletingId(id);
    try {
      await api.delete(`/api/vehicles/${id}`);
      setVehicles(prev => prev.filter(v => v._id !== id));
    } catch (err) {
      setError(err.response?.data?.error?.message || "Failed to delete vehicle.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggle = async (id, currentAvailability) => {
    setTogglingId(id);
    try {
      const res = await api.patch(`/api/vehicles/${id}/toggle-availability`);
      setVehicles(prev =>
        prev.map(v => v._id === id ? { ...v, isAvailable: res.data.vehicle?.isAvailable ?? !currentAvailability } : v)
      );
    } catch (err) {
      setError(err.response?.data?.error?.message || "Failed to update availability.");
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 pt-20 pb-16 px-4">
      {confirmDelete && (
        <ConfirmDialog
          message="Are you sure you want to delete this vehicle? This action cannot be undone."
          onConfirm={() => handleDelete(confirmDelete)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">My Fleet</h1>
            <p className="mt-1 text-slate-400 text-sm">{vehicles.length} vehicle{vehicles.length !== 1 ? "s" : ""} listed</p>
          </div>
          <Link
            to="/add-vehicle"
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Vehicle
          </Link>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="h-32 rounded-2xl bg-slate-800 animate-pulse" />)}
          </div>
        ) : vehicles.length === 0 ? (
          <div className="text-center py-20">
            <Car className="w-12 h-12 text-slate-700 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-400 mb-2">No vehicles listed yet</h3>
            <p className="text-slate-600 text-sm mb-6">Add your first vehicle to start earning from the RentX marketplace.</p>
            <Link
              to="/add-vehicle"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl transition-colors"
            >
              <Plus className="w-4 h-4" />
              List Your First Vehicle
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {vehicles.map(v => (
              <div
                key={v._id}
                className={`bg-white/5 border rounded-2xl overflow-hidden transition-colors ${
                  deletingId === v._id ? "opacity-40 pointer-events-none" : "border-white/10 hover:border-white/20"
                }`}
              >
                <div className="flex flex-col sm:flex-row">
                  {/* Image */}
                  <div className="sm:w-40 h-28 sm:h-auto shrink-0 overflow-hidden relative bg-slate-800">
                    <VehicleImage images={v.images} name={v.name} />
                    <div className="absolute inset-0 flex items-center justify-center" style={{ display: v.images?.[0] ? "none" : "flex" }}>
                      <Car className="w-8 h-8 text-slate-600" />
                    </div>
                    {/* Availability overlay */}
                    {!v.isAvailable && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="text-xs text-white font-medium bg-slate-900/80 px-2 py-1 rounded-full">Unavailable</span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-white text-sm sm:text-base truncate">{v.brand} {v.name}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${TYPE_COLOURS[v.type] || TYPE_COLOURS.other}`}>
                          {v.type}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          v.listingStatus === "active" ? "bg-emerald-500/15 text-emerald-300" : "bg-slate-500/15 text-slate-400"
                        }`}>
                          {v.listingStatus}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{v.city} · ₹{v.pricePerDay?.toLocaleString("en-IN")}/day · {v.seats} seats</p>
                      {v.rating > 0 && (
                        <p className="text-xs text-amber-400 mt-1">★ {v.rating.toFixed(1)} ({v.reviewCount} reviews)</p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-wrap shrink-0">
                      {/* Toggle availability */}
                      <button
                        onClick={() => handleToggle(v._id, v.isAvailable)}
                        disabled={togglingId === v._id}
                        title={v.isAvailable ? "Mark unavailable" : "Mark available"}
                        className={`p-2 rounded-xl border transition-colors ${
                          v.isAvailable
                            ? "border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                            : "border-slate-500/30 text-slate-500 hover:bg-slate-500/10"
                        } ${togglingId === v._id ? "opacity-50" : ""}`}
                      >
                        {v.isAvailable ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                      </button>

                      {/* View */}
                      <Link
                        to={`/vehicles/${v._id}`}
                        className="p-2 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:border-white/20 transition-colors"
                        title="View listing"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>

                      {/* Edit */}
                      <Link
                        to={`/edit-vehicle/${v._id}`}
                        className="p-2 rounded-xl border border-white/10 text-slate-400 hover:text-indigo-400 hover:border-indigo-500/30 transition-colors"
                        title="Edit vehicle"
                      >
                        <Pencil className="w-4 h-4" />
                      </Link>

                      {/* Delete */}
                      <button
                        onClick={() => setConfirmDelete(v._id)}
                        title="Delete vehicle"
                        className="p-2 rounded-xl border border-white/10 text-slate-400 hover:text-red-400 hover:border-red-500/30 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}