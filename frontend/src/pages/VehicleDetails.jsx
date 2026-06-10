import { useState } from "react";
import {
  useParams,
  Link,
  useNavigate,
} from "react-router-dom";
import vehicles from "../data/vehicles";

export default function VehicleDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const vehicle = vehicles.find(
    (v) => v.id === Number(id)
  );

  const [pickupDate, setPickupDate] = useState("");
  const [returnDate, setReturnDate] = useState("");

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
    (vehicle?.pricePerDay || 0);
    const gst = Math.round(totalPrice * 0.18);

const platformFee =
  vehicle.platformFee || 99;

const securityDeposit =
  vehicle.securityDeposit || 1000;

const finalAmount =
  totalPrice +
  gst +
  platformFee +
  securityDeposit;

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
        {/* Back Button */}
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
              src={vehicle.image}
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

            <p className="text-slate-500 mt-2">
              {vehicle.category}
            </p>
            <div className="flex flex-wrap gap-2 mt-3">

            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium">
                Insurance Included
            </span>

            <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">
                Free Delivery
            </span>

            {vehicle.category === "Premium" && (
                <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-medium">
                Premium Vehicle
                </span>
            )}

            </div>


            <div className="flex items-center gap-2 mt-4">
              <span className="text-yellow-500">
                ⭐
              </span>

              <span className="font-medium">
                {vehicle.rating}
              </span>
            </div>

            <div className="mt-6">
              <span className="text-4xl font-bold text-indigo-600">
                ₹{vehicle.pricePerDay}
              </span>

              <span className="text-slate-500 text-lg">
                {" "}
                / day
              </span>
            </div>

            {/* SPECS */}
            <div className="grid grid-cols-2 gap-4 mt-8">
              <div className="bg-white p-4 rounded-xl shadow-sm">
                <p className="text-slate-500 text-sm">
                  Fuel
                </p>
                <p className="font-semibold text-slate-900">
                  {vehicle.fuel}
                </p>
              </div>

              <div className="bg-white p-4 rounded-xl shadow-sm">
                <p className="text-slate-500 text-sm">
                  Transmission
                </p>
                <p className="font-semibold text-slate-900">
                  {vehicle.transmission}
                </p>
              </div>

              <div className="bg-white p-4 rounded-xl shadow-sm">
                <p className="text-slate-500 text-sm">
                  Seats
                </p>
                <p className="font-semibold text-slate-900">
                  {vehicle.seats}
                </p>
              </div>

              <div className="bg-white p-4 rounded-xl shadow-sm">
                <p className="text-slate-500 text-sm">
                  Category
                </p>
                <p className="font-semibold text-slate-900">
                  {vehicle.category}
                </p>
              </div>
            </div>

            {/* RENTAL CALCULATOR */}
            <div className="mt-8 bg-white p-5 rounded-2xl shadow-sm">
              <h3 className="font-semibold text-lg mb-4">
                Select Rental Dates
              </h3>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-600 mb-2">
                    Pickup Date
                  </label>

                  <input
                    type="date"
                    value={pickupDate}
                    min={minDate}
                    onChange={(e) =>
                      setPickupDate(
                        e.target.value
                      )
                    }
                    className="w-full border rounded-lg p-3 bg-white text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-600 mb-2">
                    Return Date
                  </label>

                  <input
                    type="date"
                    value={returnDate}
                    min={
                      pickupDate ||
                      minDate
                    }
                    onChange={(e) =>
                      setReturnDate(
                        e.target.value
                      )
                    }
                    className="w-full border rounded-lg p-3 bg-white text-slate-900"
                  />
                </div>
              </div>

              <div className="mt-4 border-t pt-4">
                {pickupDate &&
                returnDate ? (
                  <>
                    <p className="text-slate-600">
                      Rental Days:
                      <span className="font-semibold ml-2">
                        {rentalDays}
                      </span>
                    </p>

                    <p className="text-slate-600 mt-2">
                      Pickup:
                      <span className="font-medium ml-2">
                        {pickupDate}
                      </span>
                    </p>

                    <p className="text-slate-600 mt-2">
                      Return:
                      <span className="font-medium ml-2">
                        {returnDate}
                      </span>
                    </p>

                   <div className="mt-4 space-y-2">

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
                  </>
                ) : (
                  <p className="text-slate-500">
                    Select pickup and
                    return date to see
                    total rent.
                  </p>
                )}
              </div>
            </div>

            {/* BOOK BUTTON */}
            <button
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
                        },
                    })
                    }
                className="w-full mt-8 bg-indigo-600 text-white py-4 rounded-xl font-semibold hover:bg-indigo-700 transition"
                >
                Book Now
                </button>

            {/* OWNER CARD */}
            <div className="bg-white mt-8 p-5 rounded-2xl shadow-sm border">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">
                  Vehicle Owner
                </h3>

                {vehicle.verified && (
                  <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">
                    Verified ✓
                  </span>
                )}
              </div>

              <p className="mt-3 font-medium">
                {vehicle.owner ||
                  "RentX Partner"}
              </p>

              <p className="text-slate-500 text-sm">
                {vehicle.city ||
                  "Jabalpur"}
              </p>

              <div className="mt-4 pt-4 border-t">
                <p className="text-slate-600">
                  Total Rentals:
                  <span className="font-semibold ml-2">
                    {vehicle.bookings ||
                      100}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}