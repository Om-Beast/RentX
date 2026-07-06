import { Link } from "react-router-dom";
import { useParams } from "react-router-dom";

export default function BookingSuccess() {
  const { id } = useParams();


  return (
    <div className="min-h-screen bg-[#05060a] relative overflow-hidden">
      {/* Floating background glows */}
      <div className="pointer-events-none absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-emerald-500/20 rounded-full blur-[140px]" />
      <div className="pointer-events-none absolute top-[10%] right-[-15%] w-[450px] h-[450px] bg-indigo-600/20 rounded-full blur-[140px]" />
      <div className="pointer-events-none absolute bottom-[-15%] left-[25%] w-[400px] h-[400px] bg-purple-600/15 rounded-full blur-[140px]" />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        {/* HERO */}
        <div className="flex flex-col items-center text-center">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-emerald-400/30 blur-2xl animate-pulse" />
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-2xl shadow-emerald-500/40 animate-[bounce_1.4s_ease-in-out_1]">
              <svg
                className="w-10 h-10 sm:w-12 sm:h-12 text-white"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
          </div>

          <h1 className="mt-6 text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight">
            Booking Confirmed
          </h1>

          <p className="mt-3 text-slate-400 text-sm sm:text-base max-w-md">
            You're all set. Your reservation has been secured and a confirmation has been recorded against your account.
          </p>
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">

  <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-center">
    <p className="text-2xl">✅</p>
    <p className="text-xs text-emerald-300 mt-1">
      Payment Verified
    </p>
  </div>

  <div className="rounded-xl bg-blue-500/10 border border-blue-500/20 p-3 text-center">
    <p className="text-2xl">🚗</p>
    <p className="text-xs text-blue-300 mt-1">
      Vehicle Reserved
    </p>
  </div>

  <div className="rounded-xl bg-purple-500/10 border border-purple-500/20 p-3 text-center">
    <p className="text-2xl">📧</p>
    <p className="text-xs text-purple-300 mt-1">
      Confirmation Sent
    </p>
  </div>

  <div className="rounded-xl bg-cyan-500/10 border border-cyan-500/20 p-3 text-center">
    <p className="text-2xl">🤖</p>
    <p className="text-xs text-cyan-300 mt-1">
      AI Checked
    </p>
  </div>

</div>
        </div>

        {/* SECTION 1 - BOOKING SUMMARY */}
        <div className="mt-10 sm:mt-14 rounded-3xl p-[1px] bg-gradient-to-br from-indigo-500/40 via-white/10 to-purple-500/40 shadow-2xl shadow-black/40 animate-[fadeUp_0.6s_ease-out]">
          <div className="bg-white/5 backdrop-blur-2xl rounded-[calc(1.5rem-1px)] p-5 sm:p-7 lg:p-8">
            <h2 className="text-lg sm:text-xl font-semibold text-white tracking-tight mb-5 sm:mb-6">
              Booking Summary
            </h2>

            <div className="grid sm:grid-cols-2 gap-x-8 gap-y-4 text-sm sm:text-base">
              <div className="flex justify-between sm:justify-start sm:gap-3 border-b border-white/5 pb-3 sm:border-none sm:pb-0">
                <span className="text-slate-500">Vehicle</span>
                <span className="text-slate-300 sm:ml-auto">Not available</span>
              </div>

              <div className="flex justify-between sm:justify-start sm:gap-3 border-b border-white/5 pb-3 sm:border-none sm:pb-0">
                <span className="text-slate-500">Booking ID</span>
                <span className="text-white font-medium sm:ml-auto">{id || "N/A"}</span>
              </div>

              <div className="flex justify-between sm:justify-start sm:gap-3 border-b border-white/5 pb-3 sm:border-none sm:pb-0">
                <span className="text-slate-500">Pickup Date</span>
                <span className="text-slate-300 sm:ml-auto">Not available</span>
              </div>

              <div className="flex justify-between sm:justify-start sm:gap-3 border-b border-white/5 pb-3 sm:border-none sm:pb-0">
                <span className="text-slate-500">Return Date</span>
                <span className="text-slate-300 sm:ml-auto">Not available</span>
              </div>

              <div className="flex justify-between sm:justify-start sm:gap-3 border-b border-white/5 pb-3 sm:border-none sm:pb-0">
                <span className="text-slate-500">Rental Days</span>
                <span className="text-slate-300 sm:ml-auto">Not available</span>
              </div>

              <div className="flex justify-between sm:justify-start sm:gap-3 border-b border-white/5 pb-3 sm:border-none sm:pb-0">
                <span className="text-slate-500">Amount Paid</span>
                <span className="text-slate-300 sm:ml-auto">Not available</span>
              </div>

              <div className="flex justify-between sm:justify-start sm:gap-3 pb-3 sm:pb-0">
                <span className="text-slate-500">Payment Status</span>
                <span className="text-slate-300 sm:ml-auto">Not available</span>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2 - AI TRUST ASSESSMENT */}
        <div className="mt-6 sm:mt-8 rounded-3xl p-[1px] bg-gradient-to-br from-cyan-500/30 via-white/10 to-indigo-500/30 shadow-2xl shadow-black/40 animate-[fadeUp_0.7s_ease-out]">
          <div className="bg-white/5 backdrop-blur-2xl rounded-[calc(1.5rem-1px)] p-5 sm:p-7 lg:p-8">
            <h2 className="text-lg sm:text-xl font-semibold text-white tracking-tight mb-2 flex items-center gap-2">
              <span>🤖</span> AI Trust Assessment
            </h2>

            <div className="mt-4 flex flex-col items-center text-center py-8 sm:py-10 rounded-2xl border border-dashed border-white/10 bg-white/[0.02]">
              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-slate-500 mb-3">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 8v5M12 16h.01" />
                </svg>
              </div>
              <p className="text-slate-400 text-sm sm:text-base">
                AI assessment unavailable for this booking.
              </p>
            </div>
          </div>
        </div>

        {/* SECTION 3 - PAYMENT SUMMARY */}
        <div className="mt-6 sm:mt-8 rounded-3xl p-[1px] bg-gradient-to-br from-indigo-500/40 via-white/10 to-purple-500/40 shadow-2xl shadow-black/40 animate-[fadeUp_0.8s_ease-out]">
          <div className="bg-white/5 backdrop-blur-2xl rounded-[calc(1.5rem-1px)] p-5 sm:p-7 lg:p-8">
            <h2 className="text-lg sm:text-xl font-semibold text-white tracking-tight mb-5 sm:mb-6">
              Payment Summary
            </h2>

            <div className="space-y-2.5 text-sm sm:text-base text-slate-300">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="text-slate-400">Not available</span>
              </div>
              <div className="flex justify-between">
                <span>GST</span>
                <span className="text-slate-400">Not available</span>
              </div>
              <div className="flex justify-between">
                <span>Platform Fee</span>
                <span className="text-slate-400">Not available</span>
              </div>
              <div className="flex justify-between">
                <span>Security Deposit</span>
                <span className="text-slate-400">Not available</span>
              </div>

              <div className="border-t border-white/10 my-3" />

              <div className="flex justify-between text-lg sm:text-xl font-bold">
                <span className="text-white">Grand Total</span>
                <span className="text-slate-400 text-base sm:text-lg font-medium">Not available</span>
              </div>

              <div className="flex justify-between pt-2">
                <span>Payment Method</span>
                <span className="text-slate-400">Not available</span>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 4 - WHY RENTX */}
        <div className="mt-10 sm:mt-14 animate-[fadeUp_0.9s_ease-out]">
          <h2 className="text-lg sm:text-xl font-semibold text-white tracking-tight mb-5 sm:mb-6 text-center">
            Why RentX?
          </h2>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="group bg-white/5 backdrop-blur-xl p-4 sm:p-5 rounded-2xl border border-white/10 text-center hover:border-indigo-400/30 hover:-translate-y-1 transition-all duration-300">
              <div className="w-10 h-10 mx-auto rounded-xl bg-indigo-500/15 flex items-center justify-center text-indigo-300 mb-3">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <p className="text-white text-xs sm:text-sm font-medium">Secure Payments</p>
            </div>

            <div className="group bg-white/5 backdrop-blur-xl p-4 sm:p-5 rounded-2xl border border-white/10 text-center hover:border-indigo-400/30 hover:-translate-y-1 transition-all duration-300">
              <div className="w-10 h-10 mx-auto rounded-xl bg-cyan-500/15 flex items-center justify-center text-cyan-300 mb-3">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" />
                </svg>
              </div>
              <p className="text-white text-xs sm:text-sm font-medium">AI Risk Detection</p>
            </div>

            <div className="group bg-white/5 backdrop-blur-xl p-4 sm:p-5 rounded-2xl border border-white/10 text-center hover:border-indigo-400/30 hover:-translate-y-1 transition-all duration-300">
              <div className="w-10 h-10 mx-auto rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-300 mb-3">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>
              <p className="text-white text-xs sm:text-sm font-medium">Verified Owners</p>
            </div>

            <div className="group bg-white/5 backdrop-blur-xl p-4 sm:p-5 rounded-2xl border border-white/10 text-center hover:border-indigo-400/30 hover:-translate-y-1 transition-all duration-300">
              <div className="w-10 h-10 mx-auto rounded-xl bg-purple-500/15 flex items-center justify-center text-purple-300 mb-3">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 8v4l3 3" />
                  <circle cx="12" cy="12" r="9" />
                </svg>
              </div>
              <p className="text-white text-xs sm:text-sm font-medium">24×7 Support</p>
            </div>
          </div>
        </div>

        {/* BOTTOM ACTIONS */}
        <div className="mt-10 sm:mt-14 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
          <button
        disabled
        className="cursor-not-allowed px-6 py-3.5 rounded-xl font-semibold text-sm sm:text-base bg-white/5 border border-white/10 text-slate-500"
      >
        Download Invoice (Coming Soon)
      </button>

          <Link
            to="/my-bookings"
            className="text-center px-6 py-3.5 rounded-xl font-semibold text-sm sm:text-base bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/50 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300"
          >
            View My Bookings
          </Link>

          <Link
            to="/"
            className="text-center px-6 py-3.5 rounded-xl font-semibold text-sm sm:text-base bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:border-white/20 hover:-translate-y-0.5 transition-all duration-300"
          >
            Back to Home
          </Link>
        </div>
      </div>

      <style>{`
        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
