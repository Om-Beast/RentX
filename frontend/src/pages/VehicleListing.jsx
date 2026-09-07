import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../context/AuthContext";
import VehicleCard from "../components/VehicleCard";

const TYPES = ["all", "car", "bike", "scooter", "suv", "sedan", "hatchback", "luxury", "ev", "other"];
const FUEL_TYPES = ["all", "petrol", "diesel", "electric", "hybrid"];
const SORT_OPTIONS = [
  { value: "rating", label: "Top Rated" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "newest", label: "Newest" },
];

function SkeletonCard() {
  return (
    <div className="rounded-2xl bg-slate-800 border border-slate-700 overflow-hidden animate-pulse">
      <div className="h-48 bg-slate-700" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-slate-700 rounded w-3/4" />
        <div className="h-3 bg-slate-700 rounded w-1/2" />
        <div className="h-3 bg-slate-700 rounded w-1/3" />
        <div className="flex justify-between items-center pt-2">
          <div className="h-5 bg-slate-700 rounded w-20" />
          <div className="h-8 bg-slate-700 rounded w-24" />
        </div>
      </div>
    </div>
  );
}

export default function VehicleListing() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [vehicles, setVehicles] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter state — initialised from URL params
  const [filters, setFilters] = useState({
    type: searchParams.get("type") || "all",
    city: searchParams.get("city") || "",
    minPrice: searchParams.get("minPrice") || "",
    maxPrice: searchParams.get("maxPrice") || "",
    transmission: searchParams.get("transmission") || "all",
    fuelType: searchParams.get("fuelType") || "all",
    search: searchParams.get("search") || "",
    sortBy: searchParams.get("sortBy") || "rating",
    page: parseInt(searchParams.get("page") || "1"),
  });

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const debounceRef = useRef(null);

  const buildQuery = useCallback((f) => {
    const params = new URLSearchParams();
    if (f.type && f.type !== "all") params.set("type", f.type);
    if (f.city) params.set("city", f.city);
    if (f.minPrice) params.set("minPrice", f.minPrice);
    if (f.maxPrice) params.set("maxPrice", f.maxPrice);
    if (f.transmission && f.transmission !== "all") params.set("transmission", f.transmission);
    if (f.fuelType && f.fuelType !== "all") params.set("fuelType", f.fuelType);
    if (f.search) params.set("search", f.search);
    // Sort
    if (f.sortBy === "price-asc") { params.set("sortBy", "price"); params.set("order", "asc"); }
    else if (f.sortBy === "price-desc") { params.set("sortBy", "price"); params.set("order", "desc"); }
    else params.set("sortBy", f.sortBy || "rating");
    params.set("page", f.page || 1);
    params.set("limit", 12);
    return params.toString();
  }, []);

  const fetchVehicles = useCallback(async (f) => {
    setLoading(true);
    setError(null);
    try {
      const query = buildQuery(f);
      const { data } = await api.get(`/api/vehicles?${query}`);
      setVehicles(data.vehicles || []);
      setPagination(data.pagination || { total: 0, page: 1, totalPages: 1 });
      // Sync URL
      setSearchParams(new URLSearchParams(query), { replace: true });
    } catch (err) {
      setError("Failed to load vehicles. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [buildQuery, setSearchParams]);

  // Initial + filter change fetch (debounced for text fields)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchVehicles(filters), 300);
    return () => clearTimeout(debounceRef.current);
  }, [filters, fetchVehicles]);

  const setFilter = (key, value) =>
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));

  const clearFilters = () =>
    setFilters({ type: "all", city: "", minPrice: "", maxPrice: "", transmission: "all", fuelType: "all", search: "", sortBy: "rating", page: 1 });

  const Sidebar = () => (
    <div className="space-y-5 text-sm">
      {/* Type */}
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Vehicle Type</p>
        <div className="space-y-1">
          {TYPES.map((t) => (
            <button
              key={t}
              onClick={() => setFilter("type", t)}
              className={`w-full text-left px-3 py-1.5 rounded-lg capitalize transition-colors ${
                filters.type === t
                  ? "bg-indigo-600 text-white font-medium"
                  : "text-slate-400 hover:text-white hover:bg-slate-700"
              }`}
            >
              {t === "all" ? "All Types" : t}
            </button>
          ))}
        </div>
      </div>

      {/* City */}
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">City</p>
        <input
          type="text"
          value={filters.city}
          onChange={(e) => setFilter("city", e.target.value)}
          placeholder="e.g. Delhi, Mumbai"
          className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500"
        />
      </div>

      {/* Price Range */}
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Price/Day (₹)</p>
        <div className="flex gap-2">
          <input
            type="number"
            value={filters.minPrice}
            onChange={(e) => setFilter("minPrice", e.target.value)}
            placeholder="Min"
            className="w-1/2 px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500"
          />
          <input
            type="number"
            value={filters.maxPrice}
            onChange={(e) => setFilter("maxPrice", e.target.value)}
            placeholder="Max"
            className="w-1/2 px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Transmission */}
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Transmission</p>
        {["all", "manual", "automatic"].map((t) => (
          <button
            key={t}
            onClick={() => setFilter("transmission", t)}
            className={`mr-2 mb-2 px-3 py-1 rounded-lg text-xs capitalize transition-colors ${
              filters.transmission === t
                ? "bg-indigo-600 text-white"
                : "bg-slate-700 text-slate-400 hover:text-white"
            }`}
          >
            {t === "all" ? "Any" : t}
          </button>
        ))}
      </div>

      {/* Fuel */}
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Fuel Type</p>
        {FUEL_TYPES.map((f) => (
          <button
            key={f}
            onClick={() => setFilter("fuelType", f)}
            className={`mr-2 mb-2 px-3 py-1 rounded-lg text-xs capitalize transition-colors ${
              filters.fuelType === f
                ? "bg-indigo-600 text-white"
                : "bg-slate-700 text-slate-400 hover:text-white"
            }`}
          >
            {f === "all" ? "Any" : f}
          </button>
        ))}
      </div>

      <button
        onClick={clearFilters}
        className="w-full py-2 text-xs text-slate-400 hover:text-white border border-slate-600 hover:border-slate-500 rounded-lg transition-colors"
      >
        Clear All Filters
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 pt-16">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Browse Vehicles</h1>
            <p className="text-sm text-slate-500 mt-1">
              {loading ? "Loading..." : `${pagination.total} vehicles found`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilter("search", e.target.value)}
                placeholder="Search vehicles..."
                className="pl-9 pr-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 w-44 sm:w-56"
              />
            </div>
            {/* Sort */}
            <select
              value={filters.sortBy}
              onChange={(e) => setFilter("sortBy", e.target.value)}
              className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500"
            >
              {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            {/* Mobile filter toggle */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-sm"
            >
              Filters
            </button>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Sidebar — desktop */}
          <aside className="hidden lg:block w-52 flex-shrink-0">
            <div className="sticky top-24 bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <Sidebar />
            </div>
          </aside>

          {/* Mobile Sidebar Overlay */}
          {sidebarOpen && (
            <div className="lg:hidden fixed inset-0 z-40 flex">
              <div className="fixed inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
              <div className="relative w-72 max-w-full bg-slate-900 border-r border-slate-800 p-6 overflow-y-auto z-50">
                <button onClick={() => setSidebarOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">✕</button>
                <h3 className="text-white font-semibold mb-4">Filters</h3>
                <Sidebar />
              </div>
            </div>
          )}

          {/* Main content */}
          <main className="flex-1 min-w-0">
            {error ? (
              <div className="text-center py-16">
                <p className="text-red-400 mb-4">{error}</p>
                <button onClick={() => fetchVehicles(filters)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-500">
                  Retry
                </button>
              </div>
            ) : loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {[...Array(9)].map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : vehicles.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-5xl mb-4">🔍</div>
                <h3 className="text-lg font-semibold text-white mb-2">No vehicles found</h3>
                <p className="text-slate-500 text-sm mb-4">Try adjusting your filters or search term.</p>
                <button onClick={clearFilters} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-500">
                  Clear Filters
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {vehicles.map((v) => <VehicleCard key={v._id} vehicle={v} />)}
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <button
                      onClick={() => setFilter("page", pagination.page - 1)}
                      disabled={!pagination.hasPrev}
                      className="px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm text-slate-300 disabled:opacity-40 hover:bg-slate-700 transition-colors"
                    >
                      ← Previous
                    </button>
                    <span className="text-sm text-slate-500">
                      Page {pagination.page} of {pagination.totalPages}
                    </span>
                    <button
                      onClick={() => setFilter("page", pagination.page + 1)}
                      disabled={!pagination.hasNext}
                      className="px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm text-slate-300 disabled:opacity-40 hover:bg-slate-700 transition-colors"
                    >
                      Next →
                    </button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}