import { useEffect, useState } from "react";
import axios from "axios";
import {
  useParams,
  useNavigate,
} from "react-router-dom";

export default function EditVehicle() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] =
    useState(true);

  const [formData, setFormData] =
    useState({
      name: "",
      brand: "",
      model: "",
      year: "",
      rentPerDay: "",
      location: "",
      description: "",
    });

  useEffect(() => {
    fetchVehicle();
  }, []);

  const fetchVehicle = async () => {
    try {
      const res =
        await axios.get(
          `http://localhost:5000/api/vehicles/${id}`
        );

      const vehicle =
        res.data.vehicle;

      setFormData({
        name: vehicle.name || "",
        brand: vehicle.brand || "",
        model: vehicle.model || "",
        year: vehicle.year || "",
        rentPerDay:
          vehicle.rentPerDay || "",
        location:
          vehicle.location || "",
        description:
          vehicle.description || "",
      });
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]:
        e.target.value,
    });
  };

  const handleSubmit = async (
    e
  ) => {
    e.preventDefault();

    try {
      const token =
        localStorage.getItem(
          "token"
        );

      await axios.put(
        `http://localhost:5000/api/vehicles/${id}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert(
        "Vehicle Updated Successfully 🚀"
      );

      navigate("/my-vehicles");
    } catch (error) {
      console.log(error);

      alert(
        error.response?.data
          ?.message ||
          "Update Failed"
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <h1 className="text-2xl font-bold">
          Loading...
        </h1>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-8">
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl shadow">
        <h1 className="text-3xl font-bold text-indigo-600 mb-6">
          Edit Vehicle
        </h1>

        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <input
            type="text"
            name="name"
            placeholder="Vehicle Name"
            value={formData.name}
            onChange={
              handleChange
            }
            className="w-full border p-3 rounded-lg"
          />

          <input
            type="text"
            name="brand"
            placeholder="Brand"
            value={formData.brand}
            onChange={
              handleChange
            }
            className="w-full border p-3 rounded-lg"
          />

          <input
            type="text"
            name="model"
            placeholder="Model"
            value={formData.model}
            onChange={
              handleChange
            }
            className="w-full border p-3 rounded-lg"
          />

          <input
            type="number"
            name="year"
            placeholder="Year"
            value={formData.year}
            onChange={
              handleChange
            }
            className="w-full border p-3 rounded-lg"
          />

          <input
            type="number"
            name="rentPerDay"
            placeholder="Rent Per Day"
            value={
              formData.rentPerDay
            }
            onChange={
              handleChange
            }
            className="w-full border p-3 rounded-lg"
          />

          <input
            type="text"
            name="location"
            placeholder="Location"
            value={
              formData.location
            }
            onChange={
              handleChange
            }
            className="w-full border p-3 rounded-lg"
          />

          <textarea
            name="description"
            placeholder="Description"
            value={
              formData.description
            }
            onChange={
              handleChange
            }
            rows="4"
            className="w-full border p-3 rounded-lg"
          />

          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-semibold"
          >
            Update Vehicle
          </button>
        </form>
      </div>
    </div>
  );
}