import { Link } from "react-router-dom";

const TYPE_COLORS = {
  car: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  bike: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  scooter: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  suv: "bg-green-500/10 text-green-400 border-green-500/20",
  sedan: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  hatchback: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  luxury: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  ev: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  other: "bg-slate-500/10 text-slate-400 border-slate-500/20",
};

function StarRating({ rating, count }) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {[1, 2, 3, 4, 5].map((i) => (
          <svg
            key={i}
            className={`w-3.5 h-3.5 ${i <= full ? "text-amber-400" : i === full + 1 && half ? "text-amber-400/60" : "text-slate-600"}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
      {count > 0 && <span className="text-xs text-slate-500">({count})</span>}
    </div>
  );
}

export default function VehicleCard({ vehicle }) {
  const {
    _id, name, brand, model, year, type, pricePerDay, city,
    transmission, fuelType, seats, images, rating = 0, reviewCount = 0,
    isAvailable = true,
  } = vehicle;

  const imageUrl = images?.[0] || null;
  const typeColor = TYPE_COLORS[type?.toLowerCase()] || TYPE_COLORS.other;

  return (
    <div className="group rounded-2xl bg-slate-800 border border-slate-700 hover:border-slate-600 overflow-hidden transition-all hover:shadow-xl hover:shadow-black/20 hover:-translate-y-0.5">
      {/* Image */}
      <div className="relative h-48 bg-slate-700 overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={`${brand} ${name}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => { e.target.onerror = null; e.target.src = "/placeholder-car.png"; }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl opacity-30">
            🚗
          </div>
        )}

        {/* Type badge */}
        <div className={`absolute top-3 left-3 px-2 py-0.5 rounded-full text-xs font-semibold border capitalize ${typeColor}`}>
          {type}
        </div>

        {/* Availability */}
        {!isAvailable && (
          <div className="absolute inset-0 bg-slate-900/70 flex items-center justify-center">
            <span className="px-3 py-1 bg-red-500/90 text-white text-xs font-semibold rounded-full">
              Unavailable
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Name + Year */}
        <div>
          <h3 className="font-semibold text-white text-sm leading-tight truncate">
            {brand} {name}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">{model} · {year}</p>
        </div>

        {/* Location */}
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="truncate">{city}</span>
        </div>

        {/* Specs */}
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {seats} seats
          </span>
          <span className="capitalize">{transmission}</span>
          <span className="capitalize">{fuelType}</span>
        </div>

        {/* Rating */}
        <StarRating rating={rating} count={reviewCount} />

        {/* Price + CTA */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-700">
          <div>
            <span className="text-lg font-bold text-white">₹{pricePerDay?.toLocaleString()}</span>
            <span className="text-xs text-slate-500"> / day</span>
          </div>
          <Link
            to={`/vehicle/${_id}`}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              isAvailable
                ? "bg-indigo-600 hover:bg-indigo-500 text-white"
                : "bg-slate-700 text-slate-500 cursor-not-allowed pointer-events-none"
            }`}
          >
            View Details →
          </Link>
        </div>
      </div>
    </div>
  );
}