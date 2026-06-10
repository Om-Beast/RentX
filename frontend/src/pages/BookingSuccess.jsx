import { Link } from "react-router-dom";

export default function BookingSuccess() {
  const bookingId =
    "RX" +
    Math.floor(
      100000 + Math.random() * 900000
    );

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-xl p-10 text-center">

        <div className="text-6xl mb-4">
          🎉
        </div>

        <h1 className="text-4xl font-bold text-green-600">
          Booking Confirmed
        </h1>

        <p className="mt-4 text-slate-600">
          Your vehicle has been booked
          successfully.
        </p>

        <div className="mt-8 bg-slate-50 rounded-2xl p-6 border">

          <div className="flex justify-between py-2">
            <span className="text-slate-500">
              Booking ID
            </span>

            <span className="font-semibold">
              {bookingId}
            </span>
          </div>

          <div className="flex justify-between py-2">
            <span className="text-slate-500">
              Status
            </span>

            <span className="text-green-600 font-semibold">
              Confirmed
            </span>
          </div>

          <div className="flex justify-between py-2">
            <span className="text-slate-500">
              Payment
            </span>

            <span className="text-green-600 font-semibold">
              Successful
            </span>
          </div>

        </div>

        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">

          <Link
            to="/vehicles"
            className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition"
          >
            Book Another Vehicle
          </Link>

          <Link
            to="/"
            className="border border-slate-300 px-6 py-3 rounded-xl font-semibold hover:bg-slate-100 transition"
          >
            Back To Home
          </Link>

        </div>
      </div>
    </div>
  );
}