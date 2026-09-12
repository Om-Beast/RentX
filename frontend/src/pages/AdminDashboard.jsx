import { useState, useEffect } from "react";
import { api } from "../context/AuthContext";
import { Users, Car, CalendarCheck, DollarSign, Shield, AlertCircle } from "lucide-react";

function StatCard({ icon: Icon, label, value, sub, color = "indigo" }) {
  const colors = { indigo: "text-indigo-400 bg-indigo-500/15", emerald: "text-emerald-400 bg-emerald-500/15", amber: "text-amber-400 bg-amber-500/15", red: "text-red-400 bg-red-500/15" };
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${colors[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-slate-400 text-xs uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold text-white mt-1">{value ?? "—"}</p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </div>
  );
}

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("overview");

  useEffect(() => {
    Promise.all([
      api.get("/api/admin/analytics"),
      api.get("/api/admin/users?limit=10"),
      api.get("/api/admin/vehicles?limit=10"),
    ])
      .then(([analyticsRes, usersRes, vehiclesRes]) => {
        setAnalytics(analyticsRes.data.analytics);
        setUsers(usersRes.data.users);
        setVehicles(vehiclesRes.data.vehicles);
      })
      .catch(err => setError(err.response?.data?.error?.message || "Failed to load admin data."))
      .finally(() => setLoading(false));
  }, []);

  const handleSuspend = async (userId, isSuspended) => {
    try {
      await api.patch(`/api/admin/users/${userId}/suspend`, { suspend: !isSuspended });
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, isSuspended: !isSuspended } : u));
    } catch (err) {
      setError(err.response?.data?.error?.message || "Action failed.");
    }
  };

  const handleModerate = async (vehicleId, status) => {
    try {
      await api.patch(`/api/admin/vehicles/${vehicleId}/moderate`, { listingStatus: status });
      setVehicles(prev => prev.map(v => v._id === vehicleId ? { ...v, listingStatus: status } : v));
    } catch (err) {
      setError(err.response?.data?.error?.message || "Action failed.");
    }
  };

  const TABS = ["overview", "users", "vehicles"];

  return (
    <div className="min-h-screen bg-slate-950 pt-20 pb-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-5 h-5 text-indigo-400" />
            <h1 className="text-2xl font-bold text-white">Admin Console</h1>
          </div>
          <p className="text-slate-500 text-sm">Platform management — restricted to administrators</p>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 flex gap-2 text-sm text-red-400">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />{error}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-colors ${
                tab === t ? "bg-indigo-600 text-white" : "bg-white/5 text-slate-400 hover:bg-white/10 border border-white/10"
              }`}>{t}</button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <div key={i} className="h-28 rounded-2xl bg-slate-800 animate-pulse" />)}
          </div>
        ) : tab === "overview" && analytics ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard icon={Users} label="Total Users" value={analytics.users.total} sub={`+${analytics.users.newLast30Days} this month`} />
              <StatCard icon={Car} label="Total Vehicles" value={analytics.vehicles.total} sub={`${analytics.vehicles.activeListings} active`} color="emerald" />
              <StatCard icon={CalendarCheck} label="Total Bookings" value={analytics.bookings.total} sub={`${analytics.bookings.last30Days} this month`} color="amber" />
              <StatCard icon={DollarSign} label="Platform Revenue" value={`₹${(analytics.revenue.total || 0).toLocaleString("en-IN")}`} color="emerald" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                <h3 className="text-sm font-semibold text-white mb-3">Users by Role</h3>
                {Object.entries(analytics.users.byRole).map(([role, count]) => (
                  <div key={role} className="flex justify-between py-1.5 border-b border-white/5 text-sm">
                    <span className="text-slate-400">{role}</span>
                    <span className="text-white font-medium">{count}</span>
                  </div>
                ))}
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                <h3 className="text-sm font-semibold text-white mb-3">Top Cities</h3>
                {analytics.vehicles.topCities.map(c => (
                  <div key={c._id} className="flex justify-between py-1.5 border-b border-white/5 text-sm">
                    <span className="text-slate-400">{c._id}</span>
                    <span className="text-white font-medium">{c.vehicles} vehicles</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : tab === "users" ? (
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  {["Name", "Email", "Role", "Trust", "Status", "Action"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u._id} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="px-4 py-3 text-white font-medium">{u.name}</td>
                    <td className="px-4 py-3 text-slate-400">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-xs bg-indigo-500/15 text-indigo-300">{u.role}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-300">{u.trustScore}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${u.isSuspended ? "bg-red-500/15 text-red-300" : "bg-emerald-500/15 text-emerald-300"}`}>
                        {u.isSuspended ? "Suspended" : "Active"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleSuspend(u._id, u.isSuspended)}
                        className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                          u.isSuspended ? "border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10" : "border-red-500/30 text-red-400 hover:bg-red-500/10"
                        }`}>{u.isSuspended ? "Restore" : "Suspend"}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : tab === "vehicles" ? (
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  {["Vehicle", "Owner", "City", "Price", "Status", "Action"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {vehicles.map(v => (
                  <tr key={v._id} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="px-4 py-3 text-white font-medium">{v.brand} {v.name}</td>
                    <td className="px-4 py-3 text-slate-400">{v.owner?.name}</td>
                    <td className="px-4 py-3 text-slate-400">{v.city}</td>
                    <td className="px-4 py-3 text-slate-300">₹{v.pricePerDay}/day</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                        v.listingStatus === "active" ? "bg-emerald-500/15 text-emerald-300" : "bg-slate-500/15 text-slate-400"
                      }`}>{v.listingStatus}</span>
                    </td>
                    <td className="px-4 py-3">
                      {v.listingStatus === "active" ? (
                        <button onClick={() => handleModerate(v._id, "deactivated")}
                          className="text-xs px-3 py-1.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors">Deactivate</button>
                      ) : (
                        <button onClick={() => handleModerate(v._id, "active")}
                          className="text-xs px-3 py-1.5 rounded-lg border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 transition-colors">Activate</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </div>
  );
}
