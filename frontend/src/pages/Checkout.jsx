import { useState } from "react";
import { useLocation, Navigate, useNavigate } from "react-router-dom";
import { useCheckoutFlow } from "../hooks/useCheckoutFlow";
import { User, Mail, Phone, IdCard, MapPin, Calendar, Shield, Car, ChevronRight, AlertCircle } from "lucide-react";

function VehicleThumb({ vehicle }) {
  const src = vehicle?.images?.[0];
  const [imgError, setImgError] = useState(false);
  if (src && !imgError) {
    return (
      <img
        src={src} alt={vehicle?.name}
        onError={() => setImgError(true)}
        className="w-24 h-20 sm:w-28 sm:h-24 rounded-xl object-cover border border-white/10 shrink-0"
      />
    );
  }
  return (
    <div className="w-24 h-20 sm:w-28 sm:h-24 rounded-xl bg-slate-800 border border-white/10 flex items-center justify-center shrink-0">
      <Car className="w-8 h-8 text-slate-600" />
    </div>
  );
}

function Field({ icon: Icon, label, name, type = "text", value, onChange, placeholder, required }) {
  return (
    <div>
      <label htmlFor={name} className="flex items-center gap-1.5 text-xs font-medium text-slate-400 mb-1.5">
        <Icon className="w-3.5 h-3.5" />
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <input
        id={name}
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={name}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/40 transition"
      />
    </div>
  );
}

function LineItem({ label, value, bold, highlight }) {
  return (
    <div className={`flex justify-between text-sm ${bold ? "font-bold" : ""}`}>
      <span className={bold ? "text-white" : "text-slate-400"}>{label}</span>
      <span className={highlight ? "text-indigo-300 font-bold text-base" : bold ? "text-white" : "text-slate-200"}>
        {value}
      </span>
    </div>
  );
}

