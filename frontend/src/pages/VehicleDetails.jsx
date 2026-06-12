import { useState, useEffect } from "react";
import axios from "axios";
import {
  useParams,
  Link,
  useNavigate,
} from "react-router-dom";

export default function VehicleDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);

  const [pickupDate, setPickupDate] = useState("");
  const [returnDate, setReturnDate] = useState("");

  useEffect(() => {
    const fetchVehicle = async () => {
      try {
        const res = await axios.get(
          `http://localhost:5000/api/vehicles/${id}`
        );

        setVehicle(res.data.vehicle);
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    };

    fetchVehicle();
  }, [id]);

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

    return "/vehicles/activa.png";
  };

  const today = new Date();
  today.setMinutes(
    today.getMinutes() -
      today.getTimezoneOffset()
  );

  const minDate =
    today.toISOString().split("T")[0];

  const calculateDays = () => {
    if (!pickupDate || !returnDate)
      return 0;

    const start = new Date(pickupDate);
    const end = new Date(returnDate);

    const diff =
      (end - start) /
      (1000 * 60 * 60 * 24);

    return diff > 0 ? diff : 0;
  };

  const rentalDays = calculateDays();

  const totalPrice =
    rentalDays *
    (vehicle?.rentPerDay || 0);

  const gst = Math.round(
    totalPrice * 0.18
  );

  const platformFee = 99;
  const securityDeposit = 1000;

  const finalAmount =
    rentalDays > 0
      ? totalPrice +
        gst +
        platformFee +
        securityDeposit
      : 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-2xl font-bold">
        Loading...
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <h2 className="text-2xl font-bold text-red-500">
          Vehicle Not Found
        </h2>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <Link
          to="/vehicles"
          className="text-indigo-600 font-medium hover:underline"
        >
          ← Back to Vehicles
        </Link>

        <div className="grid lg:grid-cols-2 gap-10 mt-6">
          {/* IMAGE */}
          <div>
            <img
              src={getVehicleImage()}
              alt={vehicle.name}
              className="w-full h-[450px] object-cover rounded-3xl shadow-lg"
            />
          </div>

          {/* DETAILS */}
          <div>
            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">
              Available Now
            </span>

            <h1 className="text-4xl font-bold text-slate-900 mt-4">
              {vehicle.name}
            </h1>

            <p className="text-slate-500 mt-2 capitalize">
              {vehicle.type}
            </p>

            <div className="mt-6">
              <span className="text-4xl font-bold text-indigo-600">
                ₹{vehicle.rentPerDay}
              </span>

              <span className="text-slate-500 text-lg">
                {" "} / day
              </span>
            </div>

            {/* SPECS */}
            <div className="grid grid-cols-2 gap-4 mt-8">
              <div className="bg-white p-4 rounded-xl shadow-sm">
                <p className="text-slate-500 text-sm">
                  Fuel
                </p>
                <p className="font-semibold text-black">
                  {vehicle.fuelType || "N/A"}
                </p>
              </div>

              <div className="bg-white p-4 rounded-xl shadow-sm">
                <p className="text-slate-500 text-sm">
                  Transmission
                </p>
                <p className="font-semibold text-black">
                  {vehicle.transmission || "N/A"}
                </p>
              </div>

              <div className="bg-white p-4 rounded-xl shadow-sm">
                <p className="text-slate-500 text-sm">
                  Brand
                </p>
                <p className="font-semibold text-black">
                  {vehicle.brand || "N/A"}
                </p>
              </div>

              <div className="bg-white p-4 rounded-xl shadow-sm">
                <p className="text-slate-500 text-sm">
                  Year
                </p>
                <p className="font-semibold text-black">
                  {vehicle.year || "N/A"}
                </p>
              </div>
            </div>

            {/* DATE SECTION */}
            <div className="mt-8 bg-white p-5 rounded-2xl shadow-sm">
              <h3 className="font-semibold text-lg mb-4">
                Select Rental Dates
              </h3>

              <div className="grid md:grid-cols-2 gap-4">
                <input
                  type="date"
                  min={minDate}
                  value={pickupDate}
                  onChange={(e) =>
                    setPickupDate(e.target.value)
                  }
                  className="w-full border border-gray-300 p-3 rounded-lg bg-white text-black"
                />

                <input
                  type="date"
                  min={pickupDate || minDate}
                  value={returnDate}
                  onChange={(e) =>
                    setReturnDate(e.target.value)
                  }
                  className="w-full border border-gray-300 p-3 rounded-lg bg-white text-black"
                />
              </div>

              <div className="mt-3 text-sm text-indigo-600">
                Pickup: {pickupDate || "Not Selected"}
              </div>

              <div className="text-sm text-indigo-600">
                Return: {returnDate || "Not Selected"}
              </div>

              <div className="mt-5 space-y-2">
                <div className="flex justify-between">
                  <span>Rental Days</span>
                  <span>{rentalDays}</span>
                </div>

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
                  <span>Total</span>
                  <span>₹{finalAmount}</span>
                </div>
              </div>
            </div>

            <button
              disabled={rentalDays <= 0}
          onClick={() =>
        navigate("/checkout", {
          state: {
            vehicle,
            rentalDays,
            totalPrice,
            gst,
            platformFee,
            securityDeposit,
            finalAmount,
            pickupDate,
            returnDate,
          },
        })
      }
              className={`w-full mt-8 py-4 rounded-xl font-semibold transition ${
                rentalDays > 0
                  ? "bg-indigo-600 text-white hover:bg-indigo-700"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              Book Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}