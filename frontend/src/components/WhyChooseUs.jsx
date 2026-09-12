import { ShieldCheck, Zap, RefreshCw, Star } from "lucide-react";

export default function WhyChooseUs() {
  const features = [
    { icon: ShieldCheck, title: "Verified Listings", desc: "Every vehicle listing is owner-verified. Booking creates a legal rental agreement between renter and owner." },
    { icon: Zap, title: "Instant Reservation Hold", desc: "When you pay, your dates are held atomically — no double bookings, no race conditions." },
    { icon: Star, title: "Trust-Based Access", desc: "Our trust engine scores every account. Higher trust unlocks better vehicles and faster approval." },
    { icon: RefreshCw, title: "Fair Cancellation Policy", desc: "Clear tier-based refund policy. Cancel 48h+ before pickup for a full refund." },
  ];

  return (
    <section className="py-20 bg-slate-950">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-3xl font-bold text-white text-center mb-3">Why RentX</h2>
        <p className="text-slate-400 text-center mb-14">Built for India's peer-to-peer vehicle rental market.</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-indigo-500/30 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/15 flex items-center justify-center mb-4">
                <Icon className="w-5 h-5 text-indigo-400" />
              </div>
              <h3 className="text-white font-semibold mb-2">{title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}