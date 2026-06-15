import { useState } from "react";
import axios from "axios";

export default function AddVehicle() {
  const [formData, setFormData] = useState({
  name: "",
  brand: "",
  type: "car",
  model: "",
  year: "",
  rentPerDay: "",
  fuelType: "petrol",
  transmission: "manual",
  location: "",
  seats: "",
  description: "",
  images: "",
});

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem("token");
      const payload = {
      ...formData,
      images: formData.images
        ? [formData.images]
        : [],
    };

      const res = await axios.post(
        "http://localhost:5000/api/vehicles",
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert("Vehicle Added Successfully 🚀");

      console.log(res.data);

      setFormData({
        name: "",
        brand: "",
        type: "car",
        model: "",
        year: "",
        rentPerDay: "",
        fuelType: "petrol",
        transmission: "manual",
        location: "",
        seats: "",
        description: "",
      });
    } catch (error) {
      console.log(error);

      alert(
        error.response?.data?.message ||
          error.message ||
          "Failed to add vehicle"
      );
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-8">
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl shadow">
        <h1 className="text-3xl font-bold text-indigo-600 mb-6">
          Add Vehicle
        </h1>

        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <div>
            <label className="block mb-2 font-semibold text-black">
              Vehicle Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full border p-3 rounded-lg text-black"
              required
            />
          </div>

          <div>
            <label className="block mb-2 font-semibold text-black">
              Brand
            </label>
            <input
              type="text"
              name="brand"
              value={formData.brand}
              onChange={handleChange}
              className="w-full border p-3 rounded-lg text-black"
              required
            />
          </div>

          <div>
            <label className="block mb-2 font-semibold text-black">
              Model
            </label>
            <input
              type="text"
              name="model"
              value={formData.model}
              onChange={handleChange}
              className="w-full border p-3 rounded-lg text-black"
              required
            />
          </div>

          <div>
            <label className="block mb-2 font-semibold text-black">
              Year
            </label>
            <input
              type="number"
              name="year"
              value={formData.year}
              onChange={handleChange}
              className="w-full border p-3 rounded-lg text-black"
              required
            />
          </div>

          <div>
            <label className="block mb-2 font-semibold text-black">
              Rent Per Day
            </label>
            <input
              type="number"
              name="rentPerDay"
              value={formData.rentPerDay}
              onChange={handleChange}
              className="w-full border p-3 rounded-lg text-black"
              required
            />
          </div>

          <div>
            <label className="block mb-2 font-semibold text-black">
              Vehicle Type
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full border p-3 rounded-lg text-black"
            >
              <option value="car">Car</option>
              <option value="bike">Bike</option>
            </select>
          </div>

          <div>
            <label className="block mb-2 font-semibold text-black">
              Fuel Type
            </label>
            <select
              name="fuelType"
              value={formData.fuelType}
              onChange={handleChange}
              className="w-full border p-3 rounded-lg text-black"
            >
              <option value="petrol">Petrol</option>
              <option value="diesel">Diesel</option>
              <option value="electric">Electric</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </div>

          <div>
            <label className="block mb-2 font-semibold text-black">
              Transmission
            </label>
            <select
              name="transmission"
              value={formData.transmission}
              onChange={handleChange}
              className="w-full border p-3 rounded-lg text-black"
            >
              <option value="manual">Manual</option>
              <option value="automatic">Automatic</option>
            </select>
          </div>

          <div>
            <label className="block mb-2 font-semibold text-black">
              Location
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="w-full border p-3 rounded-lg text-black"
              required
            />
          </div>

          <div>
            <label className="block mb-2 font-semibold text-black">
              Seats
            </label>
            <input
              type="number"
              name="seats"
              value={formData.seats}
              onChange={handleChange}
              className="w-full border p-3 rounded-lg text-black"
              required
            />
          </div>

          <div>
            <label className="block mb-2 font-semibold text-black">
              Description
            </label>

            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              className="w-full border p-3 rounded-lg text-black"
              required
            />
          </div>

          <div>
      <label className="block mb-2 font-semibold text-black">
        Image URL
      </label>

      <input
        type="text"
        name="images"
        value={formData.images}
        onChange={handleChange}
        className="w-full border p-3 rounded-lg text-black"
        placeholder="Paste image URL"
      />
    </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-semibold"
          >
            Add Vehicle
          </button>
        </form>
      </div>
    </div>
  );
}