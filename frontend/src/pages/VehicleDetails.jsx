import { useState, useEffect } from "react";
import {
  useParams,
  Link,
  useNavigate,
} from "react-router-dom";
import { api } from "../context/AuthContext";
import { Car } from "lucide-react";

export default function VehicleDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");

  const [pickupDate, setPickupDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    const fetchVehicle = async () => {
      try {
        // Public endpoint — api instance still works (no auth required for GET)
        const res = await api.get(`/api/vehicles/${id}`);
        setVehicle(res.data.vehicle);
      } catch (err) {
        setFetchError(err.response?.data?.error?.message || "Vehicle not found.");
      } finally {
        setLoading(false);
      }
    };

    fetchVehicle();
  }, [id]);

  const today = new Date();
  today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
  const minDate = today.toISOString().split("T")[0];

  const calculateDays = () => {
    if (!pickupDate || !returnDate) return 0;
    const start = new Date(pickupDate);
    const end = new Date(returnDate);
    const diff = (end - start) / (1000 * 60 * 60 * 24);
    return diff > 0 ? diff : 0;
  };

  const rentalDays = calculateDays();

  // Frontend computes an estimate for display only.
  // Backend always recomputes authoritatively on booking creation.
  const pricePerDay = vehicle?.pricePerDay || 0;
  const totalPrice = rentalDays * pricePerDay;
  const gst = Math.round(totalPrice * 0.18);
  const platformFee = 99;
  const securityDeposit = vehicle?.securityDeposit ?? 1000;
  const finalAmount = rentalDays > 0 ? totalPrice + gst + platformFee + securityDeposit : 0;

  // Vehicle image: use first image from array, fall back to Car icon
  const vehicleImageSrc = vehicle?.images?.[0] || null;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#05060a] flex items-center justify-center relative overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-600/20 rounded-full blur-[120px]" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px]" />
        <div className="relative bg-white/5 backdrop-blur-xl rounded-2xl px-8 py-6 shadow-2xl border border-white/10">
          <div className="text-lg sm:text-xl font-semibold text-slate-200 animate-pulse tracking-wide">
            Loading...
          </div>
        </div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="min-h-screen bg-[#05060a] flex items-center justify-center relative overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-red-600/10 rounded-full blur-[120px]" />
        <div className="relative bg-white/5 backdrop-blur-xl rounded-2xl px-8 py-6 shadow-2xl border border-white/10">
          <h2 className="text-xl sm:text-2xl font-bold text-red-400 text-center">
            Vehicle Not Found
          </h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#05060a] relative overflow-hidden">
      {/* Floating background glows */}
      <div className="pointer-events-none absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[140px]" />
      <div className="pointer-events-none absolute top-[20%] right-[-15%] w-[450px] h-[450px] bg-purple-600/20 rounded-full blur-[140px]" />
      <div className="pointer-events-none absolute bottom-[-15%] left-[20%] w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[140px]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-12">
        <Link
          to="/vehicles"
          className="inline-flex items-center gap-2 text-sm sm:text-base font-medium text-slate-300 hover:text-white transition-all duration-300 hover:gap-3 group"
        >
          <span className="transition-transform duration-300 group-hover:-translate-x-1">←</span>
          Back to Vehicles
        </Link>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-10 xl:gap-12 mt-6 sm:mt-8 items-start">
          {/* LEFT COLUMN - IMAGE + INFO */}
          <div>
            {/* IMAGE */}
            <div className="group relative overflow-hidden rounded-3xl p-[1px] bg-gradient-to-br from-indigo-500/40 via-white/10 to-purple-500/40 shadow-2xl shadow-black/40">
              <div className="relative overflow-hidden rounded-[calc(1.5rem-1px)] bg-white/5 backdrop-blur-xl">
                {vehicleImageSrc && !imgError ? (
                  <img
                    src={vehicleImageSrc}
                    alt={vehicle.name}
                    onError={() => setImgError(true)}
                    className="w-full h-56 sm:h-72 md:h-80 lg:h-[450px] object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                  />
                ) : (
                  <div className="w-full h-56 sm:h-72 md:h-80 lg:h-[450px] flex items-center justify-center bg-slate-800">
                    <Car className="w-20 h-20 text-slate-600" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

                {/* Badges over image */}
                <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 bg-emerald-400/15 text-emerald-300 border border-emerald-400/30 px-3 py-1 rounded-full text-xs sm:text-sm font-medium backdrop-blur-md shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Available Now
                  </span>

                  <span className="inline-flex items-center gap-1.5 bg-indigo-400/15 text-indigo-200 border border-indigo-400/30 px-3 py-1 rounded-full text-xs sm:text-sm font-medium backdrop-blur-md shadow-sm">
                    ✓ Verified
                  </span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 mt-5">

            <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">

            <h2 className="text-yellow-400 text-2xl font-bold">
            {vehicle.rating > 0 ? `${vehicle.rating.toFixed(1)}★` : "—"}
            </h2>

            <p className="text-slate-400 text-xs">
            Rating
            </p>

            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">

            <h2 className="text-cyan-300 text-2xl font-bold">
            {vehicle.reviewCount || 0}
            </h2>

            <p className="text-slate-400 text-xs">
            Reviews
            </p>

            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">

            <h2 className="text-green-400 text-2xl font-bold">
            ✓
            </h2>

            <p className="text-slate-400 text-xs">
            Verified Owner
            </p>

            </div>

            </div>

            {/* NAME / BRAND / RATING / LOCATION */}
            <div className="mt-6 sm:mt-8">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight">
                  {vehicle.name}
                </h1>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 text-sm sm:text-base">
                <span className="text-slate-400 capitalize">
                  {vehicle.brand ? vehicle.brand + " · " : ""}{vehicle.type}
                </span>

                <span className="inline-flex items-center gap-1 text-amber-300 font-medium">
                  ★ {vehicle.rating || "4.8"}
                </span>

                {vehicle.location && (
                  <span className="inline-flex items-center gap-1 text-slate-400">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 21s7-6.5 7-11.5A7 7 0 0 0 5 9.5C5 14.5 12 21 12 21z" />
                      <circle cx="12" cy="9.5" r="2.5" />
                    </svg>
                    {vehicle.location}
                  </span>
                )}
              </div>

              {vehicle.description && (
                <p className="text-slate-400 mt-4 text-sm sm:text-base leading-relaxed max-w-xl">
                  {vehicle.description}
                </p>
              )}

              <div className="mt-6 inline-flex items-baseline gap-2 px-5 py-3 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg">
                <span className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-indigo-300 to-purple-300 bg-clip-text text-transparent">
                  ₹{(vehicle.pricePerDay || 0).toLocaleString("en-IN")}
                </span>
                <span className="text-slate-400 text-base sm:text-lg">/ day</span>
              </div>
            </div>

            {/* SPECS */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mt-6 sm:mt-8">
              <div className="group bg-white/5 backdrop-blur-xl p-4 sm:p-5 rounded-2xl border border-white/10 shadow-sm hover:shadow-lg hover:border-indigo-400/30 hover:-translate-y-1 transition-all duration-300">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/15 flex items-center justify-center text-indigo-300 mb-3">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 22V12a2 2 0 0 1 2-2h1l2-4h6l2 4h1a2 2 0 0 1 2 2v10" />
                    <path d="M3 15h12" />
                    <circle cx="6.5" cy="18.5" r="1.5" />
                    <circle cx="14.5" cy="18.5" r="1.5" />
                    <path d="M17 9v3a2 2 0 0 0 2 2h1" />
                  </svg>
                </div>
                <p className="text-slate-500 text-xs sm:text-sm uppercase tracking-wide">Fuel</p>
                <p className="font-semibold text-white mt-1 text-sm sm:text-base">
                  {vehicle.fuelType || "N/A"}
                </p>
              </div>

              <div className="group bg-white/5 backdrop-blur-xl p-4 sm:p-5 rounded-2xl border border-white/10 shadow-sm hover:shadow-lg hover:border-indigo-400/30 hover:-translate-y-1 transition-all duration-300">
                <div className="w-9 h-9 rounded-xl bg-purple-500/15 flex items-center justify-center text-purple-300 mb-3">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 3v3M12 18v3M3 12h3M18 12h3" />
                  </svg>
                </div>
                <p className="text-slate-500 text-xs sm:text-sm uppercase tracking-wide">Transmission</p>
                <p className="font-semibold text-white mt-1 text-sm sm:text-base">
                  {vehicle.transmission || "N/A"}
                </p>
              </div>

              <div className="group bg-white/5 backdrop-blur-xl p-4 sm:p-5 rounded-2xl border border-white/10 shadow-sm hover:shadow-lg hover:border-indigo-400/30 hover:-translate-y-1 transition-all duration-300">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/15 flex items-center justify-center text-cyan-300 mb-3">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <p className="text-slate-500 text-xs sm:text-sm uppercase tracking-wide">Seats</p>
                <p className="font-semibold text-white mt-1 text-sm sm:text-base">
                  {vehicle.seats || "N/A"}
                </p>
              </div>

              <div className="group bg-white/5 backdrop-blur-xl p-4 sm:p-5 rounded-2xl border border-white/10 shadow-sm hover:shadow-lg hover:border-indigo-400/30 hover:-translate-y-1 transition-all duration-300">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-300 mb-3">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <path d="M16 2v4M8 2v4M3 10h18" />
                  </svg>
                </div>
                <p className="text-slate-500 text-xs sm:text-sm uppercase tracking-wide">Year</p>
                <p className="font-semibold text-white mt-1 text-sm sm:text-base">
                  {vehicle.year || "N/A"}
                </p>
              </div>

              <div className="group bg-white/5 backdrop-blur-xl p-4 sm:p-5 rounded-2xl border border-white/10 shadow-sm hover:shadow-lg hover:border-indigo-400/30 hover:-translate-y-1 transition-all duration-300">
                <div className="w-9 h-9 rounded-xl bg-rose-500/15 flex items-center justify-center text-rose-300 mb-3">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 13l2-6a2 2 0 0 1 2-1h10a2 2 0 0 1 2 1l2 6" />
                    <path d="M5 13h14v5H5z" />
                    <circle cx="7.5" cy="18" r="1.2" />
                    <circle cx="16.5" cy="18" r="1.2" />
                  </svg>
                </div>
                <p className="text-slate-500 text-xs sm:text-sm uppercase tracking-wide">Vehicle Type</p>
                <p className="font-semibold text-white mt-1 text-sm sm:text-base capitalize">
                  {vehicle.type || "N/A"}
                </p>
              </div>

              <div className="group bg-white/5 backdrop-blur-xl p-4 sm:p-5 rounded-2xl border border-white/10 shadow-sm hover:shadow-lg hover:border-indigo-400/30 hover:-translate-y-1 transition-all duration-300">
                <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-300 mb-3">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 21s7-6.5 7-11.5A7 7 0 0 0 5 9.5C5 14.5 12 21 12 21z" />
                    <circle cx="12" cy="9.5" r="2.5" />
                  </svg>
                </div>
                <p className="text-slate-500 text-xs sm:text-sm uppercase tracking-wide">Location</p>
                <p className="font-semibold text-white mt-1 text-sm sm:text-base">
                  {vehicle.location || "N/A"}
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN - BOOKING CARD (sticky on desktop) */}
          <div className="lg:sticky lg:top-8">
            <div className="relative rounded-3xl p-[1px] bg-gradient-to-br from-indigo-500/40 via-white/10 to-purple-500/40 shadow-2xl shadow-black/40">
              <div className="bg-white/5 backdrop-blur-2xl rounded-[calc(1.5rem-1px)] p-5 sm:p-6 lg:p-7">
                <h3 className="font-semibold text-lg sm:text-xl text-white mb-4 sm:mb-5 tracking-tight">
                  Select Rental Dates
                </h3>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-slate-400 mb-1.5">
                      Pickup Date
                    </label>
                    <input
                      type="date"
                      min={minDate}
                      value={pickupDate}
                      onChange={(e) =>
                        setPickupDate(e.target.value)
                      }
                      className="w-full border border-white/10 p-3 sm:p-3.5 rounded-xl bg-white/5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-400/40 focus:border-indigo-400/60 transition-shadow duration-200 [color-scheme:dark]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-slate-400 mb-1.5">
                      Return Date
                    </label>
                    <input
                      type="date"
                      min={pickupDate || minDate}
                      value={returnDate}
                      onChange={(e) =>
                        setReturnDate(e.target.value)
                      }
                      className="w-full border border-white/10 p-3 sm:p-3.5 rounded-xl bg-white/5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-400/40 focus:border-indigo-400/60 transition-shadow duration-200 [color-scheme:dark]"
                    />
                  </div>
                </div>

                <div className="mt-4 flex flex-col sm:flex-row sm:gap-6 gap-1 text-sm text-indigo-300 font-medium">
                  <div>
                    Pickup: {pickupDate || "Not Selected"}
                  </div>

                  <div>
                    Return: {returnDate || "Not Selected"}
                  </div>
                </div>

                <div className="mt-5 sm:mt-6 pt-5 sm:pt-6 border-t border-white/10 space-y-2.5 text-sm sm:text-base text-slate-300">
                  <div className="flex justify-between">
                    <span>Rental Days</span>
                    <span className="text-white font-medium">{rentalDays}</span>
                  </div>

                  <div className="flex justify-between">
                    <span>Rent Amount</span>
                    <span className="text-white font-medium">₹{totalPrice}</span>
                  </div>

                  <div className="flex justify-between">
                    <span>GST (18%)</span>
                    <span className="text-white font-medium">₹{gst}</span>
                  </div>

                  <div className="flex justify-between">
                    <span>Platform Fee</span>
                    <span className="text-white font-medium">₹{platformFee}</span>
                  </div>

                  <div className="flex justify-between">
                    <span>Security Deposit</span>
                    <span className="text-white font-medium">₹{securityDeposit}</span>
                  </div>

                  <div className="border-t border-white/10 my-3" />

                  <div className="flex justify-between pt-1 text-xl sm:text-2xl font-bold">
                    <span className="text-white">Total</span>
                    <span className="bg-gradient-to-r from-indigo-300 to-purple-300 bg-clip-text text-transparent">
                      ₹{finalAmount}
                    </span>
                  </div>
                  <div className="mt-4 flex justify-center">

              <span className="rounded-full bg-green-500/10 border border-green-500/20 px-4 py-2 text-green-300 text-xs">

              🔒 Powered by Razorpay Secure Payments

              </span>

              </div>
                </div>

                <button
                  disabled={rentalDays <= 0}
                  onClick={() =>
                    navigate("/checkout", {
                      state: {
                        vehicle,
                        rentalDays,
                        totalPrice,
                        gst,
                        platformFee,
                        securityDeposit,
                        finalAmount,
                        pickupDate,
                        returnDate,
                      },
                    })
                  }
                  className={`w-full mt-6 sm:mt-8 py-4 rounded-xl font-semibold text-base sm:text-lg transition-all duration-300 ${
                    rentalDays > 0
                      ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/50 hover:-translate-y-0.5 active:translate-y-0"
                      : "bg-white/5 text-slate-500 border border-white/10 cursor-not-allowed shadow-none"
                  }`}
                >
                  Book Now
                </button>
                <div className="mt-5 space-y-3 text-sm text-slate-300">

          <div className="flex items-center gap-2">
            <span className="text-green-400">✓</span>
            <span>Free cancellation within 24 hours</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-green-400">✓</span>
            <span>Secure Razorpay payment</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-green-400">✓</span>
            <span>AI Risk Protected Booking</span>
          </div>

        </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
