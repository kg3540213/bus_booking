import React from 'react';
import {
  Bus, MapPin, Calendar, Clock, User, CheckCircle2,
  XCircle, Printer, QrCode, ShieldCheck, AlertCircle,
  Luggage, Info, Shield, Check
} from 'lucide-react';

export default function TicketCard({ booking, onCancelClick }) {
  if (!booking) return null;

  const isCancelled = booking.status === 'CANCELLED';
  const depDate = new Date(booking.departure_time);
  const arrDate = new Date(booking.arrival_time);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-lg overflow-hidden max-w-3xl mx-auto ticket-container relative">
      {/* Top Pass Header */}
      <div className={`p-6 sm:p-7 text-white flex flex-wrap items-center justify-between gap-4 ${
        isCancelled
          ? 'bg-gradient-to-r from-red-700 to-rose-800'
          : 'bg-slate-900 border-b border-slate-800'
      }`}>
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
            <Bus className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="text-[10px] font-bold tracking-widest uppercase text-slate-400">
              Electronic Boarding Pass
            </div>
            <h2 className="text-xl font-extrabold text-white tracking-tight">
              {booking.operator_name || 'NexBus Premier Travels'}
            </h2>
            <div className="text-xs text-slate-300 font-medium">
              {booking.bus_model} (<span className="font-mono text-white font-semibold">{booking.bus_number}</span>)
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">PNR Reference</div>
          <div className="text-2xl font-black tracking-wider font-mono text-brand-400">{booking.pnr}</div>
          <div className="mt-1">
            <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-3 py-0.5 rounded-full ${
              isCancelled
                ? 'bg-red-950/80 text-red-200 border border-red-800'
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
            }`}>
              {isCancelled ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              {booking.status}
            </span>
          </div>
        </div>
      </div>

      {/* Main Journey Section */}
      <div className="p-6 sm:p-8 space-y-6">
        {/* Route Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-150 gap-4">
          <div>
            <div className="text-[10px] font-bold text-brand-600 uppercase tracking-wider mb-1">Departure</div>
            <div className="text-2xl font-black text-slate-900">{booking.source_city}</div>
            <div className="text-sm font-bold text-slate-700 font-mono">
              {depDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div className="text-xs text-slate-500 font-medium">
              {depDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
            {booking.boarding_stop_name && (
              <div className="mt-2 text-xs font-semibold text-slate-700 flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/80">
                <MapPin className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                <span>Pickup: <strong>{booking.boarding_stop_name}</strong></span>
              </div>
            )}
          </div>

          <div className="flex flex-col items-center justify-center my-2 sm:my-0">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Direct Transit</div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full border-2 border-brand-600 bg-white"></span>
              <div className="w-20 sm:w-28 border-t-2 border-dashed border-slate-300"></div>
              <Bus className="w-4 h-4 text-brand-600" />
              <div className="w-20 sm:w-28 border-t-2 border-dashed border-slate-300"></div>
              <span className="w-2.5 h-2.5 rounded-full bg-brand-600"></span>
            </div>
            <div className="text-xs font-semibold text-slate-500 mt-1">
              {booking.distance_km ? `${booking.distance_km} km` : 'Express Highway'}
            </div>
          </div>

          <div className="sm:text-right">
            <div className="text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">Arrival</div>
            <div className="text-2xl font-black text-slate-900">{booking.destination_city}</div>
            <div className="text-sm font-bold text-slate-700 font-mono">
              {arrDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div className="text-xs text-slate-500 font-medium">
              {arrDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
            {booking.dropping_stop_name && (
              <div className="mt-2 text-xs font-semibold text-slate-700 flex items-center sm:justify-end gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/80">
                <MapPin className="w-3.5 h-3.5 text-slate-700 shrink-0" />
                <span>Drop: <strong>{booking.dropping_stop_name}</strong></span>
              </div>
            )}
          </div>
        </div>

        {/* Passenger Manifest Table */}
        <div>
          <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-3">
            Confirmed Passenger Manifest ({booking.passengers?.length || 0})
          </h3>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600 uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-4">Seat Berth</th>
                  <th className="py-2.5 px-4">Passenger Name</th>
                  <th className="py-2.5 px-4">Age / Gender</th>
                  <th className="py-2.5 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {(booking.passengers || []).map((p, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-mono font-bold text-brand-600">
                      Seat {p.seat_number}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">{p.passenger_name}</td>
                    <td className="py-3 px-4 text-slate-600">
                      {p.passenger_age} yrs • {p.passenger_gender}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        isCancelled
                          ? 'bg-red-100 text-red-700'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {booking.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Fare & Refund Breakdown (if cancelled) */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div>
            <div className="text-slate-500 font-medium">Total Ticket Value</div>
            <div className="text-xl font-black text-slate-900 font-mono">
              ₹{Math.round(booking.total_fare)}
            </div>
          </div>

          {isCancelled && (
            <div className="text-right">
              <div className="text-slate-500 font-medium">Refund Amount Processed</div>
              <div className="text-xl font-black text-emerald-600 font-mono">
                ₹{Math.round(booking.refund_amount || 0)}
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                Deduction Fee: ₹{Math.round(booking.cancellation_fee || 0)}
              </div>
            </div>
          )}
        </div>

        {/* Boarding Guidelines & Policy */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-500 pt-2 border-t border-slate-150">
          <div className="flex items-start gap-2">
            <Clock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <span>Please arrive at your boarding point at least 20 minutes prior to departure.</span>
          </div>
          <div className="flex items-start gap-2">
            <Luggage className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <span>Cabin baggage: 7 kg allowed. Luggage compartment: up to 15 kg per passenger.</span>
          </div>
        </div>
      </div>

      {/* Ticket Footer Action Bar */}
      <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 no-print">
        <div className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Official Conductor Verified M-Ticket</span>
        </div>

        <div className="flex items-center gap-2">
          {onCancelClick && !isCancelled && (
            <button
              type="button"
              onClick={onCancelClick}
              className="px-4 py-2 border border-red-200 bg-white hover:bg-red-50 text-red-600 text-xs font-bold rounded-xl transition shadow-2xs"
            >
              Cancel Reservation
            </button>
          )}

          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print E-Ticket</span>
          </button>
        </div>
      </div>
    </div>
  );
}
