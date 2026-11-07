import React from 'react';
import { Bus, MapPin, Calendar, Clock, User, CheckCircle2, XCircle, Printer, QrCode, ShieldCheck } from 'lucide-react';

export default function TicketCard({ booking, onCancelClick }) {
  if (!booking) return null;

  const isCancelled = booking.status === 'CANCELLED';
  const depDate = new Date(booking.departure_time);
  const arrDate = new Date(booking.arrival_time);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden max-w-3xl mx-auto ticket-container">
      {/* Top Banner */}
      <div className={`p-6 text-white flex flex-wrap items-center justify-between gap-4 ${
        isCancelled ? 'bg-gradient-to-r from-red-600 to-rose-700' : 'bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
            <Bus className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="text-xs font-semibold tracking-wider uppercase text-blue-200">
              Official Electronic Boarding Pass
            </span>
            <h2 className="text-xl font-bold">{booking.operator_name || 'Algions Express Travels'}</h2>
            <div className="text-xs text-white/80">{booking.bus_model} ({booking.bus_number})</div>
          </div>
        </div>

        <div className="text-right">
          <div className="text-xs font-medium text-white/80 uppercase">PNR / Ticket Ref</div>
          <div className="text-2xl font-black tracking-wider font-mono">{booking.pnr}</div>
          <div className="mt-1">
            <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full ${
              isCancelled ? 'bg-red-900/60 text-red-200' : 'bg-emerald-500/30 text-emerald-100 border border-emerald-400/40'
            }`}>
              {isCancelled ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              {booking.status}
            </span>
          </div>
        </div>
      </div>

      {/* Main Journey Section */}
      <div className="p-6 md:p-8 space-y-6">
        {/* Route Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200 gap-4">
          <div>
            <div className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">Departure</div>
            <div className="text-2xl font-black text-slate-900">{booking.source_city}</div>
            <div className="text-sm font-semibold text-slate-700">
              {depDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div className="text-xs text-slate-500">
              {depDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
            {booking.boarding_stop_name && (
              <div className="mt-2 text-xs font-medium text-slate-600 flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-md">
                <MapPin className="w-3.5 h-3.5 text-blue-600" />
                Boarding: {booking.boarding_stop_name}
              </div>
            )}
          </div>

          <div className="flex flex-col items-center justify-center my-2 sm:my-0">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-1">Direct Transit</div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full border-2 border-blue-600 bg-white"></span>
              <div className="w-24 sm:w-32 border-t-2 border-dashed border-slate-300"></div>
              <Bus className="w-4 h-4 text-blue-600" />
              <div className="w-24 sm:w-32 border-t-2 border-dashed border-slate-300"></div>
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
            </div>
            <div className="text-xs font-medium text-slate-500 mt-1">{booking.distance_km ? `${booking.distance_km} km` : 'Express'}</div>
          </div>

          <div className="sm:text-right">
            <div className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">Arrival Destination</div>
            <div className="text-2xl font-black text-slate-900">{booking.destination_city}</div>
            <div className="text-sm font-semibold text-slate-700">
              {arrDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div className="text-xs text-slate-500">
              {arrDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
            {booking.dropping_stop_name && (
              <div className="mt-2 text-xs font-medium text-slate-600 flex items-center sm:justify-end gap-1 bg-slate-100 px-2 py-1 rounded-md">
                <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                Drop: {booking.dropping_stop_name}
              </div>
            )}
          </div>
        </div>

        {/* Passenger Manifest Breakdown */}
        <div>
          <h4 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-2">
            <User className="w-4 h-4 text-blue-600" />
            Passenger & Seat Manifest
          </h4>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Seat No.</th>
                  <th className="py-2.5 px-4">Passenger Name</th>
                  <th className="py-2.5 px-4">Age / Gender</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4 text-right">Fare</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {(booking.passengers || []).map((p, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 font-bold text-blue-600 font-mono text-sm">{p.seat_number}</td>
                    <td className="py-2.5 px-4 font-semibold text-slate-900">{p.passenger_name}</td>
                    <td className="py-2.5 px-4 text-slate-500">{p.passenger_age} yrs • {p.passenger_gender}</td>
                    <td className="py-2.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        p.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right font-medium">₹{Math.round(p.seat_fare)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Contact Info & Fare Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Primary Passenger Contact</div>
            <div className="text-sm font-bold text-slate-800">{booking.primary_contact_name}</div>
            <div className="text-xs text-slate-600">{booking.primary_contact_phone} • {booking.primary_contact_email}</div>
            <div className="text-[11px] text-slate-400 mt-1">Booked on: {new Date(booking.created_at).toLocaleString()}</div>
          </div>

          <div className="md:text-right flex flex-col justify-center">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Total Paid Amount</div>
            <div className="text-2xl font-black text-blue-600 font-mono">₹{Math.round(booking.total_fare)}</div>
            <div className="text-xs text-emerald-600 font-medium flex items-center md:justify-end gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> All taxes & passenger insurance included
            </div>
          </div>
        </div>

        {/* Cancellation / Refund Information if Cancelled */}
        {isCancelled && booking.refunds && booking.refunds.length > 0 && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs space-y-1 text-red-900">
            <div className="font-bold flex items-center gap-1.5 text-sm text-red-700">
              <XCircle className="w-4 h-4" /> Cancellation & Refund Details
            </div>
            <div>Booking Cancelled At: {new Date(booking.cancelled_at).toLocaleString()}</div>
            <div>Deducted Cancellation Fee: ₹{Math.round(booking.refunds[0].cancellation_fee)}</div>
            <div className="font-bold text-emerald-700">
              Refund Amount Processed: ₹{Math.round(booking.refunds[0].refund_amount)} (Status: {booking.refunds[0].status})
            </div>
          </div>
        )}

        {/* QR Code & Actions */}
        <div className="flex flex-wrap items-center justify-between pt-4 border-t border-slate-200 gap-4 no-print">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center border border-slate-300">
              <QrCode className="w-8 h-8 text-slate-800" />
            </div>
            <div className="text-xs text-slate-500">
              <div className="font-semibold text-slate-700">Digital Gate Verification</div>
              <div>Show QR / PNR to the conductor during boarding</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              type="button"
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition shadow-xs"
            >
              <Printer className="w-4 h-4" /> Print / Save PDF
            </button>
            {!isCancelled && onCancelClick && (
              <button
                onClick={onCancelClick}
                type="button"
                className="flex items-center gap-1.5 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-bold transition shadow-xs"
              >
                Cancel Booking
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
