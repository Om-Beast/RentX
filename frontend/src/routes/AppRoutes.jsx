import { Routes, Route } from "react-router-dom";

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
import ProtectedRoute from "./ProtectedRoute";
import MyVehicles from "../pages/MyVehicles";
import EditVehicle from "../pages/EditVehicle";
import FleetBookingRequests from "../pages/FleetBookingRequests";

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/"
        element={<Home />}
      />

      <Route
        path="/vehicles"
        element={<VehicleListing />}
      />

      <Route
        path="/vehicles/:id"
        element={<VehicleDetails />}
      />

      <Route
      path="/owner-bookings"
      element={
        <ProtectedRoute>
          <FleetBookingRequests />
        </ProtectedRoute>
      }
    />

     <Route
      path="/checkout"
      element={
        <ProtectedRoute>
          <Checkout />
        </ProtectedRoute>
      }
    />

      <Route
      path="/booking-success/:id"
      element={<BookingSuccess />}
    />

      <Route
    path="/my-bookings"
    element={
      <ProtectedRoute>
        <MyBookings />
      </ProtectedRoute>
    }
  />

      <Route
      path="/dashboard"
      element={
        <ProtectedRoute>
          <FleetDashboard />
        </ProtectedRoute>
      }
    />
        <Route
    path="/login"
    element={<Login />}
  />

  <Route
    path="/register"
    element={<Register />}
  />
    <Route
  path="/add-vehicle"
  element={
    <ProtectedRoute>
      <AddVehicle />
    </ProtectedRoute>
  }
/>

<Route
  path="/my-vehicles"
  element={
    <ProtectedRoute>
      <MyVehicles />
    </ProtectedRoute>
  }
/>
<Route
  path="/edit-vehicle/:id"
  element={
    <ProtectedRoute>
      <EditVehicle />
    </ProtectedRoute>
  }
/>
    </Routes>
  );
}

export default AppRoutes;