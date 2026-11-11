import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowRight, BusFront, CalendarDays, ChevronDown,
  ChevronLeft, ChevronRight, Clock3, MapPin, RotateCw, ShieldCheck, SlidersHorizontal
} from 'lucide-react';
import { tripsApi } from '../services/api';
import SeatMap from '../components/SeatMap';

const localDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const timeOptions = [
  ['ALL', 'Any time'],
  ['morning', 'Morning · 6am–12pm'],
  ['afternoon', 'Afternoon · 12pm–6pm'],
  ['evening', 'Evening · 6pm–12am'],
  ['night', 'Night · 12am–6am'],
];

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const source = searchParams.get('source') || 'Bangalore';
  const destination = searchParams.get('destination') || 'Hyderabad';
  const date = searchParams.get('date') || localDateString();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busType, setBusType] = useState('ALL');
  const [timeOfDay, setTimeOfDay] = useState('ALL');
  const [sortBy, setSortBy] = useState('departure_asc');
  const [expandedTripId, setExpandedTripId] = useState(null);
  const [tripDetails, setTripDetails] = useState({});
  const [activeTab, setActiveTab] = useState('SEATS');
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    let active = true;
    const fetchTrips = async () => {
      setLoading(true);
      setError('');
      try {
        const params = { source, destination, date, sort_by: sortBy };
        if (busType !== 'ALL') params.bus_type = busType;
        if (timeOfDay !== 'ALL') params.departure_time_of_day = timeOfDay;
        const res = await tripsApi.search(params);
        if (active && res.success) setTrips(res.data);
      } catch (err) {
        if (active) setError(err.message || 'We could not load trips for this route.');
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchTrips();
    return () => { active = false; };
  }, [source, destination, date, busType, timeOfDay, sortBy]);

  const changeDate = (offset) => {
    const next = new Date(`${date}T12:00:00`);
    next.setDate(next.getDate() + offset);
    const nextDate = localDateString(next);
    if (nextDate < localDateString()) return;
    const params = new URLSearchParams({ source, destination, date: nextDate });
    navigate(`/search?${params.toString()}`);
  };

  const showTripDetails = async (trip, tab = 'SEATS') => {
    if (expandedTripId === trip.id && activeTab === tab) {
      setExpandedTripId(null);
      setSelectedSeats([]);
      return;
    }
    setExpandedTripId(trip.id);
    setActiveTab(tab);
    setSelectedSeats([]);
    if (tripDetails[trip.id]) return;

    setLoadingDetails(true);
    try {
      const res = await tripsApi.getById(trip.id);
      if (res.success) setTripDetails((current) => ({ ...current, [trip.id]: res.data }));
    } catch (err) {
      setError(err.message || 'Trip details could not be loaded.');
    } finally {
      setLoadingDetails(false);
    }
  };

  const onSeatToggle = (seatNumber) => {
    setSelectedSeats((current) => {
      if (current.includes(seatNumber)) return current.filter((seat) => seat !== seatNumber);
      if (current.length >= 6) {
        window.alert('You can select up to 6 seats per booking.');
        return current;
      }
      return [...current, seatNumber];
    });
  };

  const goToCheckout = (trip) => {
    const details = tripDetails[trip.id];
    const seatObjs = (details?.seats || []).filter((seat) => selectedSeats.includes(seat.seat_number));
    navigate('/checkout', { state: { trip: details || trip, selectedSeats, seatObjs } });
  };

  const routeDate = new Date(`${date}T12:00:00`);

  return (
    <div className="min-h-screen bg-[#f7f8fa] pb-20">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-5 sm:px-8 lg:px-10">
          <button onClick={() => navigate('/')} className="mb-4 inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 transition hover:text-brand-700">
            <ChevronLeft className="h-4 w-4" /> Change search
          </button>
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="text-xs font-medium text-slate-500">Your route</p>
              <h1 className="mt-1 flex flex-wrap items-center gap-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
                {source}<ArrowRight className="h-5 w-5 text-brand-600" />{destination}
              </h1>
              <p className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                <CalendarDays className="h-4 w-4" />
                {routeDate.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}
                <span className="text-slate-300">·</span>
                {loading ? 'Finding trips…' : `${trips.length} ${trips.length === 1 ? 'trip' : 'trips'}`}
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-1">
              <button onClick={() => changeDate(-1)} disabled={date <= localDateString()} aria-label="Previous day" className="rounded-lg p-2 text-slate-600 transition hover:bg-white hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-30">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="min-w-24 text-center text-xs font-semibold text-slate-700">
                {routeDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
              </span>
              <button onClick={() => changeDate(1)} aria-label="Next day" className="rounded-lg p-2 text-slate-600 transition hover:bg-white hover:shadow-sm">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-6 px-5 py-7 sm:px-8 lg:grid-cols-[250px_minmax(0,1fr)] lg:px-10">
        <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900"><SlidersHorizontal className="h-4 w-4 text-brand-600" /> Refine results</h2>
            <button type="button" onClick={() => { setBusType('ALL'); setTimeOfDay('ALL'); setSortBy('departure_asc'); }} className="text-xs font-medium text-brand-700 hover:underline">Reset</button>
          </div>
          <label className="mb-5 block">
            <span className="mb-2 block text-xs font-medium text-slate-600">Sort by</span>
            <select value={sortBy} onChange={(event) => setSortBy(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-800 outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100">
              <option value="departure_asc">Earliest departure</option>
              <option value="price_asc">Price: low to high</option>
              <option value="price_desc">Price: high to low</option>
              <option value="duration_asc">Shortest journey</option>
            </select>
          </label>
          <fieldset className="mb-5 border-t border-slate-100 pt-4">
            <legend className="mb-3 text-xs font-medium text-slate-600">Bus type</legend>
            {[
              ['ALL', 'Any type'],
              ['AC_SLEEPER', 'AC sleeper'],
              ['AC_SEATER', 'AC seater'],
            ].map(([value, label]) => (
              <label key={value} className="mb-2 flex cursor-pointer items-center gap-2.5 text-xs text-slate-700">
                <input type="radio" name="busType" checked={busType === value} onChange={() => setBusType(value)} className="accent-[#d84e55]" />
                {label}
              </label>
            ))}
          </fieldset>
          <fieldset className="border-t border-slate-100 pt-4">
            <legend className="mb-3 text-xs font-medium text-slate-600">Departure time</legend>
            {timeOptions.map(([value, label]) => (
              <label key={value} className="mb-2 flex cursor-pointer items-center gap-2.5 text-xs text-slate-700">
                <input type="radio" name="timeOfDay" checked={timeOfDay === value} onChange={() => setTimeOfDay(value)} className="accent-[#d84e55]" />
                {label}
              </label>
            ))}
          </fieldset>
          <div className="mt-5 flex gap-2 rounded-xl bg-emerald-50 p-3 text-[11px] leading-5 text-emerald-800">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
            Seat availability is confirmed when you book.
          </div>
        </aside>

        <section className="space-y-4">
          {loading && (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-[3px] border-brand-600 border-t-transparent" />
              <p className="mt-4 text-sm text-slate-500">Finding a trip that works for you…</p>
            </div>
          )}
          {!loading && error && (
            <div className="rounded-2xl border border-rose-200 bg-white p-8 text-center">
              <p className="text-sm font-semibold text-slate-900">We couldn’t load the trips</p>
              <p className="mt-1 text-xs text-slate-500">{error}</p>
              <button onClick={() => window.location.reload()} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-xs font-semibold text-white"><RotateCw className="h-3.5 w-3.5" /> Try again</button>
            </div>
          )}
          {!loading && !error && trips.length === 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center">
              <BusFront className="mx-auto h-9 w-9 text-slate-300" />
              <h2 className="mt-4 text-lg font-semibold text-slate-900">No trips on this date</h2>
              <p className="mt-1 text-sm text-slate-500">Try another day or adjust your filters.</p>
              <button onClick={() => changeDate(1)} className="mt-5 rounded-xl bg-brand-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-brand-700">Check the next day</button>
            </div>
          )}

          {!loading && trips.map((trip) => {
            const details = tripDetails[trip.id];
            const isExpanded = expandedTripId === trip.id;
            const seats = details?.seats || [];
            const seatFare = seats.filter((seat) => selectedSeats.includes(seat.seat_number)).reduce((sum, seat) => sum + Number(seat.fare), 0);
            const departure = new Date(trip.departure_time);
            const arrival = new Date(trip.arrival_time);
            const durationHours = Math.floor(trip.duration_mins / 60);
            const durationMinutes = trip.duration_mins % 60;

            return (
              <article key={trip.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-slate-300 hover:shadow-md">
                <div className="grid gap-5 p-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:p-6">
                  <div className="grid gap-4 sm:grid-cols-[minmax(130px,1fr)_minmax(140px,0.9fr)_minmax(130px,1fr)] sm:items-center">
                    <div>
                      <p className="text-2xl font-semibold tracking-tight text-slate-950">{departure.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
                      <p className="mt-1 text-sm font-medium text-slate-800">{trip.source_city}</p>
                      <p className="text-[11px] text-slate-400">{departure.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                    </div>
                    <div className="flex items-center gap-2 sm:flex-col sm:gap-1">
                      <span className="inline-flex items-center gap-1 text-xs text-slate-500"><Clock3 className="h-3.5 w-3.5" /> {durationHours}h {durationMinutes}m</span>
                      <div className="hidden w-full items-center gap-1 sm:flex">
                        <span className="h-1.5 w-1.5 rounded-full bg-brand-600" />
                        <span className="h-px flex-1 border-t border-dashed border-slate-300" />
                        <BusFront className="h-4 w-4 text-slate-400" />
                        <span className="h-px flex-1 border-t border-dashed border-slate-300" />
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                      </div>
                      <span className="text-[11px] text-slate-400">Direct journey</span>
                    </div>
                    <div className="sm:text-right">
                      <p className="text-2xl font-semibold tracking-tight text-slate-950">{arrival.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
                      <p className="mt-1 text-sm font-medium text-slate-800">{trip.destination_city}</p>
                      <p className="text-[11px] text-slate-400">{arrival.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-5 border-t border-slate-100 pt-4 sm:flex-col sm:items-end sm:border-0 sm:pt-0">
                    <div className="sm:text-right">
                      <p className="text-[11px] font-medium text-slate-500">{trip.operator_name}</p>
                      <p className="mt-1 text-xl font-semibold text-slate-950">₹{Math.round(trip.starting_fare || trip.base_fare)}</p>
                      <p className="text-[11px] text-slate-500">{trip.available_seats} seats left</p>
                    </div>
                    <button onClick={() => showTripDetails(trip)} className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-brand-700">
                      {isExpanded && activeTab === 'SEATS' ? 'Hide seats' : 'Choose seats'} <ChevronDown className={`h-3.5 w-3.5 transition ${isExpanded && activeTab === 'SEATS' ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-slate-100 px-5 py-3 sm:px-6">
                  <div className="flex min-w-0 flex-1 items-center gap-2 text-xs text-slate-500">
                    <BusFront className="h-4 w-4 shrink-0 text-slate-400" />
                    <span className="truncate">{trip.bus_model}</span>
                    <span className="hidden rounded-md bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-600 sm:inline">{trip.bus_type.replace(/_/g, ' ')}</span>
                  </div>
                  {[
                    ['STOPS', 'Boarding points'],
                    ['AMENITIES', 'Bus details'],
                    ['POLICY', 'Cancellation'],
                  ].map(([tab, label]) => (
                    <button key={tab} onClick={() => showTripDetails(trip, tab)} className="text-[11px] font-medium text-slate-500 transition hover:text-brand-700">{label}</button>
                  ))}
                </div>

                {isExpanded && (
                  <div className="border-t border-slate-200 bg-slate-50/80 p-4 sm:p-6">
                    {loadingDetails ? (
                      <div className="py-8 text-center text-xs text-slate-500">Loading trip details…</div>
                    ) : !details ? (
                      <div className="py-8 text-center text-xs text-slate-500">Trip details are unavailable. Please try again.</div>
                    ) : activeTab === 'SEATS' ? (
                      <div className="space-y-5">
                        <SeatMap seats={seats} selectedSeats={selectedSeats} onSeatToggle={onSeatToggle} busType={details.bus_type} baseFare={details.base_fare} />
                        {selectedSeats.length > 0 && (
                          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-slate-950 px-5 py-4 text-white shadow-lg">
                            <div>
                              <p className="text-[11px] text-slate-400">Your selection</p>
                              <p className="mt-1 text-sm font-medium">{selectedSeats.join(', ')}</p>
                            </div>
                            <div className="flex items-center gap-5">
                              <div className="text-right">
                                <p className="text-[11px] text-slate-400">Seat total</p>
                                <p className="text-lg font-semibold">₹{Math.round(seatFare)}</p>
                              </div>
                              <button onClick={() => goToCheckout(trip)} className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-3 text-xs font-semibold text-white transition hover:bg-brand-700">
                                Continue <ArrowRight className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : activeTab === 'STOPS' ? (
                      <div className="grid gap-6 rounded-2xl border border-slate-200 bg-white p-5 sm:grid-cols-2">
                        {['BOARDING', 'DROPPING'].map((stopType) => (
                          <div key={stopType}>
                            <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold text-slate-900">
                              <MapPin className="h-4 w-4 text-brand-600" /> {stopType === 'BOARDING' ? 'Boarding points' : 'Drop-off points'}
                            </h3>
                            <div className="space-y-2">
                              {(details.stops || []).filter((stop) => stop.stop_type === stopType || stop.stop_type === 'BOTH').map((stop) => (
                                <div key={stop.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5 text-xs">
                                  <span className="font-medium text-slate-700">{stop.stop_name}</span>
                                  <span className="text-slate-400">{stop.time_offset_mins} min</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : activeTab === 'AMENITIES' ? (
                      <div className="rounded-2xl border border-slate-200 bg-white p-5">
                        <h3 className="text-sm font-semibold text-slate-900">{details.bus_model}</h3>
                        <p className="mt-1 text-xs text-slate-500">{details.bus_number} · {details.operator_name}</p>
                        <div className="mt-4 flex flex-wrap gap-2">
                          {(details.amenities || []).map((amenity) => <span key={amenity} className="rounded-full bg-slate-100 px-3 py-1.5 text-xs text-slate-600">{amenity}</span>)}
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-5 text-xs leading-5 text-slate-600">
                        <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-600" />
                        <p>Cancellation refunds depend on the time remaining before departure. You’ll see the exact refund amount before confirming a cancellation.</p>
                      </div>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </section>
      </div>
    </div>
  );
}
