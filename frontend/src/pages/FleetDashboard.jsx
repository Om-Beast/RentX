import { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import AnalyticsDashboard from "../components/AnalyticsDashboard";
import { Link } from "react-router-dom";

import {
  FaCar,
  FaCalendarCheck,
  FaMoneyBillWave,
  FaClock,
} from "react-icons/fa";;

export default function FleetDashboard() {
 
  const [stats, setStats] = useState({
    totalVehicles: 0,
    totalBookings: 0,
    revenue: 0,
    pendingBookings: 0,
  });

  const [recentBookings, setRecentBookings] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const statsRes = await axios.get(
          "http://localhost:5000/api/dashboard/stats"
        );

        setStats({
          totalVehicles: statsRes.data.totalVehicles || 0,
          totalBookings: statsRes.data.totalBookings || 0,
          revenue: statsRes.data.revenue || 0,
          pendingBookings: statsRes.data.pendingBookings || 0,
        });

        const bookingsRes = await axios.get(
          "http://localhost:5000/api/dashboard/recent-bookings"
        );

        setRecentBookings(bookingsRes.data.bookings || []);
      } catch (error) {
        console.log(error);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-indigo-50 to-purple-100 p-8">

      {/* Header */}
      <div className="mb-10">
        <h1 className="text-5xl font-bold text-indigo-700">
          Fleet Owner Dashboard
        </h1>
        <div className="mb-10 mt-6">
  <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 rounded-3xl p-8 text-white shadow-2xl">

    <h2 className="text-4xl font-bold">
      Welcome Back 👋
    </h2>

    <p className="mt-2 text-lg opacity-90">
      Manage your fleet, track bookings and grow revenue.
    </p>

    <div className="flex gap-4 mt-6 flex-wrap">

      <Link
  to="/add-vehicle"
  className="bg-white text-indigo-700 px-6 py-3 rounded-xl font-semibold hover:scale-105 transition"
>
  Add Vehicle
</Link>

<Link
  to="/owner-bookings"
  className="bg-black/20 px-6 py-3 rounded-xl font-semibold hover:bg-black/30 transition"
>
  Booking Requests
</Link>

<Link
  to="/my-vehicles"
  className="bg-black/20 px-6 py-3 rounded-xl font-semibold hover:bg-black/30 transition"
>
  My Vehicles
</Link>

    </div>

  </div>
</div>

      </div>
      

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-6">

        <motion.div
          whileHover={{ y: -8 }}
          className="bg-white/80 backdrop-blur-lg p-6 rounded-3xl shadow-xl"
        >
          <FaCar className="text-4xl text-indigo-600 mb-4" />

          <h3 className="text-gray-500">
            Total Vehicles
          </h3>

          <p className="text-5xl font-bold mt-3">
            {stats.totalVehicles}
          </p>
        </motion.div>

        <motion.div
          whileHover={{ y: -8 }}
          className="bg-white/80 backdrop-blur-lg p-6 rounded-3xl shadow-xl"
        >
          <FaCalendarCheck className="text-4xl text-blue-600 mb-4" />

          <h3 className="text-gray-500">
            Total Bookings
          </h3>

          <p className="text-5xl font-bold mt-3">
            {stats.totalBookings}
          </p>
        </motion.div>

        <motion.div
          whileHover={{ y: -8 }}
          className="bg-white/80 backdrop-blur-lg p-6 rounded-3xl shadow-xl"
        >
          <FaMoneyBillWave className="text-4xl text-green-600 mb-4" />

          <h3 className="text-gray-500">
            Revenue
          </h3>

          <p className="text-5xl font-bold text-green-600 mt-3">
            ₹{stats.revenue}
          </p>
        </motion.div>

        <motion.div
          whileHover={{ y: -8 }}
          className="bg-white/80 backdrop-blur-lg p-6 rounded-3xl shadow-xl"
        >
          <FaClock className="text-4xl text-yellow-500 mb-4" />

          <h3 className="text-gray-500">
            Pending Bookings
          </h3>

          <p className="text-5xl font-bold text-yellow-500 mt-3">
            {stats.pendingBookings}
          </p>
        </motion.div>

      </div>
<div className="mt-10">
  <AnalyticsDashboard />
</div>

  {/* Quick Actions */}

  <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl p-6">

    <h2 className="text-2xl font-bold mb-6">
      Quick Actions
    </h2>

    <div className="grid grid-cols-2 gap-4">

      <Link
        to="/add-vehicle"
        className="bg-indigo-600 text-white p-5 rounded-2xl text-center font-semibold"
      >
        Add Vehicle
      </Link>

      <Link
        to="/my-vehicles"
        className="bg-green-600 text-white p-5 rounded-2xl text-center font-semibold"
      >
        My Vehicles
      </Link>

      <Link
        to="/owner-bookings"
        className="bg-orange-500 text-white p-5 rounded-2xl text-center font-semibold"
      >
        Booking Requests
      </Link>

      <Link
        to="/dashboard"
        className="bg-purple-600 text-white p-5 rounded-2xl text-center font-semibold"
      >
        Analytics
      </Link>

    </div>

    </div>

{/* Recent Bookings */}
      <div className="mt-10 bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl p-6">

        <h2 className="text-3xl font-bold mb-6">
          Recent Bookings
        </h2>

        {recentBookings.length === 0 ? (
          <p className="text-gray-500">
            No bookings found
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">

              <thead>
                <tr className="border-b bg-slate-50">
                  <th className="text-left p-4">Customer</th>
                  <th className="text-left p-4">Vehicle</th>
                  <th className="text-left p-4">Amount</th>
                  <th className="text-left p-4">Status</th>
                  <th className="text-left p-4">Rental Dates</th>
                </tr>
              </thead>

              <tbody>
                {recentBookings.map((booking) => (
                  <tr
                    key={booking._id}
                    className="border-b hover:bg-slate-50"
                  >
                    <td className="p-4">
                      <div>
                        <p className="font-semibold">
                          {booking.user?.name}
                        </p>

                        <p className="text-sm text-gray-500">
                          {booking.user?.email}
                        </p>
                      </div>
                    </td>

                    <td className="p-4">
                      <div>
                        <p className="font-medium">
                          {booking.vehicle?.name}
                        </p>

                        <p className="text-sm text-gray-500">
                          {booking.vehicle?.brand}
                        </p>
                      </div>
                    </td>

                    <td className="p-4 font-bold text-indigo-600">
                      ₹{booking.totalPrice}
                    </td>

                    <td className="p-4">
                      <span
                        className={`px-3 py-1 rounded-full text-white text-sm ${
                          booking.bookingStatus === "confirmed"
                            ? "bg-green-500"
                            : booking.bookingStatus === "cancelled"
                            ? "bg-red-500"
                            : "bg-yellow-500"
                        }`}
                      >
                        {booking.bookingStatus}
                      </span>
                    </td>

                    <td className="p-4">
                      <div className="text-sm">
                        <p>
                          Start:{" "}
                          {new Date(
                            booking.startDate
                          ).toLocaleDateString()}
                        </p>

                        <p>
                          End:{" "}
                          {new Date(
                            booking.endDate
                          ).toLocaleDateString()}
                        </p>
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>

            </table>
          </div>
        )}
         </div>
    </div>
  );
}