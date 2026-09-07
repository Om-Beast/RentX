import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../context/AuthContext";
import VehicleCard from "../components/VehicleCard";

const EXAMPLES = [
  "automatic SUV under ₹2000/day in Delhi",
  "electric car in Bangalore with 5 seats",
  "cheap bike in Mumbai",
  "luxury sedan for weekend in Pune",
];

export default function AiDiscover() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async (q) => {
    const searchQuery = q || query;
    if (!searchQuery.trim() || searchQuery.trim().length < 5) {
      setError("Please enter a more specific query (at least 5 characters)");
      return;
    }
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const { data } = await api.post("/api/ai/discover", { query: searchQuery });
      setResult(data);
      setQuery(searchQuery);
    } catch (err) {
      setError(err.response?.data?.error?.message || "AI search temporarily unavailable. Try again shortly.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 pt-20 pb-16 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center py-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium mb-4">
            ✨ Powered by Google Gemini
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white">AI Vehicle Discovery</h1>
          <p className="mt-3 text-slate-400 max-w-xl mx-auto text-sm leading-relaxed">
            Describe what you need in plain English. Our AI extracts the right filters and finds matching vehicles from our live database.
          </p>
        </div>

        {/* Search bar */}
        <div className="relative">
          <div className="flex gap-3">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="e.g. automatic SUV under ₹2000/day in Delhi"
              className="flex-1 px-5 py-3.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm"
            />
            <button
              onClick={() => handleSearch()}
              disabled={loading}
              className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-semibold rounded-xl transition-colors whitespace-nowrap flex items-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              )}
              Search
            </button>
          </div>

          {/* Example queries */}
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="text-xs text-slate-600">Try:</span>
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                onClick={() => { setQuery(ex); handleSearch(ex); }}
                className="text-xs px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:border-slate-600 transition-colors"
              >
                {ex}
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="mt-8">
            {/* AI explanation */}
            <div className="mb-6 p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/20">
              <div className="flex items-start gap-3">
                <span className="text-lg">🤖</span>
                <div>
                  <p className="text-sm font-medium text-indigo-300 mb-1">AI understood your query as:</p>
                  <p className="text-sm text-slate-300">{result.understood}</p>
                  {/* Extracted filters display */}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {result.filters?.type && <span className="px-2 py-0.5 bg-slate-800 rounded-full text-xs text-slate-400">Type: {result.filters.type}</span>}
                    {result.filters?.city && <span className="px-2 py-0.5 bg-slate-800 rounded-full text-xs text-slate-400">City: {result.filters.city}</span>}
                    {result.filters?.maxPrice && <span className="px-2 py-0.5 bg-slate-800 rounded-full text-xs text-slate-400">Max: ₹{result.filters.maxPrice}/day</span>}
                    {result.filters?.transmission && <span className="px-2 py-0.5 bg-slate-800 rounded-full text-xs text-slate-400">Transmission: {result.filters.transmission}</span>}
                    {result.filters?.fuelType && <span className="px-2 py-0.5 bg-slate-800 rounded-full text-xs text-slate-400">Fuel: {result.filters.fuelType}</span>}
                    {result.filters?.seats && <span className="px-2 py-0.5 bg-slate-800 rounded-full text-xs text-slate-400">Seats: {result.filters.seats}+</span>}
                  </div>
                  <p className="text-xs text-slate-600 mt-2">
                    These filters were applied to a live database query — AI extracts intent, backend enforces results.
                  </p>
                </div>
              </div>
            </div>

            {result.count === 0 ? (
              <div className="text-center py-16">
                <div className="text-5xl mb-4">🔍</div>
                <h3 className="text-lg font-semibold text-white mb-2">No vehicles match this query</h3>
                <p className="text-slate-500 text-sm">Try a different city, higher price range, or different vehicle type.</p>
                <Link to="/vehicles" className="mt-4 inline-block px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-xl font-medium transition-colors">
                  Browse All Vehicles
                </Link>
              </div>
            ) : (
              <>
                <p className="text-sm text-slate-400 mb-4">
                  Found <span className="text-white font-semibold">{result.count}</span> matching vehicle{result.count !== 1 ? "s" : ""}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {result.vehicles.map((v) => <VehicleCard key={v._id} vehicle={v} />)}
                </div>
                <div className="mt-6 text-center">
                  <Link
                    to={`/vehicles?${new URLSearchParams(Object.fromEntries(
                      Object.entries(result.filters || {}).filter(([, v]) => v && v !== "null")
                    )).toString()}`}
                    className="text-sm text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                  >
                    See all results with these filters →
                  </Link>
                </div>
              </>
            )}
          </div>
        )}

        {/* Empty state */}
        {!result && !loading && !error && (
          <div className="text-center py-20 text-slate-600">
            <div className="text-5xl mb-4 opacity-40">✨</div>
            <p className="text-sm">Type your query above to find vehicles using natural language</p>
          </div>
        )}
      </div>
    </div>
  );
}
