import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bus, MapPin, Calendar, ArrowRightLeft, Search, ShieldCheck, Sparkles, CheckCircle2, Award, Zap } from 'lucide-react';
import { routesApi } from '../services/api';

export default function Home() {
  const navigate = useNavigate();
  const [cities, setCities] = useState(['Bangalore', 'Hyderabad', 'Mumbai', 'Pune', 'Chennai']);
  const [source, setSource] = useState('Bangalore');
  const [destination, setDestination] = useState('Hyderabad');

  // Default date: today's date in YYYY-MM-DD
  const todayStr = new Date().toISOString().split('T')[0];
  const [travelDate, setTravelDate] = useState(todayStr);

  useEffect(() => {
    routesApi.getCities()
      .then(res => {
        if (res.success && res.data.length > 0) {
          setCities(res.data);
        }
      })
      .catch(() => {});
  }, []);

  const handleSwap = () => {
    const temp = source;
    setSource(destination);
    setDestination(temp);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (!source || !destination) return;
    navigate(`/search?source=${encodeURIComponent(source)}&destination=${encodeURIComponent(destination)}&date=${travelDate}`);
  };

  const handleQuickRoute = (src, dest) => {
    setSource(src);
    setDestination(dest);
    navigate(`/search?source=${encodeURIComponent(src)}&destination=${encodeURIComponent(dest)}&date=${travelDate}`);
  };

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-900 via-indigo-900 to-slate-900 text-white pt-16 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e40af15_1px,transparent_1px),linear-gradient(to_bottom,#1e40af15_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>

        <div className="relative max-w-5xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>Algions Advanced Bus Booking Platform</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
            Seamless Intercity Travel <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-sky-300 to-teal-300">
              Guaranteed Seat Integrity
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-300">
            Book AC Sleeper & Luxury Express coaches with zero double-booking conflicts, instant PNR generation, live seat maps, and automated cancellation refunds.
          </p>

          {/* Search Box Card */}
          <div className="max-w-4xl mx-auto mt-8 bg-white text-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100">
            <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              {/* Origin */}
              <div className="md:col-span-4 text-left">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-blue-600" /> From City
                </label>
                <div className="relative">
                  <select
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
                    required
                  >
                    {cities.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Swap Button */}
              <div className="md:col-span-1 flex justify-center -my-2 md:my-0">
                <button
                  type="button"
                  onClick={handleSwap}
                  title="Swap Origin and Destination"
                  className="w-10 h-10 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-600 flex items-center justify-center transition shadow-xs border border-blue-200"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                </button>
              </div>

              {/* Destination */}
              <div className="md:col-span-4 text-left">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-indigo-600" /> To City
                </label>
                <div className="relative">
                  <select
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
                    required
                  >
                    {cities.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Travel Date */}
              <div className="md:col-span-3 text-left">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-blue-600" /> Date of Travel
                </label>
                <input
                  type="date"
                  value={travelDate}
                  min={todayStr}
                  onChange={(e) => setTravelDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
                  required
                />
              </div>

              {/* Search Submit */}
              <div className="md:col-span-12 mt-2">
                <button
                  type="submit"
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-base rounded-2xl shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 transition transform active:scale-99"
                >
                  <Search className="w-5 h-5" />
                  Search Available Buses
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Popular Corridors */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Top Travel Corridors</h2>
            <p className="text-sm text-slate-500">Instant departure schedules with verified seat availability</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div
            onClick={() => handleQuickRoute('Bangalore', 'Hyderabad')}
            className="group cursor-pointer bg-white p-6 rounded-3xl border border-slate-200 hover:border-blue-500 hover:shadow-xl transition duration-300"
          >
            <div className="flex justify-between items-start mb-4">
              <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full">Express Corridor</span>
              <span className="text-sm font-bold text-slate-400">9 hrs</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition">Bangalore → Hyderabad</h3>
            <p className="text-xs text-slate-500 mt-1">Kempegowda / Majestic to Ameerpet & Gachibowli</p>
            <div className="mt-6 flex justify-between items-center text-xs font-semibold">
              <span className="text-slate-500">Starting from ₹1,250</span>
              <span className="text-blue-600 flex items-center gap-1 group-hover:translate-x-1 transition">
                Book Seats →
              </span>
            </div>
          </div>

          <div
            onClick={() => handleQuickRoute('Mumbai', 'Pune')}
            className="group cursor-pointer bg-white p-6 rounded-3xl border border-slate-200 hover:border-blue-500 hover:shadow-xl transition duration-300"
          >
            <div className="flex justify-between items-start mb-4">
              <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full">Superfast Highway</span>
              <span className="text-sm font-bold text-slate-400">3 hrs</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition">Mumbai → Pune</h3>
            <p className="text-xs text-slate-500 mt-1">Dadar TT Circle to Wakad & Swargate Terminal</p>
            <div className="mt-6 flex justify-between items-center text-xs font-semibold">
              <span className="text-slate-500">Starting from ₹450</span>
              <span className="text-blue-600 flex items-center gap-1 group-hover:translate-x-1 transition">
                Book Seats →
              </span>
            </div>
          </div>

          <div
            onClick={() => handleQuickRoute('Bangalore', 'Chennai')}
            className="group cursor-pointer bg-white p-6 rounded-3xl border border-slate-200 hover:border-blue-500 hover:shadow-xl transition duration-300"
          >
            <div className="flex justify-between items-start mb-4">
              <span className="px-3 py-1 bg-purple-50 text-purple-700 text-xs font-bold rounded-full">Intercity Cruiser</span>
              <span className="text-sm font-bold text-slate-400">6 hrs</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition">Bangalore → Chennai</h3>
            <p className="text-xs text-slate-500 mt-1">Electronic City & Silk Board to Koyambedu</p>
            <div className="mt-6 flex justify-between items-center text-xs font-semibold">
              <span className="text-slate-500">Starting from ₹850</span>
              <span className="text-blue-600 flex items-center gap-1 group-hover:translate-x-1 transition">
                Book Seats →
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Architecture Highlights / Engineering Guarantees */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 shadow-xl">
          <div className="max-w-3xl mb-8">
            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Algions Enterprise Architecture</span>
            <h2 className="text-2xl sm:text-3xl font-black mt-2">Built for Absolute Transactional Integrity</h2>
            <p className="text-slate-400 text-sm mt-2">
              Our system guarantees zero double-bookings, auditable manifests, server-side RBAC, and policy-driven cancellations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center mb-4">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-base mb-1">Pessimistic Concurrency Lock</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Atomic transactions with PostgreSQL <code className="text-blue-300">FOR UPDATE</code> row locking prevent simultaneous booking conflicts.
              </p>
            </div>

            <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4">
                <Zap className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-base mb-1">Dynamic Cancellation Refunds</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Automated multi-tier refund rules calculation releasing seats instantly back into live inventory upon cancellation.
              </p>
            </div>

            <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center mb-4">
                <Award className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-base mb-1">Reconciled Manifests</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Live passenger manifests that reconcile 100% with confirmed tickets and capacity utilization analytics for staff.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

