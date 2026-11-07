import React from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { CheckCircle2, Ticket, ArrowLeft, Download, ShieldCheck } from 'lucide-react';
import TicketCard from '../components/TicketCard';

export default function BookingConfirmation() {
  const location = useLocation();
  const navigate = useNavigate();
  const booking = location.state?.booking;

  if (!booking) {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 bg-white rounded-3xl border border-slate-200 text-center space-y-4">
        <Ticket className="w-12 h-12 text-blue-600 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">No Booking Information</h2>
        <p className="text-xs text-slate-500">Please provide a valid booking reference or search for your ticket using PNR.</p>
        <Link
          to="/pnr-lookup"
          className="inline-block px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition"
        >
          PNR Lookup
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Confirmation Banner */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-6 sm:p-8 text-center space-y-3 no-print">
        <div className="w-14 h-14 bg-emerald-600 text-white rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-emerald-600/20">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-emerald-950">
          Booking Confirmed & Seats Locked!
        </h1>
        <p className="text-xs sm:text-sm text-emerald-800 max-w-xl mx-auto">
          Your reservation is confirmed. Your unique PNR reference is{' '}
          <strong className="font-mono bg-emerald-200/60 px-2 py-0.5 rounded text-emerald-950">
            {booking.pnr}
          </strong>
          . A copy has been saved to your booking history.
        </p>

        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/my-bookings"
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition shadow-xs"
          >
            Go to My Bookings
          </Link>
          <Link
            to="/"
            className="px-4 py-2 bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-100 rounded-xl text-xs font-bold transition shadow-xs"
          >
            Book Another Trip
          </Link>
        </div>
      </div>

      {/* Official Boarding Pass Component */}
      <TicketCard booking={booking} />
    </div>
  );
}
