import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { CheckCircle2, Ticket } from 'lucide-react';
import TicketCard from '../components/TicketCard';

export default function BookingConfirmation() {
  const location = useLocation();
  const booking = location.state?.booking;

  if (!booking) {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 bg-white rounded-2xl border border-slate-200 text-center space-y-4">
        <Ticket className="w-12 h-12 text-brand-600 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">No Booking Information</h2>
        <p className="text-xs text-slate-500">Please provide a valid booking reference or search for your ticket using PNR.</p>
        <Link
          to="/pnr-lookup"
          className="inline-block px-5 py-2.5 bg-brand-600 text-white rounded-xl text-xs font-bold hover:bg-brand-700 transition"
        >
          PNR Status Lookup
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Confirmation Success Header */}
      <div className="rounded-3xl border border-emerald-200 bg-emerald-50/80 p-6 text-center shadow-sm sm:p-8 no-print">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20">
          <CheckCircle2 className="w-7 h-7" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-emerald-950 tracking-tight">
          Your trip is booked
        </h1>
        <p className="text-xs sm:text-sm text-emerald-800 max-w-xl mx-auto leading-relaxed">
          Your booking is confirmed. Keep this reference handy:{' '}
          <strong className="font-mono bg-emerald-200/60 px-2 py-0.5 rounded text-emerald-950">
            {booking.pnr}
          </strong>
          .
        </p>

        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/my-bookings"
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition shadow-2xs"
          >
            View in My Bookings
          </Link>
          <Link
            to="/"
            className="px-4 py-2 bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-100/60 rounded-xl text-xs font-bold transition shadow-2xs"
          >
            Book Another Trip
          </Link>
        </div>
      </div>

      {/* Ticket Pass Display */}
      <div className="space-y-4">
        <div className="flex items-center justify-between no-print px-1">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Generated Boarding Pass
          </div>
          <span className="text-xs text-slate-500">
            Booking reference <strong className="text-slate-800">{booking.pnr}</strong>
          </span>
        </div>

        <TicketCard booking={booking} />
      </div>
    </div>
  );
}
