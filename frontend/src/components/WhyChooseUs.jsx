import { ShieldCheck, Clock3, Car } from "lucide-react";

export default function WhyChooseUs() {
  const features = [
    {
      icon: <Car size={40} />,
      title: "Premium Fleet",
      desc: "Luxury cars, SUVs and bikes from verified owners.",
    },
    {
      icon: <ShieldCheck size={40} />,
      title: "Secure Booking",
      desc: "Safe payments and verified vehicle listings.",
    },
    {
      icon: <Clock3 size={40} />,
      title: "Instant Access",
      desc: "Book your vehicle in minutes, not hours.",
    },
  ];

  return (
    <section className="bg-[#050816] text-white py-24">
      <div className="max-w-7xl mx-auto px-6">

        <h2 className="text-5xl font-bold text-center mb-4">
          Why Choose RentX
        </h2>

        <p className="text-gray-400 text-center mb-16">
          Built for convenience, trust and premium experiences.
        </p>

        <div className="grid md:grid-cols-3 gap-8">

          {features.map((item) => (
            <div
              key={item.title}
              className="bg-[#0B1020] border border-white/10 rounded-3xl p-8 hover:border-blue-500 transition-all"
            >
              <div className="text-blue-400 mb-5">
                {item.icon}
              </div>

              <h3 className="text-2xl font-bold mb-3">
                {item.title}
              </h3>

              <p className="text-gray-400">
                {item.desc}
              </p>
            </div>
          ))}

        </div>
      </div>
    </section>
  );
}