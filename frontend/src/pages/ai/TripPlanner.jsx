import React, { useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, MapPin, Calendar, IndianRupee, Users, 
  Compass, Car, Loader2, CheckCircle2, XCircle, 
  Map, Lightbulb, Fuel
} from 'lucide-react';
const TripPlanner = () => {
  const [formData, setFormData] = useState({
    source: '',
    destination: '',
    days: '',
    budget: '',
    passengers: '',
    purpose: 'Leisure'
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await axios.post('http://localhost:5000/api/ai/trip-planner', {
        ...formData,
        days: Number(formData.days),
        budget: Number(formData.budget),
        passengers: Number(formData.passengers)
      });
      
      // Handle wrapped `{ success: true, data: {} }` or direct response
      setResult(response.data.data || response.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to generate trip plan.');
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen bg-[#F7F7F9] text-gray-900 font-sans pb-24">
      {/* HERO SECTION */}
      <div className="relative pt-20 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-gray-200 shadow-sm mb-6"
        >
          <Sparkles className="w-4 h-4 text-purple-500" />
          <span className="text-sm font-medium tracking-tight">RentX AI Trip Planner</span>
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-5xl md:text-6xl font-semibold tracking-tight text-gray-900 mb-6"
        >
          Plan your perfect road trip
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-lg text-gray-500 max-w-2xl mx-auto"
        >
          Tell us where you want to go, and our AI will recommend the ideal vehicle, estimate your costs, and generate a day-by-day itinerary.
        </motion.p>
      </div>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* FORM SECTION */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-4"
          >
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 sticky top-8">
              <form onSubmit={handleGenerate} className="space-y-5">
                <div className="space-y-4">
                  {/* Origin */}
                  <div className="relative">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Source</label>
                    <div className="relative flex items-center">
                      <MapPin className="absolute left-3 w-5 h-5 text-gray-400" />
                      <input 
                        type="text" name="source" required value={formData.source} onChange={handleInputChange}
                        placeholder="e.g., Mumbai"
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
                      />
                    </div>
                  </div>
                  {/* Destination */}
                  <div className="relative">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Destination</label>
                    <div className="relative flex items-center">
                      <Map className="absolute left-3 w-5 h-5 text-gray-400" />
                      <input 
                        type="text" name="destination" required value={formData.destination} onChange={handleInputChange}
                        placeholder="e.g., Goa"
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
                      />
                    </div>
                  </div>
                  {/* Grid for Numbers */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Days</label>
                      <div className="relative flex items-center">
                        <Calendar className="absolute left-3 w-5 h-5 text-gray-400" />
                        <input 
                          type="number" name="days" min="1" required value={formData.days} onChange={handleInputChange}
                          placeholder="5"
                          className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Budget</label>
                      <div className="relative flex items-center">
                        <IndianRupee className="absolute left-3 w-5 h-5 text-gray-400" />
                        <input 
                          type="number" name="budget" min="1000" required value={formData.budget} onChange={handleInputChange}
                          placeholder="25000"
                          className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
                        />
                      </div>
                    </div>
                  </div>
                  {/* Grid for People & Purpose */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">People</label>
                      <div className="relative flex items-center">
                        <Users className="absolute left-3 w-5 h-5 text-gray-400" />
                        <input 
                          type="number" name="passengers" min="1" required value={formData.passengers} onChange={handleInputChange}
                          placeholder="4"
                          className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Purpose</label>
                      <div className="relative flex items-center">
                        <Compass className="absolute left-3 w-5 h-5 text-gray-400" />
                        <select 
                          name="purpose" required value={formData.purpose} onChange={handleInputChange}
                          className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all appearance-none"
                        >
                          <option value="Leisure">Leisure</option>
                          <option value="Business">Business</option>
                          <option value="Adventure">Adventure</option>
                          <option value="Family">Family</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full mt-6 bg-black hover:bg-gray-900 text-white py-3.5 rounded-xl font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Generating Plan...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      <span>Generate Trip</span>
                    </>
                  )}
                </button>
              </form>
              <AnimatePresence>
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 p-4 bg-red-50 text-red-600 rounded-xl text-sm flex items-start gap-2"
                  >
                    <XCircle className="w-5 h-5 shrink-0" />
                    <p>{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
          {/* RESULTS SECTION */}
          <div className="lg:col-span-8">
            <AnimatePresence mode="wait">
              {loading && (
                <motion.div 
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center h-full min-h-[400px] text-gray-400 space-y-4"
                >
                  <Loader2 className="w-10 h-10 animate-spin text-gray-300" />
                  <p className="text-sm font-medium tracking-wide">Crafting your itinerary with AI...</p>
                </motion.div>
              )}
              {!loading && !result && !error && (
                <motion.div 
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center h-full min-h-[400px] text-gray-400 bg-white/50 border border-dashed border-gray-200 rounded-3xl"
                >
                  <Map className="w-12 h-12 text-gray-300 mb-4" />
                  <p className="text-gray-500">Your tailored trip plan will appear here.</p>
                </motion.div>
              )}
              {!loading && result && (
                <motion.div 
                  key="result"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  {/* Vehicle & Cost Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Vehicle Card */}
                    <div className="bg-white p-6 md:p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex flex-col h-full">
                      <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-4 text-blue-600">
                        <Car className="w-6 h-6" />
                      </div>
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Recommended Vehicle</h3>
                      <h4 className="text-2xl font-semibold text-gray-900 mb-3">{result.recommendedVehicle?.vehicleName || 'Standard SUV'}</h4>
                      <p className="text-gray-600 text-sm leading-relaxed flex-grow">
                        {result.recommendedVehicle?.reason || 'Based on your requirements, this vehicle offers the best balance of comfort and efficiency.'}
                      </p>
                    </div>
                    {/* Cost Analysis Card */}
                    <div className="bg-white p-6 md:p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex flex-col h-full">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${result.costAnalysis?.withinBudget ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                        {result.costAnalysis?.withinBudget ? <CheckCircle2 className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
                      </div>
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Cost Breakdown</h3>
                      <div className="mt-3 space-y-3 flex-grow">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-500 flex items-center gap-1.5"><Car className="w-4 h-4"/> Rental</span>
                          <span className="font-medium text-gray-900">₹{result.costAnalysis?.estimatedRentalCost?.toLocaleString() || 0}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-500 flex items-center gap-1.5"><Fuel className="w-4 h-4"/> Fuel Estimate</span>
                          <span className="font-medium text-gray-900">₹{result.costAnalysis?.estimatedFuelCost?.toLocaleString() || 0}</span>
                        </div>
                        <div className="pt-3 border-t border-gray-100 flex justify-between items-center">
                          <span className="font-semibold text-gray-900">Total</span>
                          <span className="text-xl font-bold text-gray-900">₹{result.costAnalysis?.totalEstimatedCost?.toLocaleString() || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Itinerary Timeline */}
                  <div className="bg-white p-6 md:p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
                    <h3 className="text-xl font-semibold text-gray-900 mb-6">Your Itinerary</h3>
                    <div className="space-y-8">
                      {result.tripPlan?.map((day, idx) => (
                        <div key={idx} className="relative pl-6 border-l-2 border-gray-100 last:border-transparent">
                          <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-black border-4 border-white shadow-sm" />
                          <div className="mb-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">Day {day.day}</div>
                          <h4 className="text-lg font-semibold text-gray-900 mb-3">{day.title}</h4>
                          <ul className="space-y-2">
                            {day.activities?.map((activity, actIdx) => (
                              <li key={actIdx} className="text-gray-600 text-sm flex items-start gap-2">
                                <span className="text-gray-300 mt-0.5">•</span>
                                <span className="leading-relaxed">{activity}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Travel Tips */}
                  {result.travelTips?.length > 0 && (
                    <div className="bg-gray-900 text-white p-6 md:p-8 rounded-3xl shadow-xl">
                      <div className="flex items-center gap-3 mb-4">
                        <Lightbulb className="w-6 h-6 text-yellow-400" />
                        <h3 className="text-lg font-semibold">Pro Tips for your journey</h3>
                      </div>
                      <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {result.travelTips.map((tip, idx) => (
                          <li key={idx} className="text-gray-300 text-sm bg-white/10 rounded-xl p-4">
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};
export default TripPlanner;