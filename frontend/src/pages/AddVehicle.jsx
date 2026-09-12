import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../context/AuthContext";
import { Plus, X, Car, MapPin, Fuel, Settings, Users, DollarSign, FileText, Tag } from "lucide-react";

const VEHICLE_TYPES = ["car", "bike", "scooter", "suv", "sedan", "hatchback", "luxury", "ev", "other"];
const FUEL_TYPES = ["petrol", "diesel", "electric", "hybrid", "cng"];
const TRANSMISSION_TYPES = ["manual", "automatic"];
const COMMON_FEATURES = ["AC", "GPS", "Bluetooth", "USB Charging", "Reverse Camera", "Sunroof", "Keyless Entry", "Cruise Control", "Helmet Included", "First Aid Kit"];

const INITIAL_FORM = {
  name: "", brand: "", model: "", year: "",
  type: "car", description: "", pricePerDay: "",
  securityDeposit: "1000", fuelType: "petrol",
  transmission: "manual", seats: "", features: [],
  location: "", city: "", images: [""],
  rules: "", listingStatus: "active",
};

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

export default function AddVehicle() {
  const navigate = useNavigate();
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");

  const set = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: "" }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Vehicle name is required";
    if (!form.brand.trim()) e.brand = "Brand is required";
    if (!form.model.trim()) e.model = "Model is required";
    const yr = parseInt(form.year, 10);
    if (!yr || yr < 2000 || yr > new Date().getFullYear() + 1) e.year = "Valid year required (2000–present)";
    if (!form.type) e.type = "Vehicle type is required";
    if (!form.description.trim() || form.description.length < 20) e.description = "Description must be at least 20 characters";
    const price = parseFloat(form.pricePerDay);
    if (!price || price < 100) e.pricePerDay = "Price must be at least ₹100/day";
    if (!parseInt(form.seats, 10) || parseInt(form.seats, 10) < 1) e.seats = "Seats required";
    if (!form.location.trim()) e.location = "Pickup location required";
    if (!form.city.trim()) e.city = "City required";
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
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...form,
        year: parseInt(form.year, 10),
        pricePerDay: parseFloat(form.pricePerDay),
        securityDeposit: parseFloat(form.securityDeposit) || 1000,
        seats: parseInt(form.seats, 10),
        images: form.images.filter(url => url.trim() !== ""),
      };

      const res = await api.post("/api/vehicles", payload);
      navigate(`/vehicles/${res.data.vehicle._id}`, {
        state: { successMessage: "Vehicle listed successfully! 🎉" },
      });
    } catch (err) {
      setServerError(
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        "Failed to add vehicle. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 pt-20 pb-16 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white tracking-tight">List Your Vehicle</h1>
          <p className="mt-1 text-slate-400 text-sm">Add a vehicle to the RentX marketplace and start earning.</p>
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
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/40 transition"
                  />
                  <FieldError msg={errors[field]} />
                </div>
              ))}

              {/* Type */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Vehicle Type</label>
                <select
                  value={form.type}
                  onChange={e => set("type", e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition"
                >
                  {VEHICLE_TYPES.map(t => (
                    <option key={t} value={t} className="bg-slate-900">{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                  ))}
                </select>
                <FieldError msg={errors.type} />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Description</label>
              <textarea
                value={form.description}
                onChange={e => set("description", e.target.value)}
                rows={3}
                placeholder="Describe your vehicle — condition, highlights, special features... (min 20 characters)"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/40 transition resize-none"
              />
              <div className="flex justify-between mt-1">
                <FieldError msg={errors.description} />
                <span className="text-xs text-slate-600">{form.description.length}/2000</span>
              </div>
            </div>
          </section>

          {/* Pricing */}
          <section className="bg-white/5 border border-white/10 rounded-2xl p-5 sm:p-6">
            <SectionHeading icon={DollarSign} title="Pricing" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Price per Day (₹)</label>
                <input
                  type="number"
                  value={form.pricePerDay}
                  onChange={e => set("pricePerDay", e.target.value)}
                  placeholder="e.g. 1200"
                  min="100"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition"
                />
                <FieldError msg={errors.pricePerDay} />
                <p className="mt-1 text-xs text-slate-600">Base rate — taxes & fees added at checkout</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Security Deposit (₹)</label>
                <input
                  type="number"
                  value={form.securityDeposit}
                  onChange={e => set("securityDeposit", e.target.value)}
                  placeholder="e.g. 1000"
                  min="0"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition"
                />
                <p className="mt-1 text-xs text-slate-600">Refunded after successful return</p>
              </div>
            </div>
          </section>

          {/* Specs */}
          <section className="bg-white/5 border border-white/10 rounded-2xl p-5 sm:p-6">
            <SectionHeading icon={Settings} title="Specifications" />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Fuel Type</label>
                <select
                  value={form.fuelType}
                  onChange={e => set("fuelType", e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition"
                >
                  {FUEL_TYPES.map(f => (
                    <option key={f} value={f} className="bg-slate-900">{f.charAt(0).toUpperCase() + f.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Transmission</label>
                <select
                  value={form.transmission}
                  onChange={e => set("transmission", e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition"
                >
                  {TRANSMISSION_TYPES.map(t => (
                    <option key={t} value={t} className="bg-slate-900">{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Seats</label>
                <input
                  type="number"
                  value={form.seats}
                  onChange={e => set("seats", e.target.value)}
                  placeholder="5"
                  min="1"
                  max="50"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition"
                />
                <FieldError msg={errors.seats} />
              </div>
            </div>

            {/* Features */}
            <div className="mt-4">
              <label className="block text-xs font-medium text-slate-400 mb-2">Features</label>
              <div className="flex flex-wrap gap-2">
                {COMMON_FEATURES.map(f => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => toggleFeature(f)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                      form.features.includes(f)
                        ? "bg-indigo-500/20 border-indigo-500/50 text-indigo-300"
                        : "bg-white/5 border-white/10 text-slate-400 hover:border-white/20"
                    }`}
                  >
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
                <input
                  type="text"
                  value={form.city}
                  onChange={e => set("city", e.target.value)}
                  placeholder="e.g. Mumbai"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition"
                />
                <FieldError msg={errors.city} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Pickup Location</label>
                <input
                  type="text"
                  value={form.location}
                  onChange={e => set("location", e.target.value)}
                  placeholder="e.g. Andheri West, near Metro"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition"
                />
                <FieldError msg={errors.location} />
              </div>
            </div>
          </section>

          {/* Images */}
          <section className="bg-white/5 border border-white/10 rounded-2xl p-5 sm:p-6">
            <SectionHeading icon={Tag} title="Photos" />
            <p className="text-xs text-slate-500 mb-3">Add public image URLs (Unsplash, your CDN, etc.). Up to 6 images.</p>
            <div className="space-y-2">
              {form.images.map((url, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <span className="text-xs text-slate-600 w-4 shrink-0">{idx + 1}</span>
                  <input
                    type="url"
                    value={url}
                    onChange={e => setImage(idx, e.target.value)}
                    placeholder="https://example.com/vehicle-photo.jpg"
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition"
                  />
                  {/* Preview thumbnail if URL looks valid */}
                  {url && url.startsWith("http") && (
                    <img
                      src={url} alt="preview" onError={e => e.currentTarget.style.display = "none"}
                      className="w-10 h-10 rounded-lg object-cover border border-white/10 shrink-0"
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    disabled={form.images.length === 1}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition disabled:opacity-30"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            {form.images.length < 6 && (
              <button
                type="button"
                onClick={addImageField}
                className="mt-3 flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                Add another image
              </button>
            )}
          </section>

          {/* Rules */}
          <section className="bg-white/5 border border-white/10 rounded-2xl p-5 sm:p-6">
            <SectionHeading icon={FileText} title="Rules & Notes" />
            <textarea
              value={form.rules}
              onChange={e => set("rules", e.target.value)}
              rows={2}
              placeholder="Optional: No smoking, no pets, valid driving license required..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition resize-none"
            />
          </section>

          {/* Server error */}
          {serverError && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
              {serverError}
            </div>
          )}

          {/* Submit */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-5 py-3 rounded-xl border border-white/10 text-slate-400 text-sm font-medium hover:bg-white/5 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors"
            >
              {submitting ? "Listing vehicle..." : "List Vehicle"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}