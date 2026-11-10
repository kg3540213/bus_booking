import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bus, MapPin, Calendar, ArrowRightLeft, Search, ShieldCheck,
  CheckCircle2, Award, Zap, Tag, Clock, ChevronRight, Star,
  Shield, Users, RefreshCw, Copy, Check
} from 'lucide-react';
import { routesApi } from '../services/api';

export default function Home() {
  const navigate = useNavigate();
  const [cities, setCities] = useState(['Bangalore', 'Hyderabad', 'Mumbai', 'Pune', 'Chennai']);
  const [source, setSource] = useState('Bangalore');
  const [destination, setDestination] = useState('Hyderabad');

  // Dates
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const [travelDate, setTravelDate] = useState(todayStr);
  const [copiedCode, setCopiedCode] = useState(null);

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

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="space-y-16 pb-20">
      {/* Hero Section */}
      <section className="relative bg-slate-900 text-white pt-12 pb-24 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header tagline */}
          <div className="text-center space-y-3 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-500"></span>
              <span>Next-Generation Intercity Transit Network</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
              India's Most Reliable <br className="hidden sm:inline" />
              <span className="text-brand-500">Bus Booking & Transit Engine</span>
            </h1>

            <p className="text-sm sm:text-base text-slate-400 font-normal max-w-2xl mx-auto">
              Direct operator inventory, guaranteed ACID seat locking, instant cancellation refunds, and digital passenger manifests.
            </p>
          </div>

          {/* Search Box Console */}
          <div className="bg-white text-slate-900 rounded-2xl p-4 sm:p-6 shadow-xl border border-slate-200/80">
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
                {/* Source City */}
                <div className="lg:col-span-4 bg-slate-50 hover:bg-slate-100/80 p-3.5 rounded-xl border border-slate-200 transition">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <Bus className="w-3.5 h-3.5 text-brand-600" /> From / Boarding Point
                  </label>
                  <select
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    className="w-full bg-transparent text-sm font-bold text-slate-900 focus:outline-none cursor-pointer"
                    required
                  >
                    {cities.map((city) => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {['Bangalore', 'Mumbai', 'Pune'].map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setSource(c)}
                        className={`text-[10px] px-2 py-0.5 rounded font-medium transition ${
                          source === c
                            ? 'bg-brand-600 text-white'
                            : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Swap Button */}
                <div className="lg:col-span-1 flex justify-center -my-2 lg:my-0">
                  <button
                    type="button"
                    onClick={handleSwap}
                    title="Swap From and To"
                    className="w-10 h-10 rounded-full bg-white hover:bg-slate-100 text-slate-700 flex items-center justify-center transition shadow-sm border border-slate-200 hover:rotate-180 transform duration-300"
                  >
                    <ArrowRightLeft className="w-4 h-4 text-brand-600" />
                  </button>
                </div>

                {/* Destination City */}
                <div className="lg:col-span-4 bg-slate-50 hover:bg-slate-100/80 p-3.5 rounded-xl border border-slate-200 transition">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-700" /> To / Dropping Point
                  </label>
                  <select
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="w-full bg-transparent text-sm font-bold text-slate-900 focus:outline-none cursor-pointer"
                    required
                  >
                    {cities.map((city) => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {['Hyderabad', 'Chennai', 'Pune'].map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setDestination(c)}
                        className={`text-[10px] px-2 py-0.5 rounded font-medium transition ${
                          destination === c
                            ? 'bg-brand-600 text-white'
                            : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Date Picker */}
                <div className="lg:col-span-3 bg-slate-50 hover:bg-slate-100/80 p-3.5 rounded-xl border border-slate-200 transition">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-brand-600" /> Travel Date
                  </label>
                  <input
                    type="date"
                    value={travelDate}
                    min={todayStr}
                    onChange={(e) => setTravelDate(e.target.value)}
                    className="w-full bg-transparent text-sm font-bold text-slate-900 focus:outline-none font-mono cursor-pointer"
                    required
                  />
                  <div className="flex gap-1.5 mt-2">
                    <button
                      type="button"
                      onClick={() => setTravelDate(todayStr)}
                      className={`text-[10px] px-2.5 py-0.5 rounded font-semibold transition ${
                        travelDate === todayStr
                          ? 'bg-slate-900 text-white'
                          : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      Today
                    </button>
                    <button
                      type="button"
                      onClick={() => setTravelDate(tomorrowStr)}
                      className={`text-[10px] px-2.5 py-0.5 rounded font-semibold transition ${
                        travelDate === tomorrowStr
                          ? 'bg-slate-900 text-white'
                          : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      Tomorrow
                    </button>
                  </div>
                </div>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                className="w-full py-3.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm rounded-xl shadow-md shadow-brand-600/20 flex items-center justify-center gap-2 transition active:scale-[0.99]"
              >
                <Search className="w-4 h-4" />
                <span>Search Available Buses</span>
              </button>
            </form>
          </div>

          {/* Trust Highlights */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center pt-2">
            <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800">
              <div className="text-lg font-black text-white font-mono">10,000+</div>
              <div className="text-[11px] text-slate-400 font-medium">Daily Intercity Routes</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800">
              <div className="text-lg font-black text-emerald-400 font-mono">100%</div>
              <div className="text-[11px] text-slate-400 font-medium">ACID Seat Exclusivity</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800">
              <div className="text-lg font-black text-amber-400 font-mono">Instant</div>
              <div className="text-[11px] text-slate-400 font-medium">Automated Tiered Refund</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800">
              <div className="text-lg font-black text-white font-mono">₹0</div>
              <div className="text-[11px] text-slate-400 font-medium">Hidden Booking Fees</div>
            </div>
          </div>
        </div>
      </section>

      {/* Promotional Offers Grid */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <Tag className="w-5 h-5 text-brand-600" />
              <span>Available Promo Codes & Discounts</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Apply during checkout for immediate fare reductions</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Coupon 1 */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs relative overflow-hidden flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="px-2 py-0.5 bg-brand-50 text-brand-700 text-[10px] font-bold rounded uppercase tracking-wider border border-brand-200">
                  New Traveler
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyCode('NEXFIRST')}
                  className="flex items-center gap-1 text-[11px] font-mono font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded transition"
                >
                  {copiedCode === 'NEXFIRST' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-slate-500" />}
                  <span>NEXFIRST</span>
                </button>
              </div>
              <h3 className="text-base font-extrabold text-slate-900 mt-3">Flat ₹150 Off</h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Save ₹150 on your first bus reservation across all AC Sleeper and Seater routes.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-dashed border-slate-200 text-[11px] text-slate-400">
              No minimum booking value required
            </div>
          </div>

          {/* Coupon 2 */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs relative overflow-hidden flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded uppercase tracking-wider border border-blue-200">
                  Volvo Special
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyCode('SAVE10')}
                  className="flex items-center gap-1 text-[11px] font-mono font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded transition"
                >
                  {copiedCode === 'SAVE10' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-slate-500" />}
                  <span>SAVE10</span>
                </button>
              </div>
              <h3 className="text-base font-extrabold text-slate-900 mt-3">Flat 10% Discount</h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Enjoy 10% off on all Volvo 9600 Multi-Axle luxury sleeper buses.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-dashed border-slate-200 text-[11px] text-slate-400">
              Applicable on single and return bookings
            </div>
          </div>

          {/* Coupon 3 */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs relative overflow-hidden flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded uppercase tracking-wider border border-emerald-200">
                  Always Active
                </span>
                <span className="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  AUTO APPLIED
                </span>
              </div>
              <h3 className="text-base font-extrabold text-slate-900 mt-3">Zero Convenience Fee</h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                NexBus charges exactly the bus operator fare with zero gateway markups.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-dashed border-slate-200 text-[11px] text-slate-400">
              Guaranteed lowest price vs aggregators
            </div>
          </div>
        </div>
      </section>

      {/* Popular Corridors */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-5">
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Popular Travel Corridors</h2>
          <p className="text-xs text-slate-500 mt-0.5">High frequency routes with verified operators</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              from: 'Bangalore',
              to: 'Hyderabad',
              time: '7h 45m',
              fare: '₹1,299',
              departures: '24 buses daily',
              type: 'Volvo Multi-Axle Sleeper',
            },
            {
              from: 'Mumbai',
              to: 'Pune',
              time: '3h 30m',
              fare: '₹499',
              departures: '48 buses daily',
              type: 'AC High Deck Seater',
            },
            {
              from: 'Bangalore',
              to: 'Chennai',
              time: '5h 45m',
              fare: '₹850',
              departures: '32 buses daily',
              type: 'Luxury AC Sleeper 2+1',
            },
          ].map((corridor, idx) => (
            <div
              key={idx}
              onClick={() => handleQuickRoute(corridor.from, corridor.to)}
              className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-brand-500 hover:shadow-md transition cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded">
                  {corridor.type}
                </span>
                <span className="text-xs text-slate-400 font-medium">{corridor.departures}</span>
              </div>

              <div className="flex items-center gap-2 font-extrabold text-slate-900 text-base mt-3 group-hover:text-brand-600 transition">
                <span>{corridor.from}</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
                <span>{corridor.to}</span>
              </div>

              <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 text-xs">
                <div className="text-slate-500 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{corridor.time}</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400">Starting at </span>
                  <strong className="text-slate-900 font-mono text-sm">{corridor.fare}</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Engineering & Platform Standards */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-10 border border-slate-800">
          <div className="max-w-3xl mb-8">
            <span className="text-xs font-bold text-brand-400 tracking-wider uppercase">Built for Scale & Integrity</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
              Enterprise Transit Engine Architecture
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              Designed from the database layer up to eliminate double bookings, ensure strict conductor check-in reconciliation, and process verifiable policy-driven refunds.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-800/60 p-5 rounded-xl border border-slate-700/60 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-sm">Pessimistic Seat Locking</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Row-level locking (`SELECT FOR UPDATE`) prevents two travelers from ever securing the same seat during simultaneous checkout spikes.
              </p>
            </div>

            <div className="bg-slate-800/60 p-5 rounded-xl border border-slate-700/60 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                <RefreshCw className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-sm">Automated Refund Policies</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Dynamic tiered cancellation rules (90% &gt;24h, 50% 12-24h, 25% 2-12h, 0% &lt;2h) calculate instant simulated payouts.
              </p>
            </div>

            <div className="bg-slate-800/60 p-5 rounded-xl border border-slate-700/60 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-sm">Conductor Manifests</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Real-time boarding passes, seat occupancy percentages, and 1-click boarding check-in for bus drivers and station controllers.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
