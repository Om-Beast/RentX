import { useState } from "react";
import vehicles from "../data/vehicles";
import VehicleCard from "../components/VehicleCard";

export default function VehicleListing() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const categories = [
  "All",
  "Scooter",
  "Bike",
  "Car",
  "SUV",
  "Family",
  "Electric",
  "Premium",
];

  const filteredVehicles = vehicles.filter((vehicle) => {
    const matchesSearch = vehicle.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    const matchesCategory =
      selectedCategory === "All" ||
      vehicle.category === selectedCategory;

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
            Find scooters, bikes, cars, SUVs and premium rides.
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <input
          type="text"
          placeholder="Search vehicle..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-4 border rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Category Filters */}
      <div className="max-w-7xl mx-auto px-4 pb-6">
        <div className="flex flex-wrap gap-3">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-5 py-2 rounded-full border transition ${
                selectedCategory === category
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
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
                key={vehicle.id}
                vehicle={vehicle}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-10">
              <h3 className="text-xl font-semibold text-gray-700">
                No vehicles found
              </h3>

              <p className="text-gray-500 mt-2">
                Try searching with another keyword or category.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}