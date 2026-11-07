import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Bus, MapPin, Calendar, Clock, Filter, ArrowUpDown, ChevronDown, ChevronUp, AlertCircle, Wifi, Zap, Coffee, Shield } from 'lucide-react';
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
  const [maxPrice, setMaxPrice] = useState(3000);

  // Active expanded trip for seat selection
  const [expandedTripId, setExpandedTripId] = useState(null);
  const [expandedTripData, setExpandedTripData] = useState(null);
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
    if (expandedTripId === tripId) {
      setExpandedTripId(null);
      setExpandedTripData(null);
      setSelectedSeats([]);
      return;
    }

    setExpandedTripId(tripId);
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

  const handleSeatClick = (seatNumber) => {
    setSelectedSeats(prev => {
      if (prev.includes(seatNumber)) {
        return prev.filter(s => s !== seatNumber);
      } else {
        if (prev.length >= 6) {
          alert('Maximum 6 seats can be booked in a single transaction');
          return prev;
        }
        return [...prev, seatNumber];
      }
    });
  };

  const handleProceedToCheckout = (trip) => {
    if (selectedSeats.length === 0) return;

    // Filter seat objects
    const seatObjs = expandedTripData.seats.filter(s => selectedSeats.includes(s.seat_number));

    navigate('/checkout', {
      state: {
        trip: expandedTripData,
        selectedSeats,
        seatObjs,
      },
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Search Header Banner */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Search Results</span>
          <h1 className="text-2xl font-black text-slate-900 mt-1">
            {source} → {destination}
          </h1>
          <div className="text-xs text-slate-500 flex items-center gap-2 mt-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>{new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}</span>
            <span>•</span>
            <span>{trips.length} Available Buses Found</span>
          </div>
        </div>

        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition shadow-xs"
        >
          Modify Search
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filters Sidebar */}
        <aside className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Filter className="w-4 h-4 text-blue-600" /> Filters
              </h3>
              <button
                onClick={() => {
                  setBusTypeFilter('ALL');
                  setTimeOfDayFilter('ALL');
                  setSortBy('departure_asc');
                }}
                className="text-[11px] font-bold text-blue-600 hover:underline"
              >
                Reset All
              </button>
            </div>

            {/* Sort Options */}
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                Sort Trips By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="departure_asc">Earliest Departure</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="duration_asc">Shortest Travel Duration</option>
              </select>
            </div>

            {/* Bus Type Filter */}
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                Coach / Bus Type
              </label>
              <div className="space-y-1.5 text-xs">
                {[
                  { id: 'ALL', label: 'All Bus Types' },
                  { id: 'AC_SLEEPER', label: 'AC Sleeper 2+1' },
                  { id: 'AC_SEATER', label: 'AC Seater High Deck' },
                ].map(opt => (
                  <label key={opt.id} className="flex items-center gap-2 text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="busType"
                      checked={busTypeFilter === opt.id}
                      onChange={() => setBusTypeFilter(opt.id)}
                      className="text-blue-600 focus:ring-blue-500 rounded-full"
                    />
                    <span>{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Departure Period */}
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                Departure Time
              </label>
              <div className="space-y-1.5 text-xs">
                {[
                  { id: 'ALL', label: 'Anytime' },
                  { id: 'morning', label: 'Morning (06:00 - 12:00)' },
                  { id: 'afternoon', label: 'Afternoon (12:00 - 18:00)' },
                  { id: 'evening', label: 'Evening (18:00 - 24:00)' },
                  { id: 'night', label: 'Night (00:00 - 06:00)' },
                ].map(period => (
                  <label key={period.id} className="flex items-center gap-2 text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="timeOfDay"
                      checked={timeOfDayFilter === period.id}
                      onChange={() => setTimeOfDayFilter(period.id)}
                      className="text-blue-600 focus:ring-blue-500 rounded-full"
                    />
                    <span>{period.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Trips List */}
        <main className="lg:col-span-3 space-y-6">
          {loading ? (
            <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-4">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-sm font-semibold text-slate-600">Querying verified trip schedules & seat inventories...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 p-8 rounded-3xl border border-red-200 text-center space-y-2">
              <AlertCircle className="w-8 h-8 text-red-600 mx-auto" />
              <h3 className="font-bold text-red-900">Search Error</h3>
              <p className="text-xs text-red-700">{error}</p>
            </div>
          ) : trips.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-4">
              <Bus className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="font-bold text-slate-900 text-lg">No Buses Found For Selected Date</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                No trips scheduled between {source} and {destination} on {date}. Try selecting today or tomorrow.
              </p>
              <button
                onClick={() => navigate('/')}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-md hover:bg-blue-700 transition"
              >
                Back to Search
              </button>
            </div>
          ) : (
            trips.map(trip => {
              const depDate = new Date(trip.departure_time);
              const arrDate = new Date(trip.arrival_time);
              const isExpanded = expandedTripId === trip.id;

              return (
                <div
                  key={trip.id}
                  className="bg-white rounded-3xl border border-slate-200 hover:border-blue-400 transition shadow-sm overflow-hidden"
                >
                  {/* Card Content */}
                  <div className="p-6 md:p-8 space-y-6">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-lg text-slate-900">{trip.operator_name}</span>
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            {trip.bus_type.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">{trip.bus_model} ({trip.bus_number})</div>
                      </div>

                      <div className="text-right">
                        <div className="text-xs text-slate-400 font-semibold">Starts from</div>
                        <div className="text-2xl font-black text-blue-600 font-mono">
                          ₹{Math.round(trip.starting_fare || trip.base_fare)}
                        </div>
                        <div className="text-[11px] font-bold text-emerald-600">
                          {trip.available_seats} seats remaining
                        </div>
                      </div>
                    </div>

                    {/* Timing Schedule Row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4 py-4 px-5 bg-slate-50 rounded-2xl border border-slate-150">
                      <div>
                        <div className="text-xl font-black text-slate-900">
                          {depDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="text-xs font-bold text-slate-700">{trip.source_city}</div>
                        <div className="text-[11px] text-slate-400">{depDate.toLocaleDateString([], { month: 'short', day: 'numeric' })}</div>
                      </div>

                      <div className="text-center">
                        <div className="text-xs font-semibold text-slate-500">
                          {Math.floor(trip.duration_mins / 60)}h {trip.duration_mins % 60}m
                        </div>
                        <div className="flex items-center justify-center gap-1 my-1">
                          <span className="w-2 h-2 rounded-full border border-blue-600"></span>
                          <div className="w-16 border-t border-slate-300"></div>
                          <Bus className="w-3.5 h-3.5 text-blue-600" />
                          <div className="w-16 border-t border-slate-300"></div>
                          <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                        </div>
                        <div className="text-[11px] text-slate-400">Direct Route</div>
                      </div>

                      <div className="md:text-right">
                        <div className="text-xl font-black text-slate-900">
                          {arrDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="text-xs font-bold text-slate-700">{trip.destination_city}</div>
                        <div className="text-[11px] text-slate-400">{arrDate.toLocaleDateString([], { month: 'short', day: 'numeric' })}</div>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span className="font-medium">Amenities:</span>
                        {(trip.amenities || []).slice(0, 4).map((amenity, i) => (
                          <span key={i} className="px-2 py-0.5 bg-slate-100 rounded text-[11px] font-semibold text-slate-600">
                            {amenity}
                          </span>
                        ))}
                      </div>

                      <button
                        onClick={() => handleToggleSeats(trip.id)}
                        className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition shadow-xs ${
                          isExpanded
                            ? 'bg-slate-800 text-white hover:bg-slate-900'
                            : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/20'
                        }`}
                      >
                        <span>{isExpanded ? 'Hide Seat Map' : 'Select Seats'}</span>
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Seat Selection Section */}
                  {isExpanded && (
                    <div className="p-6 md:p-8 bg-slate-50/80 border-t border-slate-200 space-y-6">
                      {loadingSeats ? (
                        <div className="py-12 text-center space-y-2">
                          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                          <p className="text-xs text-slate-500">Rendering live seat matrix...</p>
                        </div>
                      ) : expandedTripData ? (
                        <>
                          <SeatMap
                            seats={expandedTripData.seats}
                            selectedSeats={selectedSeats}
                            onSeatToggle={handleSeatClick}
                            busType={expandedTripData.bus_type}
                            baseFare={expandedTripData.base_fare}
                          />

                          {/* Selected Seats Bottom Action Bar */}
                          {selectedSeats.length > 0 && (
                            <div className="sticky bottom-4 z-40 bg-slate-900 text-white p-4 sm:p-5 rounded-2xl shadow-2xl flex flex-wrap items-center justify-between gap-4 animate-in fade-in duration-300">
                              <div>
                                <div className="text-xs text-slate-400 font-medium">Selected Seats ({selectedSeats.length})</div>
                                <div className="text-lg font-black text-white font-mono">
                                  {selectedSeats.join(', ')}
                                </div>
                              </div>

                              <div className="text-right">
                                <div className="text-xs text-slate-400 font-medium">Estimated Total</div>
                                <div className="text-xl font-black text-emerald-400 font-mono">
                                  ₹{expandedTripData.seats
                                    .filter(s => selectedSeats.includes(s.seat_number))
                                    .reduce((sum, s) => sum + Number(s.fare), 0)}
                                </div>
                              </div>

                              <button
                                onClick={() => handleProceedToCheckout(trip)}
                                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-lg transition active:scale-98"
                              >
                                Continue to Passenger Details →
                              </button>
                            </div>
                          )}
                        </>
                      ) : null}
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
