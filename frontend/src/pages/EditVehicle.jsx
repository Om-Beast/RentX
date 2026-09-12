import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../context/AuthContext";
import { Car, MapPin, Settings, DollarSign, FileText, X, Plus, Tag, Check } from "lucide-react";

const VEHICLE_TYPES = ["car", "bike", "scooter", "suv", "sedan", "hatchback", "luxury", "ev", "other"];
const FUEL_TYPES = ["petrol", "diesel", "electric", "hybrid", "cng"];
const TRANSMISSION_TYPES = ["manual", "automatic"];
const COMMON_FEATURES = ["AC", "GPS", "Bluetooth", "USB Charging", "Reverse Camera", "Sunroof", "Keyless Entry", "Cruise Control", "Helmet Included", "First Aid Kit"];

const ALLOWED_FIELDS = [
  "name", "brand", "model", "year", "type", "description",
  "pricePerDay", "securityDeposit", "fuelType", "transmission",
  "seats", "features", "location", "city", "images", "isAvailable",
  "listingStatus", "rules",
];

function FieldError({ msg }) {
  if (!msg) return null;
  return <p className="mt-1 text-xs text-red-400">{msg}</p>;
}

function SectionHeading({ icon: Icon, title }) {
  return (
    <div className="flex items-center gap-2 mb-4 pb-2 border-b border-white/10">
      <Icon className="w-4 h-4 text-indigo-400" />
      <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">{title}</h2>
    </div>
  );
}

