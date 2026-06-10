import { Routes, Route } from "react-router-dom";

import Home from "../pages/Home";
import VehicleListing from "../pages/VehicleListing";
import VehicleDetails from "../pages/VehicleDetails";
import Checkout from "../pages/Checkout";
import BookingSuccess from "../pages/BookingSuccess";

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
        path="/checkout"
        element={<Checkout />}
      />

      <Route
        path="/booking-success"
        element={<BookingSuccess />}
      />
    </Routes>
  );
}

export default AppRoutes;