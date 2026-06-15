import { Link } from "react-router-dom";
import { useParams } from "react-router-dom";

export default function BookingSuccess() {
  const { id } = useParams();

console.log("BOOKING ID =", id);
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="bg-white p-10 rounded-3xl shadow-xl text-center max-w-lg">
        <div className="text-6xl mb-4">
          🎉
        </div>

        <h1 className="text-4xl font-bold text-green-600">
          Booking Successful!
        </h1>

        <p className="text-gray-600 mt-4">
          Your vehicle has been booked
          successfully.
        </p>

        <div className="flex gap-4 justify-center mt-8">
          <Link
            to="/my-bookings"
            className="bg-indigo-600 text-white px-6 py-3 rounded-xl"
          >
            My Bookings
          </Link>

          <Link
            to="/vehicles"
            className="bg-slate-200 px-6 py-3 rounded-xl"
          >
            Explore More
          </Link>
        </div>
      </div>
    </div>
  );
}