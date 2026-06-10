export default function FeaturedVehicles() {
  const vehicles = [
    {
      name: "Porsche Taycan",
      price: "₹8,999/day",
      image:
        "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200",
    },
    {
      name: "BMW M4",
      price: "₹6,499/day",
      image:
        "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1200",
    },
    {
      name: "Mercedes AMG",
      price: "₹7,999/day",
      image:
        "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1200",
    },
  ];

  return (
    <section className="bg-[#050816] text-white py-24">
      <div className="max-w-7xl mx-auto px-6">

        <h2 className="text-5xl font-bold mb-4">
          Featured Vehicles
        </h2>

        <p className="text-gray-400 mb-12">
          Luxury vehicles available for instant booking
        </p>

        <div className="grid md:grid-cols-3 gap-8">

          {vehicles.map((vehicle) => (
            <div
              key={vehicle.name}
              className="bg-[#0B1020] rounded-3xl overflow-hidden border border-white/10 hover:border-blue-500 hover:-translate-y-2 transition-all duration-300"
            >
              <img
                src={vehicle.image}
                alt={vehicle.name}
                className="h-64 w-full object-cover"
              />

              <div className="p-6">
                <h3 className="text-2xl font-bold">
                  {vehicle.name}
                </h3>

                <p className="text-blue-400 mt-2">
                  {vehicle.price}
                </p>

                <button className="mt-5 w-full bg-blue-600 hover:bg-blue-500 py-3 rounded-xl font-semibold">
                  Rent Now
                </button>
              </div>
            </div>
          ))}

        </div>
      </div>
    </section>
  );
}