export default function Checkout() {
  const location = useLocation();
  const navigate = useNavigate();
  const bookingData = location.state;

  // Guard: must arrive via navigate with state from VehicleDetails
  if (!bookingData?.vehicle) {
    return <Navigate to="/vehicles" replace />;
  }

  const {
    vehicle,
    rentalDays,
    totalPrice,   // base amount (rentalDays × pricePerDay)
    gst,
    platformFee,
    securityDeposit,
    finalAmount,  // total payable
    pickupDate,
    returnDate,
  } = bookingData;

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    license: "",
    pickup: vehicle?.location || "",
  });

  const { handleCheckout, checkoutState, error, isProcessing } = useCheckoutFlow();

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handlePayment = async () => {
    await handleCheckout({
      vehicleId: vehicle._id,
      pickupDate,
      returnDate,
    });
  };

  const fmt = (n) => (n || 0).toLocaleString("en-IN");
  const fmtDate = (d) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  const stateLabels = {
    CREATING_BOOKING: "Reserving vehicle...",
    INITIALIZING_PAYMENT: "Creating payment order...",
    VERIFYING: "Verifying payment...",
    IDLE: "Proceed to Payment",
  };
  const btnLabel = stateLabels[checkoutState] || "Proceed to Payment";

  return (
    <div className="min-h-screen bg-slate-950 pt-20 pb-16 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-slate-500 hover:text-slate-300 text-sm mb-8 transition-colors"
        >
          ← Back
        </button>

        <h1 className="text-2xl font-bold text-white tracking-tight mb-8">Confirm & Pay</h1>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* LEFT — Booking info form */}
          <div className="lg:col-span-3 space-y-5">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 sm:p-6">
              <h2 className="text-base font-semibold text-white mb-4">Renter Details</h2>
              <div className="space-y-4">
                <Field icon={User} label="Full Name" name="fullName" value={form.fullName} onChange={handleChange}
                  placeholder="As on your driving license" required />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field icon={Mail} label="Email" name="email" type="email" value={form.email} onChange={handleChange}
                    placeholder="you@example.com" required />
                  <Field icon={Phone} label="Phone" name="phone" type="tel" value={form.phone} onChange={handleChange}
                    placeholder="+91 9876543210" required />
                </div>
                <Field icon={IdCard} label="Driving License Number" name="license" value={form.license} onChange={handleChange}
                  placeholder="e.g. MP09-2019-0012345" required />
                <Field icon={MapPin} label="Preferred Pickup Point" name="pickup" value={form.pickup} onChange={handleChange}
                  placeholder={vehicle?.location || "Pickup location"} />
              </div>
            </div>

            {/* Rental dates */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 sm:p-6">
              <h2 className="text-base font-semibold text-white mb-4">Rental Dates</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-xl p-3">
                  <p className="text-xs text-slate-500 mb-1 flex items-center gap-1"><Calendar className="w-3 h-3" />Pickup</p>
                  <p className="text-white font-medium text-sm">{fmtDate(pickupDate)}</p>
                </div>
                <div className="bg-white/5 rounded-xl p-3">
                  <p className="text-xs text-slate-500 mb-1 flex items-center gap-1"><Calendar className="w-3 h-3" />Return</p>
                  <p className="text-white font-medium text-sm">{fmtDate(returnDate)}</p>
                </div>
              </div>
              <p className="mt-3 text-sm text-slate-400">
                Duration: <span className="text-white font-medium">{rentalDays} {rentalDays === 1 ? "day" : "days"}</span>
              </p>
            </div>

            {/* Policy */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <h2 className="text-sm font-semibold text-white mb-3">Cancellation Policy</h2>
              <div className="space-y-2 text-xs text-slate-400">
                <div className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-0.5">✓</span>
                  <span>Cancel <strong className="text-slate-300">48+ hours</strong> before pickup — full refund</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-amber-400 mt-0.5">~</span>
                  <span>Cancel <strong className="text-slate-300">24–48 hours</strong> before pickup — 50% refund</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-red-400 mt-0.5">✕</span>
                  <span>Cancel within <strong className="text-slate-300">24 hours</strong> — no refund</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT — Order summary + pay */}
          <div className="lg:col-span-2">
            <div className="sticky top-24 space-y-4">
              {/* Vehicle card */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <div className="flex gap-3 items-start">
                  <VehicleThumb vehicle={vehicle} />
                  <div className="min-w-0">
                    <h3 className="font-semibold text-white text-sm leading-tight truncate">
                      {vehicle.brand} {vehicle.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">{vehicle.model} · {vehicle.year}</p>
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {vehicle.city}
                    </p>
                    <p className="text-xs text-indigo-400 mt-1">
                      ₹{fmt(vehicle.pricePerDay)}/day × {rentalDays} {rentalDays === 1 ? "day" : "days"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Price breakdown */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <h2 className="text-sm font-semibold text-white mb-4">Price Breakdown</h2>
                <div className="space-y-2.5">
                  <LineItem label="Base Rental" value={`₹${fmt(totalPrice)}`} />
                  <LineItem label="GST (18%)" value={`₹${fmt(gst)}`} />
                  <LineItem label="Platform Fee" value={`₹${fmt(platformFee)}`} />
                  <LineItem label="Security Deposit" value={`₹${fmt(securityDeposit)}`} />
                  <div className="border-t border-white/10 my-2" />
                  <LineItem label="Total Payable" value={`₹${fmt(finalAmount)}`} bold highlight />
                </div>
                <p className="mt-3 text-xs text-slate-600">
                  * Security deposit refunded after vehicle return
                </p>
              </div>

              {/* Error */}
              {error && (
                <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-3.5 py-3 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-400">{error}</p>
                </div>
              )}

              {/* CTA */}
              <button
                onClick={handlePayment}
                disabled={isProcessing}
                className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {btnLabel}
                  </>
                ) : (
                  <>
                    {btnLabel}
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-2 text-xs text-slate-600">
                <Shield className="w-3.5 h-3.5" />
                Secured by Razorpay · PCI DSS compliant
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}