export default function EditVehicle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const fetchVehicle = async () => {
      try {
        const res = await api.get(`/api/vehicles/${id}`);
        const v = res.data.vehicle;
        setForm({
          name: v.name || "",
          brand: v.brand || "",
          model: v.model || "",
          year: String(v.year || ""),
          type: v.type || "car",
          description: v.description || "",
          pricePerDay: String(v.pricePerDay || ""),
          securityDeposit: String(v.securityDeposit ?? 1000),
          fuelType: v.fuelType || "petrol",
          transmission: v.transmission || "manual",
          seats: String(v.seats || ""),
          features: v.features || [],
          location: v.location || "",
          city: v.city || "",
          images: v.images?.length > 0 ? v.images : [""],
          rules: v.rules || "",
          listingStatus: v.listingStatus || "active",
          isAvailable: v.isAvailable ?? true,
        });
      } catch {
        setServerError("Failed to load vehicle. It may have been deleted.");
      } finally {
        setLoading(false);
      }
    };
    fetchVehicle();
  }, [id]);

  const set = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: "" }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Required";
    if (!form.brand.trim()) e.brand = "Required";
    if (!form.model.trim()) e.model = "Required";
    const yr = parseInt(form.year, 10);
    if (!yr || yr < 2000 || yr > new Date().getFullYear() + 1) e.year = "Valid year required";
    if (form.description.length < 20) e.description = "At least 20 characters";
    if (!parseFloat(form.pricePerDay) || parseFloat(form.pricePerDay) < 100) e.pricePerDay = "Minimum ₹100/day";
    if (!parseInt(form.seats, 10)) e.seats = "Required";
    if (!form.location.trim()) e.location = "Required";
    if (!form.city.trim()) e.city = "Required";
    return e;
  };

  const toggleFeature = (f) => {
    set("features", form.features.includes(f)
      ? form.features.filter(x => x !== f)
      : [...form.features, f]);
  };

  const setImage = (idx, val) => {
    const imgs = [...form.images];
    imgs[idx] = val;
    set("images", imgs);
  };

  const addImageField = () => {
    if (form.images.length < 6) set("images", [...form.images, ""]);
  };

  const removeImage = (idx) => {
    if (form.images.length === 1) return;
    set("images", form.images.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");
    setSaved(false);
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setSubmitting(true);
    try {
      // Only send allowed fields (IDOR protection — server also validates)
      const payload = {};
      ALLOWED_FIELDS.forEach(f => {
        if (form[f] !== undefined) payload[f] = form[f];
      });
      payload.year = parseInt(form.year, 10);
      payload.pricePerDay = parseFloat(form.pricePerDay);
      payload.securityDeposit = parseFloat(form.securityDeposit) || 1000;
      payload.seats = parseInt(form.seats, 10);
      payload.images = form.images.filter(u => u.trim() !== "");
      await api.put(`/api/vehicles/${id}`, payload);
      setSaved(true);
      setTimeout(() => navigate(`/my-vehicles`), 1500);
    } catch (err) {
      setServerError(err.response?.data?.error?.message || "Failed to save changes.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!form) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-400">{serverError || "Vehicle not found."}</p>
          <button onClick={() => navigate("/my-vehicles")} className="mt-4 text-indigo-400 text-sm hover:underline">
            Back to My Vehicles
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 pt-20 pb-16 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Edit Listing</h1>
            <p className="mt-1 text-slate-400 text-sm">{form.name}</p>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <span className="text-xs text-slate-400">Available</span>
              <button
                type="button"
                onClick={() => set("isAvailable", !form.isAvailable)}
                className={`relative w-9 h-5 rounded-full transition-colors ${form.isAvailable ? "bg-indigo-600" : "bg-slate-700"}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${form.isAvailable ? "translate-x-4" : ""}`} />
              </button>
            </label>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <section className="bg-white/5 border border-white/10 rounded-2xl p-5 sm:p-6">
            <SectionHeading icon={Car} title="Vehicle Info" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: "Vehicle Name", field: "name", placeholder: "e.g. Honda City ZX" },
                { label: "Brand", field: "brand", placeholder: "e.g. Honda" },
                { label: "Model", field: "model", placeholder: "e.g. City ZX CVT" },
                { label: "Year", field: "year", placeholder: "e.g. 2022", type: "number" },
              ].map(({ label, field, placeholder, type = "text" }) => (
                <div key={field}>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">{label}</label>
                  <input
                    type={type}
                    value={form[field]}
                    onChange={e => set(field, e.target.value)}
                    placeholder={placeholder}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition"
                  />
                  <FieldError msg={errors[field]} />
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Vehicle Type</label>
                <select value={form.type} onChange={e => set("type", e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition">
                  {VEHICLE_TYPES.map(t => <option key={t} value={t} className="bg-slate-900">{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Listing Status</label>
                <select value={form.listingStatus} onChange={e => set("listingStatus", e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition">
                  {["active", "paused", "draft"].map(s => <option key={s} value={s} className="bg-slate-900">{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                </select>
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Description</label>
              <textarea value={form.description} onChange={e => set("description", e.target.value)} rows={3}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition resize-none" />
              <FieldError msg={errors.description} />
            </div>
          </section>

          {/* Pricing */}
          <section className="bg-white/5 border border-white/10 rounded-2xl p-5 sm:p-6">
            <SectionHeading icon={DollarSign} title="Pricing" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Price per Day (₹)</label>
                <input type="number" value={form.pricePerDay} onChange={e => set("pricePerDay", e.target.value)} min="100"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition" />
                <FieldError msg={errors.pricePerDay} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Security Deposit (₹)</label>
                <input type="number" value={form.securityDeposit} onChange={e => set("securityDeposit", e.target.value)} min="0"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition" />
              </div>
            </div>
          </section>

          {/* Specs */}
          <section className="bg-white/5 border border-white/10 rounded-2xl p-5 sm:p-6">
            <SectionHeading icon={Settings} title="Specifications" />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Fuel Type</label>
                <select value={form.fuelType} onChange={e => set("fuelType", e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition">
                  {FUEL_TYPES.map(f => <option key={f} value={f} className="bg-slate-900">{f.charAt(0).toUpperCase() + f.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Transmission</label>
                <select value={form.transmission} onChange={e => set("transmission", e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition">
                  {TRANSMISSION_TYPES.map(t => <option key={t} value={t} className="bg-slate-900">{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Seats</label>
                <input type="number" value={form.seats} onChange={e => set("seats", e.target.value)} min="1" max="50"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition" />
                <FieldError msg={errors.seats} />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-xs font-medium text-slate-400 mb-2">Features</label>
              <div className="flex flex-wrap gap-2">
                {COMMON_FEATURES.map(f => (
                  <button key={f} type="button" onClick={() => toggleFeature(f)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                      form.features.includes(f)
                        ? "bg-indigo-500/20 border-indigo-500/50 text-indigo-300"
                        : "bg-white/5 border-white/10 text-slate-400 hover:border-white/20"
                    }`}>
                    {f}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Location */}
          <section className="bg-white/5 border border-white/10 rounded-2xl p-5 sm:p-6">
            <SectionHeading icon={MapPin} title="Location" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">City</label>
                <input type="text" value={form.city} onChange={e => set("city", e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition" />
                <FieldError msg={errors.city} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Pickup Location</label>
                <input type="text" value={form.location} onChange={e => set("location", e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition" />
                <FieldError msg={errors.location} />
              </div>
            </div>
          </section>

          {/* Images */}
          <section className="bg-white/5 border border-white/10 rounded-2xl p-5 sm:p-6">
            <SectionHeading icon={Tag} title="Photos" />
            <div className="space-y-2">
              {form.images.map((url, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <span className="text-xs text-slate-600 w-4 shrink-0">{idx + 1}</span>
                  <input type="url" value={url} onChange={e => setImage(idx, e.target.value)}
                    placeholder="https://example.com/photo.jpg"
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition" />
                  {url && url.startsWith("http") && (
                    <img src={url} alt="" onError={e => e.currentTarget.style.display = "none"}
                      className="w-10 h-10 rounded-lg object-cover border border-white/10 shrink-0" />
                  )}
                  <button type="button" onClick={() => removeImage(idx)} disabled={form.images.length === 1}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition disabled:opacity-30">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            {form.images.length < 6 && (
              <button type="button" onClick={addImageField}
                className="mt-3 flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition">
                <Plus className="w-3.5 h-3.5" />Add another image
              </button>
            )}
          </section>

          {/* Rules */}
          <section className="bg-white/5 border border-white/10 rounded-2xl p-5 sm:p-6">
            <SectionHeading icon={FileText} title="Rules & Notes" />
            <textarea value={form.rules} onChange={e => set("rules", e.target.value)} rows={2}
              placeholder="No smoking, valid license required..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition resize-none" />
          </section>

          {serverError && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">{serverError}</div>
          )}

          {saved && (
            <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 text-sm text-emerald-400 flex items-center gap-2">
              <Check className="w-4 h-4" /> Changes saved! Redirecting...
            </div>
          )}

          <div className="flex gap-3">
            <button type="button" onClick={() => navigate("/my-vehicles")}
              className="px-5 py-3 rounded-xl border border-white/10 text-slate-400 text-sm font-medium hover:bg-white/5 transition">
              Cancel
            </button>
            <button type="submit" disabled={submitting}
              className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold transition-colors">
              {submitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}