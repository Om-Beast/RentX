import { useState } from "react";
import axios from "axios";
import {
  useLocation,
  Navigate,
  useNavigate,
} from "react-router-dom";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  Phone,
  IdCard,
  MapPin,
  Calendar,
} from "lucide-react";

export default function Checkout() {
  const location = useLocation();
  const navigate = useNavigate();
  const bookingData = location.state;

  if (!bookingData) {
    return <Navigate to="/vehicles" replace />;
  }

const {
  vehicle,
  rentalDays,
  totalPrice,
  gst,
  platformFee,
  securityDeposit,
  finalAmount,
  pickupDate,
  returnDate,
} = bookingData;

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    license: "",
    pickup: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  const getVehicleImage = () => {
  const name = vehicle?.name?.toLowerCase() || "";

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

  return "/vehicles/default.png";
};

 const handlePayment = async () => {
  console.log("pickupDate =", pickupDate);
console.log("returnDate =", returnDate);
  try {
    setLoading(true);

 const bookingPayload = {
  user: "6a28ef02f4c6059ef61efc3a",
  vehicle: vehicle._id,
  startDate: pickupDate,
  endDate: returnDate,
  totalPrice: finalAmount,
  bookingStatus: "pending",
  paymentStatus: "paid",
};

console.log("BOOKING PAYLOAD");
console.log(bookingPayload);

    const res = await axios.post(
      "http://localhost:5000/api/bookings",
      bookingPayload
    );

    console.log(res.data);

    if (res.data.success) {
      navigate("/booking-success");
    }

  } catch (error) {
    console.log(error.response?.data);
    alert(error.response?.data?.message);
  } finally {
    setLoading(false);
  }
};

  return (
    <motion.section
      className="min-h-screen bg-slate-50 py-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="max-w-6xl mx-auto px-4 grid lg:grid-cols-2 gap-8">
        {/* LEFT */}
        <div className="bg-white rounded-3xl shadow-lg p-8">
          <h2 className="text-3xl font-bold text-indigo-600 mb-6">
            Booking Details
          </h2>

          <div className="space-y-5">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium mb-2">
                <User size={16} />
                Full Name
              </label>

              <input
                type="text"
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                placeholder="Enter your name"
                className="w-full border rounded-xl p-3"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium mb-2">
                <Mail size={16} />
                Email
              </label>

              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="john@example.com"
                className="w-full border rounded-xl p-3"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium mb-2">
                <Phone size={16} />
                Phone Number
              </label>

              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="+91 9876543210"
                className="w-full border rounded-xl p-3"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium mb-2">
                <IdCard size={16} />
                Driving License Number
              </label>

              <input
                type="text"
                name="license"
                value={form.license}
                onChange={handleChange}
                placeholder="DL-XXXXXXXX"
                className="w-full border rounded-xl p-3"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium mb-2">
                <MapPin size={16} />
                Pickup Location
              </label>

              <input
                type="text"
                name="pickup"
                value={form.pickup}
                onChange={handleChange}
                placeholder="Jabalpur, Madhya Pradesh"
                className="w-full border rounded-xl p-3"
              />
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="bg-white rounded-3xl shadow-lg p-8">
          <h2 className="text-3xl font-bold text-indigo-600 mb-6">
            Booking Summary
          </h2>

          <div className="flex gap-4 mb-6">
            <img
               src={getVehicleImage()}
              alt={vehicle.name}
              className="w-28 h-28 rounded-xl object-cover border"
            />

            <div>
              <h3 className="font-bold text-xl text-slate-900">
  {vehicle.name}
      </h3>

      <p className="text-sm text-gray-500">
        {vehicle.brand} • {vehicle.model}
      </p>

              <p className="text-gray-600 mt-1">
                {vehicle.brand}
              </p>

              <p className="text-gray-500">
                {vehicle.fuelType} • {vehicle.transmission}
              </p>

              <p className="text-green-600 font-medium">
                Available Now
              </p>

              <p className="text-gray-500 flex items-center gap-2 mt-2">
                <Calendar size={16} />
                {rentalDays} Days Rental
              </p>

              <p className="text-indigo-600 font-semibold mt-2">
                ₹{vehicle.rentPerDay}/day
              </p>
            </div>
          </div>

          <div className="space-y-3 text-gray-700">
            <div className="flex justify-between">
              <span>Rent Amount</span>
              <span>₹{totalPrice}</span>
            </div>

            <div className="flex justify-between">
              <span>GST (18%)</span>
              <span>₹{gst}</span>
            </div>

            <div className="flex justify-between">
              <span>Platform Fee</span>
              <span>₹{platformFee}</span>
            </div>

            <div className="flex justify-between">
              <span>Security Deposit</span>
              <span>₹{securityDeposit}</span>
            </div>

            <hr />

            <div className="flex justify-between text-2xl font-bold text-indigo-600">
              <span>Total Payable</span>
              <span>₹{finalAmount}</span>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={loading}
            onClick={handlePayment}
            className="mt-8 w-full bg-indigo-600 text-white py-4 rounded-xl font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
          >
            {loading
              ? "Processing..."
              : "Proceed To Payment"}
          </motion.button>
        </div>
      </div>
    </motion.section>
  );
}