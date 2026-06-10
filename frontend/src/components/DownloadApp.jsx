import { motion } from "framer-motion";
import { Smartphone, Apple, Play, Star } from "lucide-react";

export default function DownloadApp() {
  return (
    <section className="py-24 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          
          {/* Left Side */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100 mb-6">
              <Smartphone className="w-4 h-4 text-indigo-600" />
              <span className="text-sm font-semibold text-indigo-600">
                RentX Mobile App
              </span>
            </div>

            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
              Rent Vehicles
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-cyan-500">
                Anywhere, Anytime
              </span>
            </h2>

            <p className="mt-6 text-lg text-gray-600 max-w-lg">
              Book scooters, bikes, cars, SUVs and luxury vehicles across India.
              Track bookings, manage trips and enjoy a seamless rental experience.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mt-8">
              <button className="flex items-center gap-3 bg-black text-white px-6 py-4 rounded-2xl hover:scale-105 transition">
                <Apple className="w-6 h-6" />
                <div className="text-left">
                  <p className="text-xs">Download on the</p>
                  <p className="font-bold">App Store</p>
                </div>
              </button>

              <button className="flex items-center gap-3 bg-white border px-6 py-4 rounded-2xl hover:scale-105 transition">
                <Play className="w-6 h-6" />
                <div className="text-left">
                  <p className="text-xs text-gray-500">Get it on</p>
                  <p className="font-bold">Google Play</p>
                </div>
              </button>
            </div>

            <div className="flex items-center gap-2 mt-8">
              {[1, 2, 3, 4, 5].map((item) => (
                <Star
                  key={item}
                  className="w-5 h-5 fill-yellow-400 text-yellow-400"
                />
              ))}
              <span className="text-gray-600 font-medium">
                4.9 Rating • 100K+ Downloads
              </span>
            </div>
          </motion.div>

          {/* Right Side */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="flex justify-center"
          >
            <div className="relative">
              
              <div className="absolute -top-5 -left-8 bg-white shadow-xl px-4 py-3 rounded-2xl font-semibold text-sm">
                ⚡ Instant Booking
              </div>

              <div className="absolute top-32 -right-8 bg-white shadow-xl px-4 py-3 rounded-2xl font-semibold text-sm">
                ✅ Verified Owners
              </div>

              <div className="absolute bottom-10 -left-8 bg-white shadow-xl px-4 py-3 rounded-2xl font-semibold text-sm">
                💰 Best Prices
              </div>

              <div className="w-[280px] h-[560px] bg-black rounded-[3rem] p-3 shadow-2xl">
                <div className="w-full h-full bg-white rounded-[2.5rem] overflow-hidden">
                  
                  <div className="h-44 bg-gradient-to-r from-indigo-600 to-cyan-500" />

                  <div className="p-5">
                    <h3 className="text-xl font-bold text-gray-900">
                      Choose Your Ride
                    </h3>

                    <div className="space-y-3 mt-4">
                      {[
                        "Honda Activa",
                        "Royal Enfield",
                        "Hyundai Creta",
                      ].map((vehicle) => (
                        <div
                          key={vehicle}
                          className="flex justify-between items-center p-3 border rounded-xl"
                        >
                          <span className="font-medium">{vehicle}</span>
                          <span className="font-bold text-indigo-600">
                            ₹499
                          </span>
                        </div>
                      ))}
                    </div>

                    <button className="w-full mt-6 bg-black text-white py-3 rounded-xl font-semibold">
                      Confirm Ride
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}