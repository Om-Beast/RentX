import { useEffect, useState } from "react";
import axios from "axios";

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const getVehicleImage = (name) => {
    const vehicleName = name?.toLowerCase() || "";

    if (vehicleName.includes("activa"))
      return "/vehicles/activa.png";

    if (vehicleName.includes("classic"))
      return "/vehicles/Classic-350.png";

    if (vehicleName.includes("thar"))
      return "/vehicles/thar.png";

    if (vehicleName.includes("nexon"))
      return "/vehicles/nexon.png";

    if (vehicleName.includes("creta"))
      return "/vehicles/creta.png";

    if (vehicleName.includes("city"))
      return "/vehicles/city.png";

    if (vehicleName.includes("scorpio"))
      return "/vehicles/scorpio.png";

    if (vehicleName.includes("innova"))
      return "/vehicles/innova.png";

    if (vehicleName.includes("ola"))
      return "/vehicles/ola.png";

    if (vehicleName.includes("bmw"))
      return "/vehicles/bmw.png";

    return "/vehicles/default.png";
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const res = await axios.get(
        "http://localhost:5000/api/bookings?customerId=6a28ef02f4c6059ef61efc3a"
      );

      setBookings(res.data.bookings);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (
    bookingId
  ) => {
    try {
      await axios.patch(
        `http://localhost:5000/api/bookings/${bookingId}/cancel`
      );

      setBookings((prev) =>
        prev.map((booking) =>
          booking._id === bookingId
            ? {
                ...booking,
                bookingStatus: "cancelled",
              }
            : booking
        )
      );
    } catch (error) {
      console.log(error);
      alert(
        "Failed to cancel booking"
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-2xl font-bold">
        Loading Bookings...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-8">
      <h1 className="text-4xl font-bold text-indigo-600 mb-8">
        My Bookings
      </h1>

      {bookings.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center shadow">
          <h2 className="text-2xl font-semibold">
            No Bookings Found
          </h2>

          <p className="text-gray-500 mt-2">
            Book your first vehicle now 🚀
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {bookings.map((booking) => (
            <div
              key={booking._id}
              className="bg-white rounded-3xl shadow-lg p-6 border border-gray-100"
            >
              {/* Header */}
              <div className="flex justify-between items-start">
                <div className="flex gap-5 items-center">
                  <img
                    src={getVehicleImage(
                      booking.vehicle?.name
                    )}
                    alt={booking.vehicle?.name}
                    className="w-28 h-28 rounded-2xl object-cover border"
                  />

                  <div>
                    <h2 className="text-2xl font-bold text-slate-800">
                      {booking.vehicle?.name}
                    </h2>

                    <p className="text-gray-500 mt-1">
                      {booking.vehicle?.brand}
                    </p>

                    <p className="text-gray-500">
                      {
                        booking.vehicle
                          ?.fuelType
                      }{" "}
                      •{" "}
                      {
                        booking.vehicle
                          ?.transmission
                      }
                    </p>
                  </div>
                </div>

                <span
                  className={`px-4 py-2 rounded-full text-white font-medium ${
                    booking.bookingStatus ===
                    "cancelled"
                      ? "bg-red-500"
                      : booking.bookingStatus ===
                        "confirmed"
                      ? "bg-green-500"
                      : "bg-yellow-500"
                  }`}
                >
                  {
                    booking.bookingStatus
                  }
                </span>
              </div>

              {/* Booking Info */}
              <div className="grid md:grid-cols-2 gap-4 mt-6">
                <div>
                  <p className="text-gray-500">
                    Booking ID
                  </p>

                  <p className="font-medium break-all">
                    {booking._id}
                  </p>
                </div>

                <div>
                  <p className="text-gray-500">
                    Amount
                  </p>

                  <p className="font-bold text-indigo-600 text-xl">
                    ₹
                    {
                      booking.totalPrice
                    }
                  </p>
                </div>

                <div>
                  <p className="text-gray-500">
                    Pickup Date
                  </p>

                  <p className="font-medium">
                    {new Date(
                      booking.startDate
                    ).toLocaleDateString()}
                  </p>
                </div>

                <div>
                  <p className="text-gray-500">
                    Return Date
                  </p>

                  <p className="font-medium">
                    {new Date(
                      booking.endDate
                    ).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Vehicle Details */}
              {booking.vehicle && (
                <div className="mt-5 flex gap-6 text-sm text-gray-600">
                  <p>
                    Fuel:{" "}
                    {
                      booking.vehicle
                        ?.fuelType
                    }
                  </p>

                  <p>
                    Transmission:{" "}
                    {
                      booking.vehicle
                        ?.transmission
                    }
                  </p>

                  <p>
                    Year:{" "}
                    {
                      booking.vehicle
                        ?.year
                    }
                  </p>
                </div>
              )}

              {/* Cancel Button */}
              {booking.bookingStatus !==
                "cancelled" && (
                <button
                  onClick={() =>
                    handleCancelBooking(
                      booking._id
                    )
                  }
                  className="mt-6 px-5 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition"
                >
                  Cancel Booking
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}