// Remove the fabricated testimonials. This component is intentionally minimal.
export default function HowItWorks() {
  const steps = [
    { step: "01", title: "Search & Filter", desc: "Find vehicles by city, type, price and dates. Advanced filters help narrow down exactly what you need." },
    { step: "02", title: "Reserve & Pay", desc: "Select your dates. Your booking is held while you complete secure payment via Razorpay." },
    { step: "03", title: "Pick Up & Drive", desc: "Owner confirms your booking. Collect the vehicle and start your journey." },
    { step: "04", title: "Return & Review", desc: "Return the vehicle, get your deposit back, and leave an honest review." },
  ];

  return (
    <section className="py-20 bg-slate-900">
      <div className="max-w-5xl mx-auto px-6">
        <h2 className="text-3xl font-bold text-white text-center mb-3">How RentX Works</h2>
        <p className="text-slate-400 text-center mb-14 max-w-xl mx-auto">Simple, secure, transparent — from search to return.</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((s) => (
            <div key={s.step} className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center mx-auto mb-4">
                <span className="text-indigo-400 font-bold text-sm">{s.step}</span>
              </div>
              <h3 className="text-white font-semibold mb-2">{s.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}