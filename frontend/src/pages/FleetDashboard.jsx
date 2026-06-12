import { useEffect, useState } from "react";
import axios from "axios";

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
    <div className="min-h-screen bg-slate-100 p-8">
      <h1 className="text-5xl font-bold text-indigo-600 mb-8">
        Fleet Owner Dashboard
      </h1>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow">
          <h3 className="text-gray-600 text-lg">
            Total Vehicles
          </h3>

          <p className="text-5xl font-bold text-black mt-3">
            {stats.totalVehicles}
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow">
          <h3 className="text-gray-600 text-lg">
            Total Bookings
          </h3>

          <p className="text-5xl font-bold text-black mt-3">
            {stats.totalBookings}
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow">
          <h3 className="text-gray-600 text-lg">
            Revenue
          </h3>

          <p className="text-5xl font-bold text-green-600 mt-3">
            ₹{stats.revenue}
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow">
          <h3 className="text-gray-600 text-lg">
            Pending Bookings
          </h3>

          <p className="text-5xl font-bold text-yellow-600 mt-3">
            {stats.pendingBookings}
          </p>
        </div>
      </div>

      {/* Recent Bookings */}
      <div className="mt-10 bg-white rounded-2xl shadow p-6">
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
                  <th className="text-left p-4">
                    Customer
                  </th>

                  <th className="text-left p-4">
                    Vehicle
                  </th>

                  <th className="text-left p-4">
                    Amount
                  </th>

                  <th className="text-left p-4">
                    Status
                  </th>

                  <th className="text-left p-4">
                    Rental Dates
                  </th>
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
                          booking.bookingStatus ===
                          "confirmed"
                            ? "bg-green-500"
                            : booking.bookingStatus ===
                              "cancelled"
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