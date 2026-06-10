import { Search, MapPin, Calendar } from "lucide-react";

export default function Hero() {
  return (
    <section className="min-h-screen bg-[#050816] text-white flex items-center">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 grid lg:grid-cols-2 gap-12 items-center">

        {/* Left Side */}
        <div>
          <span className="inline-block px-4 py-2 rounded-full bg-blue-500/10 text-blue-400 text-sm mb-6">
            Premium Vehicle Rental Platform
          </span>

          <h1 className="text-5xl lg:text-7xl font-bold leading-tight mb-6">
            Rent Any Vehicle.
            <br />
            <span className="text-blue-500">
              Anywhere. Anytime.
            </span>
          </h1>

          <p className="text-gray-400 text-lg mb-10 max-w-xl">
            Discover premium cars, bikes and SUVs from trusted
            owners. Book instantly with a seamless experience.
          </p>

          {/* Search Card */}
          <div className="bg-[#0B1020] border border-white/10 rounded-3xl p-5">

            <div className="grid md:grid-cols-4 gap-4">

              <div className="relative">
                <MapPin className="absolute left-3 top-4 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Location"
                  className="w-full bg-[#050816] rounded-xl pl-10 py-3 outline-none border border-white/10"
                />
              </div>

              <div className="relative">
                <Calendar className="absolute left-3 top-4 w-5 h-5 text-gray-400" />
                <input
                  type="date"
                  className="w-full bg-[#050816] rounded-xl pl-10 py-3 outline-none border border-white/10"
                />
              </div>

              <div className="relative">
                <Calendar className="absolute left-3 top-4 w-5 h-5 text-gray-400" />
                <input
                  type="date"
                  className="w-full bg-[#050816] rounded-xl pl-10 py-3 outline-none border border-white/10"
                />
              </div>

              <button className="bg-blue-600 hover:bg-blue-500 rounded-xl font-semibold flex items-center justify-center gap-2">
                <Search size={18} />
                Search
              </button>

            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-10 mt-10">
            <div>
              <h3 className="text-3xl font-bold">10K+</h3>
              <p className="text-gray-400">Bookings</p>
            </div>

            <div>
              <h3 className="text-3xl font-bold">4.9★</h3>
              <p className="text-gray-400">Rating</p>
            </div>

            <div>
              <h3 className="text-3xl font-bold">500+</h3>
              <p className="text-gray-400">Vehicle Owners</p>
            </div>
          </div>
        </div>

        {/* Right Side */}
        <div className="flex justify-center">
          <img
            src="https://images.unsplash.com/photo-1503376780353-7e6692767b70"
            alt="Luxury Car"
            className="rounded-3xl shadow-2xl"
          />
        </div>

      </div>
    </section>
  );
}