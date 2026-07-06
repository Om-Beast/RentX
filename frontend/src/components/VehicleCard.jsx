import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

export default function VehicleCard({ vehicle }) {
  const navigate = useNavigate();

  const goToDetails = () => {
    navigate(`/vehicles/${vehicle._id}`);
  };

  const getVehicleImage = () => {
    const name = vehicle.name?.toLowerCase() || "";

    if (name.includes("activa")) return "/vehicles/activa.png";
    if (name.includes("classic")) return "/vehicles/Classic-350.png";
    if (name.includes("thar")) return "/vehicles/thar.png";
    if (name.includes("nexon")) return "/vehicles/nexon.png";
    if (name.includes("creta")) return "/vehicles/creta.png";
    if (name.includes("city")) return "/vehicles/city.png";
    if (name.includes("scorpio")) return "/vehicles/scorpio.png";
    if (name.includes("innova")) return "/vehicles/innova.png";
    if (name.includes("ola")) return "/vehicles/ola.png";
    if (name.includes("bmw")) return "/vehicles/bmw.png";

    return "/vehicles/city.png";
  };

  return (
    <motion.div
      whileHover={{
        y: -8,
        scale: 1.02,
      }}
      transition={{ duration: 0.25 }}
      onClick={goToDetails}
      className="group bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-lg hover:shadow-2xl transition-all cursor-pointer"
    >
      {/* IMAGE */}
      <div className="relative overflow-hidden">
        <img
          src={getVehicleImage()}
          alt={vehicle.name}
          className="w-full h-56 object-cover group-hover:scale-110 transition duration-500"
        />

        {/* Left Badges */}
        <div className="absolute top-3 left-3 flex gap-2 flex-wrap">
          <span className="bg-green-600 text-white text-xs px-3 py-1 rounded-full">
            ✓ Verified
          </span>

          {vehicle.rentPerDay >= 2500 && (
            <span className="bg-orange-500 text-white text-xs px-3 py-1 rounded-full">
              🔥 Popular
            </span>
          )}
        </div>

        {/* Right Badge */}
        <div className="absolute top-3 right-3">
          <span
            className={`text-xs font-medium px-3 py-1 rounded-full shadow ${
              vehicle.isAvailable
                ? "bg-white text-green-700"
                : "bg-red-500 text-white"
            }`}
          >
            {vehicle.isAvailable ? "⚡ Available" : "Booked"}
          </span>
        </div>
      </div>

      {/* CONTENT */}
      <div className="p-5">
        {/* Title */}
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-xl font-bold text-slate-900">
              {vehicle.name}
            </h3>

            <p className="capitalize text-slate-500">
              {vehicle.type}
            </p>
          </div>

          <span className="text-yellow-500 font-semibold">
            ⭐ {vehicle.rating > 0 ? vehicle.rating : "New"}
          </span>
        </div>

        {/* Location */}
        <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
          <span>📍 {vehicle.location || "India"}</span>

          <span>•</span>

          <span>{vehicle.seats || "-"} Seats</span>
        </div>

        {/* Specs */}
        <div className="mt-4 grid grid-cols-3 gap-2 text-sm text-slate-600">
          <div>{vehicle.fuelType || "-"}</div>

          <div>{vehicle.transmission || "-"}</div>

          <div>{vehicle.year}</div>
        </div>

        {/* Price */}
        <div className="mt-6 flex items-center justify-between">
          <div>
            <span className="text-3xl font-bold text-indigo-600">
              ₹{vehicle.rentPerDay}
            </span>

            <span className="text-slate-500 text-sm">
              {" "}
              / day
            </span>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              goToDetails();
            }}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-medium hover:shadow-lg transition"
          >
            View Details →
          </button>
        </div>
      </div>
    </motion.div>
  );
}