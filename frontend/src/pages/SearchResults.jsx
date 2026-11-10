import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Bus, MapPin, Calendar, Clock, Filter, ArrowUpDown, ChevronDown, ChevronUp,
  AlertCircle, Wifi, Zap, Coffee, ShieldCheck, Star, Users, Check, ArrowRight,
  Info, Shield, RefreshCw
} from 'lucide-react';
import { tripsApi } from '../services/api';
import SeatMap from '../components/SeatMap';

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const source = searchParams.get('source') || 'Bangalore';
  const destination = searchParams.get('destination') || 'Hyderabad';
  const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters & Sorting state
  const [busTypeFilter, setBusTypeFilter] = useState('ALL');
  const [timeOfDayFilter, setTimeOfDayFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('departure_asc');

  // Active expanded trip for seat selection
  const [expandedTripId, setExpandedTripId] = useState(null);
  const [expandedTripData, setExpandedTripData] = useState(null);
  const [activeTabByTrip, setActiveTabByTrip] = useState({}); // 'SEATS', 'STOPS', 'POLICY'
  const [loadingSeats, setLoadingSeats] = useState(false);
  const [selectedSeats, setSelectedSeats] = useState([]);

  useEffect(() => {
    fetchTrips();
  }, [source, destination, date, busTypeFilter, timeOfDayFilter, sortBy]);

  const fetchTrips = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        source,
        destination,
        date,
        sort_by: sortBy,
      };
      if (busTypeFilter !== 'ALL') params.bus_type = busTypeFilter;
      if (timeOfDayFilter !== 'ALL') params.departure_time_of_day = timeOfDayFilter;

      const res = await tripsApi.search(params);
      if (res.success) {
        setTrips(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load buses for this route');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSeats = async (tripId) => {
    if (expandedTripId === tripId && activeTabByTrip[tripId] === 'SEATS') {
      setExpandedTripId(null);
      setExpandedTripData(null);
      setSelectedSeats([]);
      return;
    }

    setExpandedTripId(tripId);
    setActiveTabByTrip(prev => ({ ...prev, [tripId]: 'SEATS' }));
    setLoadingSeats(true);
    setSelectedSeats([]);

    try {
      const res = await tripsApi.getById(tripId);
      if (res.success) {
        setExpandedTripData(res.data);
      }
    } catch (err) {
      console.error('Failed to load trip seats:', err);
    } finally {
      setLoadingSeats(false);
    }
  };

  const handleOpenTab = async (tripId, tabName) => {
    if (expandedTripId === tripId && activeTabByTrip[tripId] === tabName) {
      setExpandedTripId(null);
      return;
    }

    setExpandedTripId(tripId);
    setActiveTabByTrip(prev => ({ ...prev, [tripId]: tabName }));

    if (!expandedTripData || expandedTripData.id !== tripId) {
      setLoadingSeats(true);
      try {
        const res = await tripsApi.getById(tripId);
        if (res.success) {
          setExpandedTripData(res.data);
        }
      } catch (err) {
        console.error('Failed to load trip details:', err);
      } finally {
        setLoadingSeats(false);
      }
    }
  };

  const handleSeatClick = (seatNumber) => {
    setSelectedSeats(prev => {
      if (prev.includes(seatNumber)) {
        return prev.filter(s => s !== seatNumber);
      } else {
        if (prev.length >= 6) {
          alert('Maximum 6 seats can be booked in a single reservation');
          return prev;
        }
        return [...prev, seatNumber];
      }
    });
  };

  const handleProceedToCheckout = (trip) => {
    if (selectedSeats.length === 0) return;

    // Filter seat objects
    const seatObjs = (expandedTripData?.seats || []).filter(s => selectedSeats.includes(s.seat_number));

    navigate('/checkout', {
      state: {
        trip: expandedTripData || trip,
        selectedSeats,
        seatObjs,
      },
    });
  };

  const selectedSeatObjs = (expandedTripData?.seats || []).filter(s => selectedSeats.includes(s.seat_number));
  const totalSeatPrice = selectedSeatObjs.reduce((sum, s) => sum + Number(s.fare), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Route Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-brand-200">
              Verified Intercity Route
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-1 flex items-center gap-2 tracking-tight">
            <span>{source}</span>
            <ArrowRight className="w-5 h-5 text-slate-400" />
            <span>{destination}</span>
          </h1>
          <div className="text-xs text-slate-500 flex items-center gap-2 mt-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>{new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}</span>
            <span>•</span>
            <strong className="text-slate-800 font-semibold">{trips.length} Coaches Scheduled</strong>
          </div>
        </div>

        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition shadow-2xs"
        >
          Modify Route / Date
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters Sidebar */}
        <aside className="lg:col-span-1 space-y-5">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-6 sticky top-24">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                <Filter className="w-4 h-4 text-brand-600" /> Filter Options
              </h3>
              <button
                onClick={() => {
                  setBusTypeFilter('ALL');
                  setTimeOfDayFilter('ALL');
                  setSortBy('departure_asc');
                }}
                className="text-[11px] font-bold text-brand-600 hover:underline"
              >
                Reset All
              </button>
            </div>

            {/* Sort Options */}
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                Sort Coaches By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
              >
                <option value="departure_asc">Earliest Departure Time</option>
                <option value="price_asc">Price: Lowest to Highest</option>
                <option value="price_desc">Price: Highest to Lowest</option>
                <option value="duration_asc">Shortest Travel Duration</option>
              </select>
            </div>

            {/* Coach Type Filter */}
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                Bus Type
              </label>
              <div className="space-y-2 text-xs">
                {[
                  { id: 'ALL', label: 'All Bus Types' },
                  { id: 'AC_SLEEPER', label: 'AC Sleeper 2+1' },
                  { id: 'AC_SEATER', label: 'AC Seater High Deck' },
                ].map(opt => (
                  <label key={opt.id} className="flex items-center gap-2.5 text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="busType"
                      checked={busTypeFilter === opt.id}
                      onChange={() => setBusTypeFilter(opt.id)}
                      className="text-brand-600 focus:ring-brand-500 rounded-full"
                    />
                    <span className="font-medium">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Departure Period */}
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                Departure Time
              </label>
              <div className="space-y-2 text-xs">
                {[
                  { id: 'ALL', label: 'Any Time of Day' },
                  { id: 'morning', label: 'Morning (06:00 - 12:00)' },
                  { id: 'afternoon', label: 'Afternoon (12:00 - 18:00)' },
                  { id: 'evening', label: 'Evening (18:00 - 24:00)' },
                  { id: 'night', label: 'Night (00:00 - 06:00)' },
                ].map(period => (
                  <label key={period.id} className="flex items-center gap-2.5 text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="timeOfDay"
                      checked={timeOfDayFilter === period.id}
                      onChange={() => setTimeOfDayFilter(period.id)}
                      className="text-brand-600 focus:ring-brand-500 rounded-full"
                    />
                    <span className="font-medium">{period.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Trips List Column */}
        <main className="lg:col-span-3 space-y-4">
          {loading ? (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
              <div className="w-10 h-10 border-3 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-xs font-bold text-slate-600">Querying real-time seat inventory & schedules...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 p-8 rounded-2xl border border-red-200 text-center space-y-2">
              <AlertCircle className="w-8 h-8 text-brand-600 mx-auto" />
              <h3 className="font-bold text-red-900 text-sm">Failed to Load Routes</h3>
              <p className="text-xs text-red-700">{error}</p>
            </div>
          ) : trips.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-4">
              <Bus className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="font-bold text-slate-900 text-base">No Buses Found For Selected Date</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                No trips scheduled between {source} and {destination} on {date}. Try selecting today or tomorrow.
              </p>
              <button
                onClick={() => navigate('/')}
                className="px-5 py-2.5 bg-brand-600 text-white rounded-xl text-xs font-bold shadow-sm hover:bg-brand-700 transition"
              >
                Change Date / Route
              </button>
            </div>
          ) : (
            trips.map(trip => {
              const depDate = new Date(trip.departure_time);
              const arrDate = new Date(trip.arrival_time);
              const isExpanded = expandedTripId === trip.id;
              const currentTab = activeTabByTrip[trip.id] || 'SEATS';
              const isFewSeats = trip.available_seats > 0 && trip.available_seats <= 5;

              return (
                <div
                  key={trip.id}
                  className={`bg-white rounded-2xl border transition shadow-xs overflow-hidden ${
                    isExpanded ? 'border-brand-500 ring-1 ring-brand-500/20' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {/* Card Main Body */}
                  <div className="p-5 sm:p-6 space-y-4">
                    {/* Top Row: Operator & Pricing */}
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2.5">
                          <h3 className="font-black text-lg text-slate-900 tracking-tight">{trip.operator_name}</h3>
                          <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-600 text-white text-[11px] font-black">
                            <Star className="w-3 h-3 fill-white" />
                            <span>4.8</span>
                          </div>
                        </div>
                        <div className="text-xs text-slate-500 font-medium">
                          {trip.bus_model} • <span className="font-mono text-slate-700 font-semibold">{trip.bus_number}</span>
                        </div>
                        <div className="flex items-center gap-2 pt-0.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 uppercase border border-slate-200">
                            {trip.bus_type.replace(/_/g, ' ')}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-[11px] text-slate-400 font-medium line-through">
                          ₹{Math.round((trip.starting_fare || trip.base_fare) * 1.15)}
                        </div>
                        <div className="text-2xl font-black text-slate-900 font-mono tracking-tight">
                          ₹{Math.round(trip.starting_fare || trip.base_fare)}
                        </div>
                        <div className={`text-[11px] font-bold ${
                          isFewSeats ? 'text-amber-600 animate-pulse' : 'text-emerald-600'
                        }`}>
                          {trip.available_seats} Seats Available
                        </div>
                      </div>
                    </div>

                    {/* Schedule Row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4 py-3.5 px-4 bg-slate-50/90 rounded-xl border border-slate-100">
                      <div>
                        <div className="text-xl font-black text-slate-900 font-mono">
                          {depDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="text-xs font-bold text-slate-800">{trip.source_city}</div>
                        <div className="text-[11px] text-slate-400 font-medium">{depDate.toLocaleDateString([], { month: 'short', day: 'numeric' })}</div>
                      </div>

                      <div className="text-center">
                        <div className="text-xs font-bold text-slate-500">
                          {Math.floor(trip.duration_mins / 60)}h {trip.duration_mins % 60}m
                        </div>
                        <div className="flex items-center justify-center gap-1.5 my-1">
                          <span className="w-2 h-2 rounded-full border-2 border-brand-600 bg-white"></span>
                          <div className="w-16 border-t border-dashed border-slate-300"></div>
                          <Bus className="w-3.5 h-3.5 text-brand-600" />
                          <div className="w-16 border-t border-dashed border-slate-300"></div>
                          <span className="w-2 h-2 rounded-full bg-brand-600"></span>
                        </div>
                        <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Direct Corridor</div>
                      </div>

                      <div className="md:text-right">
                        <div className="text-xl font-black text-slate-900 font-mono">
                          {arrDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="text-xs font-bold text-slate-800">{trip.destination_city}</div>
                        <div className="text-[11px] text-slate-400 font-medium">{arrDate.toLocaleDateString([], { month: 'short', day: 'numeric' })}</div>
                      </div>
                    </div>

                    {/* Sub tabs and Action Button */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                      <div className="flex items-center gap-2 text-xs">
                        <button
                          type="button"
                          onClick={() => handleOpenTab(trip.id, 'STOPS')}
                          className={`font-semibold transition ${
                            isExpanded && currentTab === 'STOPS' ? 'text-brand-600 underline' : 'text-slate-500 hover:text-slate-900'
                          }`}
                        >
                          Boarding & Dropping Points
                        </button>
                        <span className="text-slate-300">|</span>
                        <button
                          type="button"
                          onClick={() => handleOpenTab(trip.id, 'POLICY')}
                          className={`font-semibold transition ${
                            isExpanded && currentTab === 'POLICY' ? 'text-brand-600 underline' : 'text-slate-500 hover:text-slate-900'
                          }`}
                        >
                          Cancellation Policy
                        </button>
                      </div>

                      <button
                        onClick={() => handleToggleSeats(trip.id)}
                        className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition shadow-xs ${
                          isExpanded && currentTab === 'SEATS'
                            ? 'bg-slate-900 text-white hover:bg-slate-800'
                            : 'bg-brand-600 text-white hover:bg-brand-700 shadow-brand-600/20'
                        }`}
                      >
                        <span>{isExpanded && currentTab === 'SEATS' ? 'Hide Seat Map' : 'Select Seats'}</span>
                        {isExpanded && currentTab === 'SEATS' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Drawer Area */}
                  {isExpanded && (
                    <div className="p-5 sm:p-6 bg-slate-50 border-t border-slate-200 space-y-5">
                      {/* Sub-tab navigation */}
                      <div className="flex border-b border-slate-200 gap-4 text-xs font-bold">
                        <button
                          type="button"
                          onClick={() => setActiveTabByTrip(prev => ({ ...prev, [trip.id]: 'SEATS' }))}
                          className={`pb-2.5 transition border-b-2 -mb-[2px] ${
                            currentTab === 'SEATS'
                              ? 'border-brand-600 text-brand-600'
                              : 'border-transparent text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          Seat Layout & Berth Matrix
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveTabByTrip(prev => ({ ...prev, [trip.id]: 'STOPS' }))}
                          className={`pb-2.5 transition border-b-2 -mb-[2px] ${
                            currentTab === 'STOPS'
                              ? 'border-brand-600 text-brand-600'
                              : 'border-transparent text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          Boarding & Dropping Points
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveTabByTrip(prev => ({ ...prev, [trip.id]: 'POLICY' }))}
                          className={`pb-2.5 transition border-b-2 -mb-[2px] ${
                            currentTab === 'POLICY'
                              ? 'border-brand-600 text-brand-600'
                              : 'border-transparent text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          Refund & Cancellation Rules
                        </button>
                      </div>

                      {loadingSeats ? (
                        <div className="py-10 text-center space-y-2">
                          <div className="w-8 h-8 border-3 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                          <p className="text-xs text-slate-500 font-semibold">Loading real-time berth matrix...</p>
                        </div>
                      ) : (
                        <>
                          {/* TAB 1: SEATS */}
                          {currentTab === 'SEATS' && expandedTripData && (
                            <div className="space-y-6">
                              <SeatMap
                                seats={expandedTripData.seats}
                                selectedSeats={selectedSeats}
                                onSeatToggle={handleSeatClick}
                                busType={expandedTripData.bus_type}
                                baseFare={expandedTripData.base_fare}
                              />

                              {/* Floating Bottom Action Dock */}
                              {selectedSeats.length > 0 && (
                                <div className="sticky bottom-4 z-40 bg-slate-900 text-white p-4 rounded-2xl shadow-xl flex flex-wrap items-center justify-between gap-4 border border-slate-800">
                                  <div>
                                    <div className="text-[11px] text-slate-400 font-medium">Selected Seats ({selectedSeats.length})</div>
                                    <div className="text-base font-extrabold text-white font-mono">
                                      {selectedSeats.join(', ')}
                                    </div>
                                  </div>

                                  <div className="text-right">
                                    <div className="text-[11px] text-slate-400 font-medium">Total Fare Payable</div>
                                    <div className="text-xl font-black text-emerald-400 font-mono">
                                      ₹{Math.round(totalSeatPrice)}
                                    </div>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => handleProceedToCheckout(trip)}
                                    className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2"
                                  >
                                    <span>Proceed to Passenger Details</span>
                                    <ArrowRight className="w-4 h-4" />
                                  </button>
                                </div>
                              )}
                            </div>
                          )}

                          {/* TAB 2: STOPS */}
                          {currentTab === 'STOPS' && (
                            <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4 text-xs">
                              <h4 className="font-extrabold text-slate-900 text-sm">Scheduled Transit Boarding & Drop Stops</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <div className="font-bold text-slate-700 uppercase tracking-wider text-[11px] text-brand-600">
                                    Boarding Points ({source})
                                  </div>
                                  {expandedTripData?.stops?.filter(s => s.stop_type === 'BOARDING' || s.stop_type === 'BOTH').map(stop => (
                                    <div key={stop.id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                                      <span className="font-semibold text-slate-800">{stop.stop_name}</span>
                                      <span className="font-mono text-slate-500 font-medium">{stop.scheduled_time || 'On Schedule'}</span>
                                    </div>
                                  )) || <div className="text-slate-400">Main Central Transit Terminus</div>}
                                </div>

                                <div className="space-y-2">
                                  <div className="font-bold text-slate-700 uppercase tracking-wider text-[11px] text-slate-700">
                                    Dropping Points ({destination})
                                  </div>
                                  {expandedTripData?.stops?.filter(s => s.stop_type === 'DROPPING' || s.stop_type === 'BOTH').map(stop => (
                                    <div key={stop.id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                                      <span className="font-semibold text-slate-800">{stop.stop_name}</span>
                                      <span className="font-mono text-slate-500 font-medium">{stop.scheduled_time || 'On Schedule'}</span>
                                    </div>
                                  )) || <div className="text-slate-400">Central Drop Station</div>}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* TAB 3: CANCELLATION POLICY */}
                          {currentTab === 'POLICY' && (
                            <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3 text-xs">
                              <h4 className="font-extrabold text-slate-900 text-sm">Automated Refund Cancellation Tiers</h4>
                              <p className="text-slate-500">
                                Cancellations are processed immediately back to the original simulated payment method.
                              </p>
                              <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                  <thead>
                                    <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                                      <th className="py-2">Notice Window Prior to Departure</th>
                                      <th className="py-2">Refund %</th>
                                      <th className="py-2">Cancellation Charge %</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100 font-medium">
                                    <tr>
                                      <td className="py-2.5 text-slate-800">More than 24 hours prior</td>
                                      <td className="py-2.5 text-emerald-600 font-bold">90% Refund</td>
                                      <td className="py-2.5 text-slate-500">10% Fee</td>
                                    </tr>
                                    <tr>
                                      <td className="py-2.5 text-slate-800">Between 12 to 24 hours prior</td>
                                      <td className="py-2.5 text-emerald-600 font-bold">50% Refund</td>
                                      <td className="py-2.5 text-slate-500">50% Fee</td>
                                    </tr>
                                    <tr>
                                      <td className="py-2.5 text-slate-800">Between 2 to 12 hours prior</td>
                                      <td className="py-2.5 text-amber-600 font-bold">25% Refund</td>
                                      <td className="py-2.5 text-slate-500">75% Fee</td>
                                    </tr>
                                    <tr>
                                      <td className="py-2.5 text-slate-800">Less than 2 hours prior</td>
                                      <td className="py-2.5 text-brand-600 font-bold">0% (Non-Refundable)</td>
                                      <td className="py-2.5 text-slate-500">100% Fee</td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </main>
      </div>
    </div>
  );
}
