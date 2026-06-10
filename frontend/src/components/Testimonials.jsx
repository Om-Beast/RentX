import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Priya Sharma",
    city: "Mumbai",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face",
    rating: 5,
    quote:
      "Rented a Creta for our Goa trip. The booking process was seamless and the car was spotless. RentX is leagues ahead of Zoomcar!",
  },
  {
    name: "Arjun Patel",
    city: "Bangalore",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face",
    rating: 5,
    quote:
      "I use RentX every weekend for my Royal Enfield rides. Best prices and the bikes are always well-maintained.",
  },
  {
    name: "Sneha Reddy",
    city: "Hyderabad",
    avatar:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face",
    rating: 4,
    quote:
      "Booked an Ather 450X for my daily commute while my car was in service. Delivered right to my doorstep!",
  },
  {
    name: "Rahul Verma",
    city: "Delhi",
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face",
    rating: 5,
    quote:
      "Used RentX for a BMW 3 Series for my anniversary. The luxury experience was unmatched. Highly recommended!",
  },
];

function StarRating({ rating }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          size={16}
          className={
            i < rating
              ? "fill-yellow-400 text-yellow-400"
              : "fill-gray-300 text-gray-300"
          }
        />
      ))}
    </div>
  );
}

export default function Testimonials() {
  return (
    <section className="bg-white py-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-14">
          <span className="bg-blue-100 text-blue-600 px-4 py-2 rounded-full text-sm font-semibold">
            Testimonials
          </span>

          <h2 className="text-4xl font-bold mt-5 text-gray-900">
            Loved by Thousands
          </h2>

          <p className="text-gray-500 mt-3">
            See why customers across India trust RentX
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {testimonials.map((item, index) => (
            <motion.div
              key={index}
              whileHover={{ y: -8 }}
              className="bg-white rounded-2xl shadow-lg p-6 border"
            >
              <Quote className="text-blue-500 mb-4" />

              <p className="text-gray-600 text-sm leading-relaxed mb-6">
                "{item.quote}"
              </p>

              <div className="flex items-center gap-3">
                <img
                  src={item.avatar}
                  alt={item.name}
                  className="w-12 h-12 rounded-full object-cover"
                />

                <div>
                  <h4 className="font-bold text-gray-900">
                    {item.name}
                  </h4>

                  <p className="text-xs text-gray-500">
                    {item.city}
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <StarRating rating={item.rating} />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}