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
          "${import.meta.env.VITE_API_URL}/api/dashboard/stats"
        );

        setStats({
          totalVehicles: statsRes.data.totalVehicles || 0,
          totalBookings: statsRes.data.totalBookings || 0,
          revenue: statsRes.data.revenue || 0,
          pendingBookings: statsRes.data.pendingBookings || 0,
        });

        const bookingsRes = await axios.get(
          "${import.meta.env.VITE_API_URL}/api/dashboard/recent-bookings"
        );

        setRecentBookings(bookingsRes.data.bookings || []);
      } catch (error) {
        console.log(error);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="min-h-screen bg-[#05060a] relative overflow-hidden">
      {/* Floating background glows */}
      <div className="pointer-events-none absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[140px]" />
      <div className="pointer-events-none absolute top-[15%] right-[-15%] w-[450px] h-[450px] bg-purple-600/20 rounded-full blur-[140px]" />
      <div className="pointer-events-none absolute bottom-[-15%] left-[20%] w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[140px]" />

      <div className="relative p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-8 sm:mb-10">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight">
            Fleet Dashboard
          </h1>
          <p className="mt-2 text-slate-400 text-sm sm:text-base">
            Owner analytics overview — manage your fleet, track bookings and grow revenue.
          </p>

          <div className="mb-10 mt-6">
            <div className="relative overflow-hidden rounded-3xl p-[1px] bg-gradient-to-r from-indigo-500/60 via-purple-500/60 to-pink-500/60 shadow-2xl shadow-black/40">
              <div className="relative rounded-[calc(1.5rem-1px)] bg-gradient-to-r from-indigo-600/90 via-purple-600/90 to-pink-500/90 backdrop-blur-xl p-6 sm:p-8 text-white overflow-hidden">
                <div className="absolute -top-10 -right-10 w-56 h-56 bg-white/10 rounded-full blur-3xl" />

                <h2 className="relative text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
                  Welcome Back 👋
                </h2>

                <p className="relative mt-2 text-sm sm:text-base lg:text-lg opacity-90">
                  Manage your fleet, track bookings and grow revenue.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">

              <span className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-medium text-white">
                🚗 Enterprise Fleet
              </span>

              <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-4 py-2 text-xs font-medium text-cyan-300">
                🤖 AI Protected
              </span>

              <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-xs font-medium text-emerald-300">
                💳 Razorpay Verified
              </span>

              </div>

                <div className="relative flex gap-3 sm:gap-4 mt-6 flex-wrap">

                  <Link
                    to="/add-vehicle"
                    className="bg-white text-indigo-700 px-5 sm:px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300"
                  >
                    Add Vehicle
                  </Link>

                  <Link
                    to="/owner-bookings"
                    className="bg-white/10 backdrop-blur-md border border-white/20 px-5 sm:px-6 py-3 rounded-xl font-semibold hover:bg-white/20 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300"
                  >
                    Booking Requests
                  </Link>

                  <Link
                    to="/my-vehicles"
                    className="bg-white/10 backdrop-blur-md border border-white/20 px-5 sm:px-6 py-3 rounded-xl font-semibold hover:bg-white/20 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300"
                  >
                    My Vehicles
                  </Link>

                </div>

              </div>
            </div>
          </div>

        </div>


        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">

          <motion.div
            whileHover={{ y: -8 }}
            className="group relative overflow-hidden rounded-3xl p-[1px] bg-gradient-to-br from-indigo-500/40 via-white/10 to-transparent shadow-xl shadow-black/30"
          >
            <div className="bg-white/5 backdrop-blur-xl rounded-[calc(1.5rem-1px)] p-5 sm:p-6 h-full">
              <div className="w-11 h-11 rounded-2xl bg-indigo-500/15 flex items-center justify-center mb-4">
                <FaCar className="text-xl text-indigo-300" />
              </div>

              <h3 className="text-slate-400 text-xs sm:text-sm uppercase tracking-wide">
                Total Vehicles
              </h3>

              <p className="text-3xl sm:text-4xl lg:text-5xl font-bold mt-3 text-white">
                {stats.totalVehicles}
              </p>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ y: -8 }}
            className="group relative overflow-hidden rounded-3xl p-[1px] bg-gradient-to-br from-blue-500/40 via-white/10 to-transparent shadow-xl shadow-black/30"
          >
            <div className="bg-white/5 backdrop-blur-xl rounded-[calc(1.5rem-1px)] p-5 sm:p-6 h-full">
              <div className="w-11 h-11 rounded-2xl bg-blue-500/15 flex items-center justify-center mb-4">
                <FaCalendarCheck className="text-xl text-blue-300" />
              </div>

              <h3 className="text-slate-400 text-xs sm:text-sm uppercase tracking-wide">
                Total Bookings
              </h3>

              <p className="text-3xl sm:text-4xl lg:text-5xl font-bold mt-3 text-white">
                {stats.totalBookings}
              </p>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ y: -8 }}
            className="group relative overflow-hidden rounded-3xl p-[1px] bg-gradient-to-br from-emerald-500/40 via-white/10 to-transparent shadow-xl shadow-black/30"
          >
            <div className="bg-white/5 backdrop-blur-xl rounded-[calc(1.5rem-1px)] p-5 sm:p-6 h-full">
              <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 flex items-center justify-center mb-4">
                <FaMoneyBillWave className="text-xl text-emerald-300" />
              </div>

              <h3 className="text-slate-400 text-xs sm:text-sm uppercase tracking-wide">
                Revenue
              </h3>

              <p className="text-3xl sm:text-4xl lg:text-5xl font-bold mt-3 bg-gradient-to-r from-emerald-300 to-emerald-400 bg-clip-text text-transparent">
                ₹{stats.revenue}
              </p>
              <p className="mt-2 text-xs text-emerald-300">
              ↑ Fleet earnings
            </p>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ y: -8 }}
            className="group relative overflow-hidden rounded-3xl p-[1px] bg-gradient-to-br from-amber-500/40 via-white/10 to-transparent shadow-xl shadow-black/30"
          >
            <div className="bg-white/5 backdrop-blur-xl rounded-[calc(1.5rem-1px)] p-5 sm:p-6 h-full">
              <div className="w-11 h-11 rounded-2xl bg-amber-500/15 flex items-center justify-center mb-4">
                <FaClock className="text-xl text-amber-300" />
              </div>

              <h3 className="text-slate-400 text-xs sm:text-sm uppercase tracking-wide">
                Pending Bookings
              </h3>

              <p className="text-3xl sm:text-4xl lg:text-5xl font-bold mt-3 text-amber-300">
                {stats.pendingBookings}
              </p>
            </div>
          </motion.div>

        </div>

        {/* Fleet Rating (not present in backend stats) */}
        <div className="grid grid-cols-1 mt-4 sm:mt-6">
          <div className="relative overflow-hidden rounded-3xl p-[1px] bg-gradient-to-br from-pink-500/30 via-white/10 to-transparent shadow-xl shadow-black/30 max-w-xs">
            <div className="bg-white/5 backdrop-blur-xl rounded-[calc(1.5rem-1px)] p-5 sm:p-6">
              <div className="w-11 h-11 rounded-2xl bg-pink-500/15 flex items-center justify-center mb-4 text-xl">
                ⭐
              </div>
              <h3 className="text-slate-400 text-xs sm:text-sm uppercase tracking-wide">
                Fleet Rating
              </h3>
              <p className="text-2xl sm:text-3xl font-bold mt-3 text-slate-500">
                Unavailable
              </p>
            </div>
          </div>
        </div>

        {/* Owner Insights / Analytics */}
        <div className="mt-8 sm:mt-10">
          <div className="relative overflow-hidden rounded-3xl p-[1px] bg-gradient-to-br from-indigo-500/30 via-white/10 to-purple-500/30 shadow-2xl shadow-black/40">
            <div className="bg-white/5 backdrop-blur-2xl rounded-[calc(1.5rem-1px)] p-5 sm:p-6 lg:p-7">
              <AnalyticsDashboard />
            </div>
          </div>
        </div>

        {/* AI Section */}
        <div className="mt-8 sm:mt-10 rounded-3xl p-[1px] bg-gradient-to-br from-cyan-500/30 via-white/10 to-indigo-500/30 shadow-2xl shadow-black/40">
          <div className="bg-white/5 backdrop-blur-2xl rounded-[calc(1.5rem-1px)] p-5 sm:p-7 lg:p-8">
            <h2 className="text-lg sm:text-xl font-semibold text-white tracking-tight mb-2 flex items-center gap-2">
              <span>🤖</span> AI Risk Assessment
            </h2>

            <div className="mt-4 flex flex-col items-center text-center py-8 sm:py-10 rounded-2xl border border-dashed border-white/10 bg-white/[0.02]">
              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-slate-500 mb-3">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 8v5M12 16h.01" />
                </svg>
              </div>
              <p className="text-slate-400 text-sm sm:text-base">
                AI assessment unavailable.
              </p>
              <p className="mt-3 text-xs text-slate-500">
                Powered by Gemini AI Risk Engine
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 sm:mt-10 rounded-3xl p-[1px] bg-gradient-to-br from-indigo-500/30 via-white/10 to-purple-500/30 shadow-2xl shadow-black/40">
          <div className="bg-white/5 backdrop-blur-2xl rounded-[calc(1.5rem-1px)] p-5 sm:p-7 lg:p-8">

            <h2 className="text-lg sm:text-xl font-semibold text-white tracking-tight mb-5 sm:mb-6">
              Quick Actions
            </h2>

            <div className="grid grid-cols-2 gap-3 sm:gap-4">

              <Link
                to="/add-vehicle"
                className="group relative overflow-hidden bg-gradient-to-br from-indigo-500 to-indigo-700 text-white p-5 rounded-2xl text-center font-semibold shadow-lg shadow-indigo-500/20 hover:shadow-xl hover:shadow-indigo-500/40 hover:-translate-y-1 transition-all duration-300"
              >
                Add Vehicle
              </Link>

              <Link
                to="/my-vehicles"
                className="group relative overflow-hidden bg-gradient-to-br from-emerald-500 to-emerald-700 text-white p-5 rounded-2xl text-center font-semibold shadow-lg shadow-emerald-500/20 hover:shadow-xl hover:shadow-emerald-500/40 hover:-translate-y-1 transition-all duration-300"
              >
                My Vehicles
              </Link>

              <Link
                to="/owner-bookings"
                className="group relative overflow-hidden bg-gradient-to-br from-orange-500 to-orange-700 text-white p-5 rounded-2xl text-center font-semibold shadow-lg shadow-orange-500/20 hover:shadow-xl hover:shadow-orange-500/40 hover:-translate-y-1 transition-all duration-300"
              >
                Booking Requests
              </Link>

              <Link
                to="/dashboard"
                className="group relative overflow-hidden bg-gradient-to-br from-purple-500 to-purple-700 text-white p-5 rounded-2xl text-center font-semibold shadow-lg shadow-purple-500/20 hover:shadow-xl hover:shadow-purple-500/40 hover:-translate-y-1 transition-all duration-300"
              >
                Analytics
              </Link>

            </div>

          </div>
        </div>

        {/* Recent Bookings */}
        <div className="mt-8 sm:mt-10 rounded-3xl p-[1px] bg-gradient-to-br from-indigo-500/30 via-white/10 to-purple-500/30 shadow-2xl shadow-black/40">
          <div className="bg-white/5 backdrop-blur-2xl rounded-[calc(1.5rem-1px)] p-5 sm:p-7 lg:p-8">

            <h2 className="text-lg sm:text-xl font-semibold text-white tracking-tight mb-5 sm:mb-6">
              Recent Bookings
            </h2>

            {recentBookings.length === 0 ? (
              <div className="flex flex-col items-center text-center py-10 rounded-2xl border border-dashed border-white/10 bg-white/[0.02]">
                <p className="text-slate-500 text-sm sm:text-base">
                  No bookings found
                </p>
                <p className="mt-2 text-sm text-slate-400">
                   Add your first vehicle to start receiving booking requests.
                  </p>

                  <Link
                    to="/add-vehicle"
                    className="mt-5 inline-flex items-center rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-5 py-3 text-sm font-semibold text-white transition hover:scale-105"
                  >
                    + Add Your First Vehicle
                  </Link>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {recentBookings.map((booking) => (
                  <div
                    key={booking._id}
                    className="group grid grid-cols-1 md:grid-cols-[1.4fr_1.4fr_0.9fr_0.9fr_1.2fr] gap-3 md:gap-4 items-center bg-white/5 hover:bg-white/[0.07] border border-white/10 hover:border-indigo-400/30 rounded-2xl p-4 sm:p-5 transition-all duration-300 hover:-translate-y-0.5"
                  >
                    <div>
                      <p className="font-semibold text-white text-sm sm:text-base">
                        {booking.user?.name}
                      </p>

                      <p className="text-xs sm:text-sm text-slate-500">
                        {booking.user?.email}
                      </p>
                    </div>

                    <div>
                      <p className="font-medium text-slate-200 text-sm sm:text-base">
                        {booking.vehicle?.name}
                      </p>

                      <p className="text-xs sm:text-sm text-slate-500">
                        {booking.vehicle?.brand}
                      </p>
                    </div>

                    <div className="font-bold text-indigo-300 text-sm sm:text-base">
                      ₹{booking.totalPrice}
                    </div>

                    <div>
                      <span
                        className={`inline-flex px-3 py-1 rounded-full text-white text-xs sm:text-sm font-medium shadow-sm ${
                          booking.bookingStatus === "confirmed"
                            ? "bg-emerald-500/90"
                            : booking.bookingStatus === "cancelled"
                            ? "bg-red-500/90"
                            : "bg-amber-500/90"
                        }`}
                      >
                        {booking.bookingStatus}
                      </span>
                    </div>

                    <div className="text-xs sm:text-sm text-slate-400">
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

                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Why Fleet Owners Choose RentX */}
        <div className="mt-10 sm:mt-14">
          <h2 className="text-lg sm:text-xl font-semibold text-white tracking-tight mb-5 sm:mb-6 text-center">
            Why Fleet Owners Choose RentX
          </h2>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="group bg-white/5 backdrop-blur-xl p-4 sm:p-5 rounded-2xl border border-white/10 text-center hover:border-indigo-400/30 hover:-translate-y-1 transition-all duration-300">
              <div className="w-10 h-10 mx-auto rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-300 mb-3">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>
              <p className="text-white text-xs sm:text-sm font-medium">Verified Customers</p>
            </div>

            <div className="group bg-white/5 backdrop-blur-xl p-4 sm:p-5 rounded-2xl border border-white/10 text-center hover:border-indigo-400/30 hover:-translate-y-1 transition-all duration-300">
              <div className="w-10 h-10 mx-auto rounded-xl bg-cyan-500/15 flex items-center justify-center text-cyan-300 mb-3">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" />
                </svg>
              </div>
              <p className="text-white text-xs sm:text-sm font-medium">AI Booking Risk Assessment</p>
            </div>

            <div className="group bg-white/5 backdrop-blur-xl p-4 sm:p-5 rounded-2xl border border-white/10 text-center hover:border-indigo-400/30 hover:-translate-y-1 transition-all duration-300">
              <div className="w-10 h-10 mx-auto rounded-xl bg-indigo-500/15 flex items-center justify-center text-indigo-300 mb-3">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <p className="text-white text-xs sm:text-sm font-medium">Secure Payments</p>
            </div>

            <div className="group bg-white/5 backdrop-blur-xl p-4 sm:p-5 rounded-2xl border border-white/10 text-center hover:border-indigo-400/30 hover:-translate-y-1 transition-all duration-300">
              <div className="w-10 h-10 mx-auto rounded-xl bg-purple-500/15 flex items-center justify-center text-purple-300 mb-3">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 8v4l3 3" />
                  <circle cx="12" cy="12" r="9" />
                </svg>
              </div>
              <p className="text-white text-xs sm:text-sm font-medium">24×7 Support</p>
            </div>
          </div>
        </div>

      </div>
      <div className="mt-16 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl text-center">
  <p className="text-sm text-slate-400">
    Built with
  </p>

  <div className="mt-4 flex flex-wrap justify-center gap-3">

    <span className="rounded-full bg-indigo-500/10 border border-indigo-500/20 px-4 py-2 text-xs text-indigo-300">
      MERN Stack
    </span>

    <span className="rounded-full bg-cyan-500/10 border border-cyan-500/20 px-4 py-2 text-xs text-cyan-300">
      Gemini AI
    </span>

    <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 text-xs text-emerald-300">
      Razorpay
    </span>

    <span className="rounded-full bg-purple-500/10 border border-purple-500/20 px-4 py-2 text-xs text-purple-300">
      JWT Authentication
    </span>

  </div>
</div>
    </div>
  );
}
