import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../context/AuthContext";
import VehicleCard from "../components/VehicleCard";

const VEHICLE_TYPES = [
  { value: "all", label: "All Types", emoji: "🚗" },
  { value: "car", label: "Car", emoji: "🚗" },
  { value: "bike", label: "Bike", emoji: "🏍️" },
  { value: "scooter", label: "Scooter", emoji: "🛵" },
  { value: "suv", label: "SUV", emoji: "🚙" },
  { value: "sedan", label: "Sedan", emoji: "🚘" },
  { value: "hatchback", label: "Hatchback", emoji: "🚖" },
  { value: "luxury", label: "Luxury", emoji: "💎" },
  { value: "ev", label: "Electric", emoji: "⚡" },
];

const HOW_IT_WORKS = [
  { icon: "🔍", step: "1", title: "Browse & Select", desc: "Search by city, type, and budget. Read reviews and check availability in real time." },
  { icon: "💳", step: "2", title: "Book & Pay Securely", desc: "Reserve with a transparent price breakdown. Pay securely via Razorpay — no hidden fees." },
  { icon: "🚗", step: "3", title: "Drive & Enjoy", desc: "Pick up your vehicle at the confirmed location and drive. Return by the agreed time." },
];

const TRUST_POINTS = [
  { icon: "✅", title: "Verified Owners", desc: "Every fleet owner is identity-verified before listing vehicles." },
  { icon: "🔒", title: "Secure Payments", desc: "Payments processed via Razorpay with HMAC signature verification." },
  { icon: "💰", title: "Transparent Pricing", desc: "See the full breakdown: base rent, GST, platform fee, and deposit. No surprises." },
  { icon: "🛡️", title: "Trust Score", desc: "Our rule-based trust engine rates every renter, ensuring quality across the platform." },
];

function CategoryCard({ emoji, label, value }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(`/vehicles?type=${value}`)}
      className="flex flex-col items-center gap-2 p-4 rounded-xl bg-slate-800 border border-slate-700 hover:border-indigo-500 hover:bg-slate-700 transition-all group"
    >
      <span className="text-3xl group-hover:scale-110 transition-transform">{emoji}</span>
      <span className="text-xs font-medium text-slate-300 group-hover:text-white">{label}</span>
    </button>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl bg-slate-800 border border-slate-700 overflow-hidden animate-pulse">
      <div className="h-48 bg-slate-700" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-slate-700 rounded w-3/4" />
        <div className="h-3 bg-slate-700 rounded w-1/2" />
        <div className="h-3 bg-slate-700 rounded w-1/3" />
      </div>
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const [featuredVehicles, setFeaturedVehicles] = useState([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const [heroCity, setHeroCity] = useState("");
  const [heroType, setHeroType] = useState("all");

  useEffect(() => {
    api.get("/api/vehicles?limit=6&sortBy=rating&order=desc")
      .then(({ data }) => setFeaturedVehicles(data.vehicles || []))
      .catch(() => {})
      .finally(() => setLoadingFeatured(false));
  }, []);

  const handleHeroSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (heroCity) params.set("city", heroCity);
    if (heroType !== "all") params.set("type", heroType);
    navigate(`/vehicles?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-28 pb-20 px-4">
        {/* Subtle background glow */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-indigo-600/15 rounded-full blur-[100px]" />
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            Trusted by thousands of renters across India
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
            Find Your Perfect{" "}
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Ride
            </span>
          </h1>
          <p className="mt-5 text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Discover and rent cars, bikes, SUVs and more from verified owners across India.
            Transparent pricing. Secure payments. Zero hidden fees.
          </p>

          {/* Hero Search */}
          <form
            onSubmit={handleHeroSearch}
            className="mt-8 flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto"
          >
            <input
              type="text"
              value={heroCity}
              onChange={(e) => setHeroCity(e.target.value)}
              placeholder="Enter your city (e.g. Delhi, Mumbai)"
              className="flex-1 px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
            />
            <select
              value={heroType}
              onChange={(e) => setHeroType(e.target.value)}
              className="px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            >
              {VEHICLE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.emoji} {t.label}</option>
              ))}
            </select>
            <button
              type="submit"
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-colors whitespace-nowrap"
            >
              Find Vehicles →
            </button>
          </form>
        </div>
      </section>

      {/* ── CATEGORY GRID ────────────────────────────────────── */}
      <section className="py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-xl font-semibold text-slate-200 mb-6 text-center">Browse by Category</h2>
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-9 gap-3">
            {VEHICLE_TYPES.filter((t) => t.value !== "all").map((type) => (
              <CategoryCard key={type.value} {...type} />
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED VEHICLES ────────────────────────────────── */}
      <section className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-slate-200">Top Rated Vehicles</h2>
            <Link to="/vehicles" className="text-sm text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
              View All →
            </Link>
          </div>

          {loadingFeatured ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : featuredVehicles.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredVehicles.map((v) => <VehicleCard key={v._id} vehicle={v} />)}
            </div>
          ) : (
            <p className="text-center text-slate-500 py-12">No vehicles found. Be the first to list one!</p>
          )}
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────── */}
      <section className="py-14 px-4 bg-slate-900/40">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-white mb-10">How RentX Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {HOW_IT_WORKS.map((item) => (
              <div key={item.step} className="text-center">
                <div className="mx-auto w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-2xl mb-4">
                  {item.icon}
                </div>
                <div className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-2">
                  Step {item.step}
                </div>
                <h3 className="font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TRUST ────────────────────────────────────────────── */}
      <section className="py-14 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-white mb-10">Why RentX?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {TRUST_POINTS.map((point) => (
              <div key={point.title} className="p-5 rounded-xl bg-slate-800 border border-slate-700">
                <div className="text-2xl mb-3">{point.icon}</div>
                <h3 className="font-semibold text-white mb-2 text-sm">{point.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{point.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FLEET OWNER CTA ──────────────────────────────────── */}
      <section className="py-14 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="relative p-[1px] rounded-2xl bg-gradient-to-r from-indigo-500/50 via-purple-500/50 to-indigo-500/50">
            <div className="rounded-[calc(1rem-1px)] bg-slate-900 p-8 sm:p-10">
              <h2 className="text-2xl font-bold text-white mb-3">Own a Vehicle? Earn with RentX</h2>
              <p className="text-slate-400 mb-6 text-sm leading-relaxed">
                List your car, bike, or SUV and start earning. Reach thousands of verified renters.
                Full control over availability and pricing.
              </p>
              <Link
                to="/register?role=FLEET_OWNER"
                className="inline-block px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-colors"
              >
                Become a Fleet Owner →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────── */}
      <footer className="border-t border-slate-800 py-8 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🚗</span>
            <span className="font-bold text-white">Rent<span className="text-indigo-500">X</span></span>
          </div>
          <div className="flex gap-6 text-sm text-slate-500">
            <Link to="/vehicles" className="hover:text-slate-300 transition-colors">Browse</Link>
            <Link to="/ai-discover" className="hover:text-slate-300 transition-colors">AI Discovery</Link>
            <Link to="/register?role=FLEET_OWNER" className="hover:text-slate-300 transition-colors">For Owners</Link>
          </div>
          <p className="text-xs text-slate-600">© {new Date().getFullYear()} RentX. Built for scale.</p>
        </div>
      </footer>
    </div>
  );
}