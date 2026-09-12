import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

import Home from "../pages/Home";
import VehicleListing from "../pages/VehicleListing";
import VehicleDetails from "../pages/VehicleDetails";
import Checkout from "../pages/Checkout";
import BookingSuccess from "../pages/BookingSuccess";
import MyBookings from "../pages/MyBookings";
import FleetDashboard from "../pages/FleetDashboard";
import AddVehicle from "../pages/AddVehicle";
import Login from "../pages/Login";
import Register from "../pages/Register";
import MyVehicles from "../pages/MyVehicles";
import EditVehicle from "../pages/EditVehicle";
import FleetBookingRequests from "../pages/FleetBookingRequests";
import AiDiscover from "../pages/AiDiscover";
import AdminDashboard from "../pages/AdminDashboard";

/** Requires authentication. Redirects to /login if not logged in. */
function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user?.role)) return <Navigate to="/" replace />;
  return children;
}

/** Redirect already-logged-in users away from auth pages */
function GuestRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (isAuthenticated) return <Navigate to="/" replace />;
  return children;
}

export default function AppRoutes() {
  return (
    <Routes>
      {/* ── Public ── */}
      <Route path="/" element={<Home />} />
      <Route path="/vehicles" element={<VehicleListing />} />
      {/* Support both /vehicles/:id and /vehicle/:id */}
      <Route path="/vehicles/:id" element={<VehicleDetails />} />
      <Route path="/vehicle/:id" element={<VehicleDetails />} />
      <Route path="/booking-success/:id" element={<BookingSuccess />} />
      <Route path="/ai-discover" element={<AiDiscover />} />

      {/* ── Auth pages (guest only) ── */}
      <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
      <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />

      {/* ── Customer routes ── */}
      <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
      <Route path="/my-bookings" element={<ProtectedRoute><MyBookings /></ProtectedRoute>} />

      {/* ── Fleet Owner routes ── */}
      <Route path="/dashboard" element={<ProtectedRoute allowedRoles={["FLEET_OWNER", "ADMIN"]}><FleetDashboard /></ProtectedRoute>} />
      <Route path="/add-vehicle" element={<ProtectedRoute allowedRoles={["FLEET_OWNER", "ADMIN"]}><AddVehicle /></ProtectedRoute>} />
      <Route path="/my-vehicles" element={<ProtectedRoute allowedRoles={["FLEET_OWNER", "ADMIN"]}><MyVehicles /></ProtectedRoute>} />
      <Route path="/edit-vehicle/:id" element={<ProtectedRoute allowedRoles={["FLEET_OWNER", "ADMIN"]}><EditVehicle /></ProtectedRoute>} />
      <Route path="/owner-bookings" element={<ProtectedRoute allowedRoles={["FLEET_OWNER", "ADMIN"]}><FleetBookingRequests /></ProtectedRoute>} />

      {/* ── Admin routes ── */}
      <Route path="/admin" element={<ProtectedRoute allowedRoles={["ADMIN"]}><AdminDashboard /></ProtectedRoute>} />

      {/* ── 404 ── */}
      <Route path="*" element={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-center px-4">
          <div>
            <div className="text-6xl mb-4">🔍</div>
            <h1 className="text-2xl font-bold text-white mb-2">Page not found</h1>
            <p className="text-slate-500 mb-6">The page you're looking for doesn't exist.</p>
            <a href="/" className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold transition-colors">
              Go Home
            </a>
          </div>
        </div>
      } />
    </Routes>
  );
}