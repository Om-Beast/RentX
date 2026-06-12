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

    return "/vehicles/activa.png";
  };

  return (
    <motion.div
      whileHover={{ y: -8 }}
      transition={{ duration: 0.2 }}
      onClick={goToDetails}
      className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100 hover:shadow-2xl transition cursor-pointer"
    >
      {/* Image */}
      <div className="relative">
        <img
          src={getVehicleImage()}
          alt={vehicle.name}
          className="w-full h-52 object-cover"
        />

        <div className="absolute top-3 left-3 flex gap-2">
          <span className="bg-green-600 text-white text-xs px-2 py-1 rounded-full">
            ✓ Verified
          </span>

          <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
            🔥 Popular
          </span>
        </div>

        <div className="absolute top-3 right-3">
          <span className="bg-white text-green-700 text-xs font-medium px-2 py-1 rounded-full shadow">
            ⚡ Available
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {vehicle.name}
            </h3>

            <p className="text-sm text-gray-500 capitalize">
              {vehicle.type}
            </p>
          </div>

          <span className="text-yellow-500 font-medium">
            ⭐ 4.8
          </span>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 text-sm text-gray-600">
          <div>{vehicle.fuelType}</div>
          <div>{vehicle.transmission}</div>
          <div>{vehicle.year}</div>
        </div>

        <div className="mt-5 flex items-center justify-between">
          <div>
            <span className="text-2xl font-bold text-indigo-600">
              ₹{vehicle.rentPerDay}
            </span>

            <span className="text-gray-500 text-sm">
              {" "} / day
            </span>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              goToDetails();
            }}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
          >
            View Details
          </button>
        </div>
      </div>
    </motion.div>
  );
}