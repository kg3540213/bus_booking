import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowDownUp, ArrowRight, BusFront, CalendarDays, Clock3, MapPin,
  Search, ShieldCheck, Sparkles, Star
} from 'lucide-react';
import { routesApi } from '../services/api';

const featuredRoutes = [
  {
    from: 'Bangalore',
    to: 'Hyderabad',
    duration: '9 hr',
    image: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=900&q=85',
  },
  {
    from: 'Mumbai',
    to: 'Pune',
    duration: '3 hr',
    image: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=900&q=85',
  },
  {
    from: 'Bangalore',
    to: 'Chennai',
    duration: '6 hr',
    image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=85',
  },
];

const localDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function Home() {
  const navigate = useNavigate();
  const [cities, setCities] = useState(['Bangalore', 'Hyderabad', 'Mumbai', 'Pune', 'Chennai']);
  const [source, setSource] = useState('Bangalore');
  const [destination, setDestination] = useState('Hyderabad');
  const [travelDate, setTravelDate] = useState(() => localDateString());

  useEffect(() => {
    routesApi.getCities().then((res) => {
      if (!res.success || res.data.length === 0) return;
      const availableCities = [...new Set(res.data)];
      setCities(availableCities);
      setSource((current) => availableCities.includes(current) ? current : availableCities[0]);
      setDestination((current) => availableCities.includes(current) ? current : availableCities[1] || availableCities[0]);
    }).catch(() => {});
  }, []);

  const searchTrips = (from, to) => {
    if (!from || !to || from === to) return;
    const params = new URLSearchParams({ source: from, destination: to, date: travelDate });
    navigate(`/search?${params.toString()}`);
  };

  return (
    <div className="pb-20">
      <section className="relative isolate overflow-hidden bg-slate-950">
        <div
          className="absolute inset-0 -z-20 bg-cover bg-center"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=2200&q=90')" }}
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-slate-950/95 via-slate-950/80 to-slate-950/35" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-slate-950/70 via-transparent to-slate-950/10" />

        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 pb-24 pt-16 sm:px-8 sm:pb-28 sm:pt-24 lg:grid-cols-[1fr_0.95fr] lg:gap-16 lg:px-10">
          <div className="max-w-2xl text-white">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-2 text-xs font-medium text-white/85 backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              A better way to get there
            </div>
            <h1 className="max-w-xl text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
              The journey is part of the <span className="text-rose-300">plan.</span>
            </h1>
            <p className="mt-5 max-w-lg text-sm leading-7 text-slate-200 sm:text-base">
              Find a seat that feels right, book in a few steps, and get on with your trip.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs text-white/80">
              <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-300" /> Secure seat booking</span>
              <span className="inline-flex items-center gap-2"><BusFront className="h-4 w-4 text-rose-200" /> Routes that fit your day</span>
            </div>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-2xl shadow-black/25 sm:p-7">
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-700">Plan your trip</p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">Where are you headed?</h2>
            </div>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                searchTrips(source, destination);
              }}
              className="space-y-3"
            >
              <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
                <label className="block rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 transition focus-within:border-brand-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-brand-100">
                  <span className="mb-1.5 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    <MapPin className="h-3.5 w-3.5 text-brand-600" /> Leaving from
                  </span>
                  <select
                    value={source}
                    onChange={(event) => setSource(event.target.value)}
                    className="w-full cursor-pointer bg-transparent text-sm font-semibold text-slate-900 outline-none"
                    required
                  >
                    {cities.map((city) => <option key={city} value={city}>{city}</option>)}
                  </select>
                </label>

                <button
                  type="button"
                  aria-label="Swap departure and destination"
                  onClick={() => {
                    setSource(destination);
                    setDestination(source);
                  }}
                  className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-brand-200 hover:text-brand-700 sm:mx-0"
                >
                  <ArrowDownUp className="h-4 w-4" />
                </button>

                <label className="block rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 transition focus-within:border-brand-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-brand-100">
                  <span className="mb-1.5 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    <MapPin className="h-3.5 w-3.5 text-slate-500" /> Going to
                  </span>
                  <select
                    value={destination}
                    onChange={(event) => setDestination(event.target.value)}
                    className="w-full cursor-pointer bg-transparent text-sm font-semibold text-slate-900 outline-none"
                    required
                  >
                    {cities.map((city) => <option key={city} value={city}>{city}</option>)}
                  </select>
                </label>
              </div>

              <label className="block rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 transition focus-within:border-brand-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-brand-100">
                <span className="mb-1.5 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  <CalendarDays className="h-3.5 w-3.5 text-brand-600" /> Travel date
                </span>
                <input
                  type="date"
                  min={localDateString()}
                  value={travelDate}
                  onChange={(event) => setTravelDate(event.target.value)}
                  className="w-full cursor-pointer bg-transparent text-sm font-semibold text-slate-900 outline-none"
                  required
                />
              </label>

              <button
                type="submit"
                disabled={source === destination}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-600 px-5 py-4 text-sm font-semibold text-white shadow-lg shadow-brand-600/20 transition hover:bg-brand-700 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Search className="h-4 w-4" />
                Search buses
                <ArrowRight className="ml-1 h-4 w-4" />
              </button>
              {source === destination && (
                <p className="text-center text-xs text-rose-600">Choose two different cities to continue.</p>
              )}
            </form>
            <div className="mt-5 flex items-center justify-center gap-2 text-[11px] text-slate-500">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              Your seats are held securely while your booking is confirmed
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pt-14 sm:px-8 lg:px-10">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-700">A little inspiration</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">Popular ways to go</h2>
            <p className="mt-1 text-sm text-slate-500">Pick a route to see available trips.</p>
          </div>
          <span className="hidden items-center gap-1.5 text-xs text-slate-500 sm:flex">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> Your next stop is closer than you think
          </span>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {featuredRoutes.map((route) => (
            <button
              key={`${route.from}-${route.to}`}
              type="button"
              onClick={() => searchTrips(route.from, route.to)}
              className="group overflow-hidden rounded-3xl border border-slate-200 bg-white text-left shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="relative h-48 overflow-hidden">
                <img
                  src={route.image}
                  alt={`${route.from} to ${route.to}`}
                  loading="lazy"
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/10 to-transparent" />
                <div className="absolute bottom-4 left-5 right-5 flex items-end justify-between text-white">
                  <div>
                    <p className="text-lg font-semibold tracking-tight">{route.from} <span className="text-rose-200">to</span> {route.to}</p>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-white/80"><Clock3 className="h-3.5 w-3.5" /> Around {route.duration}</p>
                  </div>
                  <span className="mb-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-white/15 backdrop-blur transition group-hover:bg-white group-hover:text-slate-900">
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between px-5 py-4 text-xs text-slate-500">
                <span>See available departures</span>
                <span className="font-semibold text-brand-700">Explore route</span>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-12 max-w-7xl px-5 sm:px-8 lg:px-10">
        <div className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-5 sm:grid-cols-3 sm:p-7">
          {[
            { title: 'Choose your seat', text: 'See the layout before you book.', icon: BusFront },
            { title: 'Book with confidence', text: 'Seats are protected during checkout.', icon: ShieldCheck },
            { title: 'Plans can change', text: 'Check the cancellation quote before you confirm.', icon: Clock3 },
          ].map(({ title, text, icon: Icon }) => (
            <div key={title} className="flex gap-3 rounded-2xl p-3 sm:p-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-brand-700">
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
                <p className="mt-1 text-xs leading-5 text-slate-500">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
