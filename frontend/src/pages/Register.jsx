import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "CUSTOMER",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      const res = await axios.post(
        "http://localhost:5000/api/auth/register",
        form
      );

      console.log(res.data);

      alert("Registration Successful ✅");

      navigate("/login");
    } catch (error) {
      console.log(error);

      alert(
        error?.response?.data?.message ||
          "Registration Failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-slate-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-3xl shadow-lg w-full max-w-md"
      >
        <h1 className="text-4xl font-bold text-indigo-600 mb-8 text-center">
          Register
        </h1>

        <input
          type="text"
          name="name"
          placeholder="Name"
          value={form.name}
          onChange={handleChange}
          required
          className="w-full border border-gray-300 p-4 rounded-xl mb-4 bg-white text-black placeholder-gray-500 outline-none"
        />

        <input
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          required
          className="w-full border border-gray-300 p-4 rounded-xl mb-4 bg-white text-black placeholder-gray-500 outline-none"
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          required
          className="w-full border border-gray-300 p-4 rounded-xl mb-4 bg-white text-black placeholder-gray-500 outline-none"
        />

        <select
          name="role"
          value={form.role}
          onChange={handleChange}
          className="w-full border border-gray-300 p-4 rounded-xl mb-6 bg-white text-black outline-none"
        >
          <option value="CUSTOMER">
            Customer
          </option>

          <option value="FLEET_OWNER">
            Fleet Owner
          </option>
        </select>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-4 rounded-xl hover:bg-indigo-700 transition"
        >
          {loading
            ? "Registering..."
            : "Register"}
        </button>

        <p className="mt-5 text-center text-black">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-indigo-600 font-semibold"
          >
            Login
          </Link>
        </p>
      </form>
    </div>
  );
}