import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

export default function VehicleCard({ vehicle }) {
  const navigate = useNavigate();

  const goToDetails = () => {
    navigate(`/vehicles/${vehicle.id}`);
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
          src={vehicle.image}
          alt={vehicle.name}
          className="w-full h-52 object-cover"
        />

        {/* Top Left Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-2">
          <span className="bg-green-600 text-white text-xs px-2 py-1 rounded-full">
            ✓ Verified
          </span>

          <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
            🔥 Popular
          </span>
        </div>

        {/* Availability */}
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

            <p className="text-sm text-gray-500">
              {vehicle.category}
            </p>

            {/* Category Badges */}
            <div className="flex gap-2 mt-2">
              {vehicle.category === "Premium" && (
                <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-1 rounded-full">
                  Premium
                </span>
              )}

              {vehicle.category === "Electric" && (
                <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">
                  Electric
                </span>
              )}
            </div>
          </div>

          <span className="text-yellow-500 font-medium">
            ⭐ {vehicle.rating}
          </span>
        </div>

        {/* Specs */}
        <div className="mt-4 grid grid-cols-3 gap-2 text-sm text-gray-600">
          <div>{vehicle.fuel}</div>
          <div>{vehicle.transmission}</div>
          <div>{vehicle.seats} Seats</div>
        </div>

        {/* Price */}
        <div className="mt-5 flex items-center justify-between">
          <div>
            <span className="text-2xl font-bold text-indigo-600">
              ₹{vehicle.pricePerDay}
            </span>

            <span className="text-gray-500 text-sm">
              {" "}
              / day
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