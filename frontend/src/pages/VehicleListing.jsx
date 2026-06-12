import { useState, useEffect } from "react";
import axios from "axios";
import VehicleCard from "../components/VehicleCard";

export default function VehicleListing() {
  const [vehicles, setVehicles] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const categories = [
    "All",
    "Bike",
    "Car",
  ];

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const res = await axios.get(
          "http://localhost:5000/api/vehicles"
        );

        console.log("API DATA:", res.data);

        setVehicles(res.data.vehicles);
      } catch (error) {
        console.log("API ERROR:", error);
      }
    };

    fetchVehicles();
  }, []);

  console.log("Vehicles:", vehicles);

  const filteredVehicles = vehicles.filter((vehicle) => {
    const matchesSearch = vehicle.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    const matchesCategory =
      selectedCategory === "All" ||
      vehicle.type?.toLowerCase() ===
        selectedCategory.toLowerCase();

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold text-slate-900">
            Explore Vehicles
          </h1>

          <p className="text-slate-600 mt-2">
            Find bikes and cars available for rent.
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <input
          type="text"
          placeholder="Search vehicle..."
          value={searchTerm}
          onChange={(e) =>
            setSearchTerm(e.target.value)
          }
          className="w-full p-4 border rounded-xl text-slate-900"
        />
      </div>

      {/* Category */}
      <div className="max-w-7xl mx-auto px-4 pb-6">
        <div className="flex flex-wrap gap-3">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() =>
                setSelectedCategory(category)
              }
              className={`px-5 py-2 rounded-full border ${
                selectedCategory === category
                  ? "bg-indigo-600 text-white"
                  : "bg-white text-slate-700"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Vehicle Grid */}
      <div className="max-w-7xl mx-auto px-4 pb-10">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredVehicles.length > 0 ? (
            filteredVehicles.map((vehicle) => (
              <VehicleCard
                key={vehicle._id}
                vehicle={vehicle}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-10">
              <h3 className="text-xl font-semibold text-gray-700">
                No vehicles found
              </h3>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}