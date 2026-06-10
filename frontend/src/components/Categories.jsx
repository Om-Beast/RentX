import { Car, Bike, Truck, Zap, Crown } from "lucide-react";

const categories = [
  {
    name: "Scooters",
    icon: <Bike size={40} />,
    count: "120+ Vehicles",
  },
  {
    name: "Bikes",
    icon: <Bike size={40} />,
    count: "250+ Vehicles",
  },
  {
    name: "Cars",
    icon: <Car size={40} />,
    count: "500+ Vehicles",
  },
  {
    name: "SUVs",
    icon: <Truck size={40} />,
    count: "180+ Vehicles",
  },
  {
    name: "EVs",
    icon: <Zap size={40} />,
    count: "90+ Vehicles",
  },
  {
    name: "Luxury",
    icon: <Crown size={40} />,
    count: "60+ Vehicles",
  },
];

export default function Categories() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="text-4xl font-bold text-center text-gray-900 mb-4">
          Browse By Category
        </h2>

        <p className="text-center text-gray-500 mb-12">
          Find the perfect vehicle for every journey
        </p>

        <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-6">
          {categories.map((item, index) => (
            <div
              key={index}
              className="bg-white border rounded-2xl p-6 text-center shadow-md hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 cursor-pointer"
            >
              <div className="flex justify-center text-blue-600 mb-4">
                {item.icon}
              </div>

              <h3 className="font-bold text-lg">{item.name}</h3>

              <p className="text-gray-500 text-sm mt-2">
                {item.count}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}