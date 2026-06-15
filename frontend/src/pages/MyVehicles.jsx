import { useEffect, useState } from "react";
import axios from "axios";

export default function MyVehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVehicles();
  }, []);
  const handleDelete = async (id) => {
  try {
    const token =
      localStorage.getItem("token");

    const confirmDelete =
      window.confirm(
        "Are you sure you want to delete this vehicle?"
      );

    if (!confirmDelete) return;

    await axios.delete(
      `http://localhost:5000/api/vehicles/${id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    alert(
      "Vehicle deleted successfully"
    );

    fetchVehicles();
  } catch (error) {
    console.log(error);

    alert(
      error.response?.data?.message ||
        "Failed to delete vehicle"
    );
  }
};
const handleToggleAvailability =
  async (id) => {
    try {
      const token =
        localStorage.getItem("token");

      await axios.patch(
        `http://localhost:5000/api/vehicles/${id}/toggle-availability`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      fetchVehicles();
    } catch (error) {
      console.log(error);

      alert(
        error.response?.data?.message ||
          "Failed to update vehicle"
      );
    }
  };

  const fetchVehicles = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.get(
        "http://localhost:5000/api/vehicles/my-vehicles",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setVehicles(res.data.vehicles || []);
    } catch (error) {
      console.log(error);
      alert(
        error.response?.data?.message ||
          "Failed to load vehicles"
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <h1 className="text-2xl font-semibold">
          Loading Vehicles...
        </h1>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-indigo-600">
          My Vehicles
        </h1>

        <span className="bg-white px-4 py-2 rounded-xl shadow">
          {vehicles.length} Vehicles
        </span>
      </div>

      {vehicles.length === 0 ? (
        <div className="bg-white rounded-2xl shadow p-8 text-center">
          <h2 className="text-2xl font-semibold">
            No Vehicles Found
          </h2>

          <p className="text-gray-500 mt-2">
            Add your first vehicle to start
            receiving bookings.
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vehicles.map((vehicle) => (
            <div
              key={vehicle._id}
              className="bg-white rounded-2xl shadow overflow-hidden"
            >
              <div className="h-48 bg-gray-200 flex items-center justify-center">
                {vehicle.images &&
                vehicle.images.length > 0 ? (
                  <img
                    src={vehicle.images[0]}
                    alt={vehicle.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-gray-500">
                    No Image
                  </span>
                )}
              </div>

              <div className="p-5">
                <h2 className="text-2xl font-bold">
                  {vehicle.name}
                </h2>

                <p className="text-gray-600">
                  {vehicle.brand} •{" "}
                  {vehicle.model}
                </p>

                <p className="text-gray-600">
                  {vehicle.year}
                </p>

                <p className="text-indigo-600 font-bold text-xl mt-3">
                  ₹{vehicle.rentPerDay}/day
                </p>

                <div className="mt-3">
                  <span
                    className={`px-3 py-1 rounded-full text-white text-sm ${
                      vehicle.isAvailable
                        ? "bg-green-500"
                        : "bg-red-500"
                    }`}
                  >
                    {vehicle.isAvailable
                      ? "Available"
                      : "Unavailable"}
                  </span>
                </div>

                <div className="flex gap-2 mt-5">
                <button
            onClick={() =>
                window.location.href =
                `/edit-vehicle/${vehicle._id}`
            }
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg"
            >
            Edit
            </button>

                  <button
                onClick={() =>
                    handleDelete(vehicle._id)
                }
                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg"
                >
                Delete
                </button>

                 <button
                onClick={() =>
                    handleToggleAvailability(
                    vehicle._id
                    )
                }
                className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white py-2 rounded-lg"
                >
                Toggle
                </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}