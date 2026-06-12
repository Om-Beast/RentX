import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-black/50 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        <Link
          to="/"
          className="text-2xl font-bold text-white"
        >
          RENT
          <span className="text-blue-500">
            X
          </span>
        </Link>

        <div className="hidden md:flex gap-8 text-gray-300">
          <Link to="/vehicles">
            Vehicles
          </Link>

          <Link to="/my-bookings">
            My Bookings
          </Link>

          <Link to="/dashboard">
            Dashboard
          </Link>
        </div>

        <Link
          to="/login"
          className="bg-blue-600 hover:bg-blue-500 px-5 py-2 rounded-lg text-white font-medium"
        >
          Sign In
        </Link>
      </div>
    </nav>
  );
}