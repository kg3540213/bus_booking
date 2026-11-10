import React, { useState, useEffect } from 'react';
import {
  Ticket, Calendar, Clock, MapPin, AlertCircle, XCircle, CheckCircle2,
  ChevronRight, RefreshCw, ArrowRight, ShieldCheck, Filter
} from 'lucide-react';
import { bookingsApi } from '../services/api';
import TicketCard from '../components/TicketCard';

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Selected booking for detailed view modal
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Cancellation Modal State
  const [cancelModalBooking, setCancelModalBooking] = useState(null);
  const [cancellationQuote, setCancellationQuote] = useState(null);
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelSuccessMsg, setCancelSuccessMsg] = useState('');

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await bookingsApi.getMyBookings();
      if (res.success) {
        setBookings(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleViewTicket = async (pnr) => {
    setLoadingDetail(true);
    try {
      const res = await bookingsApi.getByPNR(pnr);
      if (res.success) {
        setSelectedBooking(res.data);
      }
    } catch (err) {
      alert('Failed to load ticket details: ' + err.message);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleOpenCancelModal = async (booking) => {
    setCancelModalBooking(booking);
    setLoadingQuote(true);
    setCancellationQuote(null);
    setCancelSuccessMsg('');

    try {
      const res = await bookingsApi.getCancellationQuote(booking.id);
      if (res.success) {
        setCancellationQuote(res.data);
      }
    } catch (err) {
      alert('Error calculating cancellation refund quote: ' + err.message);
      setCancelModalBooking(null);
    } finally {
      setLoadingQuote(false);
    }
  };

  const handleExecuteCancellation = async () => {
    if (!cancelModalBooking) return;
    setCancelling(true);
    try {
      const res = await bookingsApi.cancel(cancelModalBooking.id);
      if (res.success) {
        setCancelSuccessMsg(`Booking cancelled successfully. Refund of ₹${res.data.refund.refund_amount} processed.`);
        fetchBookings();
        if (selectedBooking && selectedBooking.id === cancelModalBooking.id) {
          handleViewTicket(cancelModalBooking.pnr);
        }
      }
    } catch (err) {
      alert('Failed to cancel booking: ' + err.message);
    } finally {
      setCancelling(false);
    }
  };

  const filteredBookings = bookings.filter(b => {
    if (statusFilter === 'CONFIRMED') return b.status === 'CONFIRMED';
    if (statusFilter === 'CANCELLED') return b.status === 'CANCELLED';
    return true;
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            My Reservations & Digital Passes
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Access electronic boarding passes, print conductor manifests, or execute automated policy-based refunds.
          </p>
        </div>

        <button
          onClick={fetchBookings}
          className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-2 transition shadow-2xs"
        >
          <RefreshCw className="w-3.5 h-3.5 text-brand-600" />
          <span>Refresh Bookings</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-2">
        {[
          { id: 'ALL', label: `All Tickets (${bookings.length})` },
          { id: 'CONFIRMED', label: `Confirmed (${bookings.filter(b => b.status === 'CONFIRMED').length})` },
          { id: 'CANCELLED', label: `Cancelled (${bookings.filter(b => b.status === 'CANCELLED').length})` },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
              statusFilter === tab.id
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="p-12 bg-white rounded-2xl border border-slate-200 text-center space-y-3">
          <div className="w-10 h-10 border-3 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-semibold text-slate-600">Retrieving verified travel records...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-red-50 rounded-2xl border border-red-200 text-center space-y-2">
          <AlertCircle className="w-8 h-8 text-brand-600 mx-auto" />
          <h3 className="font-bold text-red-900 text-sm">Unable to Load Bookings</h3>
          <p className="text-xs text-red-700">{error}</p>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="p-12 bg-white rounded-2xl border border-slate-200 text-center space-y-3">
          <Ticket className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-900 text-base">No Bookings Found in This View</h3>
          <p className="text-xs text-slate-500">You do not have any {statusFilter.toLowerCase()} reservations.</p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredBookings.map((b) => {
            const isCancelled = b.status === 'CANCELLED';
            const depDate = new Date(b.departure_time);

            return (
              <div
                key={b.id}
                className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 hover:border-slate-300 transition shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-5"
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-bold text-xs text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded border border-brand-200">
                      {b.pnr}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      isCancelled ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {b.status}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      Booked on {new Date(b.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <span>{b.source_city}</span>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                    <span>{b.destination_city}</span>
                  </div>

                  <div className="text-xs text-slate-500 flex flex-wrap items-center gap-3">
                    <span className="font-bold text-slate-800">{b.operator_name}</span>
                    <span>•</span>
                    <span>Seats: <strong className="font-mono text-slate-900">{(b.booked_seats || []).join(', ')}</strong></span>
                    <span>•</span>
                    <span>Departure: {depDate.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 self-end md:self-center">
                  <button
                    onClick={() => handleViewTicket(b.pnr)}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <Ticket className="w-3.5 h-3.5 text-slate-600" />
                    <span>View Pass</span>
                  </button>

                  {!isCancelled && (
                    <button
                      onClick={() => handleOpenCancelModal(b)}
                      className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-bold transition"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Ticket Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative w-full max-w-3xl my-8">
            <button
              onClick={() => setSelectedBooking(null)}
              className="absolute -top-3 -right-3 z-10 w-8 h-8 bg-slate-900 hover:bg-black text-white rounded-full flex items-center justify-center shadow-lg border border-slate-700 text-xs font-bold"
            >
              ✕
            </button>
            <TicketCard
              booking={selectedBooking}
              onCancelClick={
                selectedBooking.status !== 'CANCELLED'
                  ? () => {
                      const b = bookings.find(item => item.id === selectedBooking.id);
                      if (b) handleOpenCancelModal(b);
                    }
                  : null
              }
            />
          </div>
        </div>
      )}

      {/* Cancellation Modal (Acceptance Test 4) */}
      {cancelModalBooking && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-bold text-brand-600 uppercase tracking-widest">
                  Live Refund Policy Engine
                </span>
                <h3 className="text-base font-extrabold text-slate-900 mt-0.5">
                  Cancel Reservation {cancelModalBooking.pnr}
                </h3>
              </div>
              <button
                onClick={() => setCancelModalBooking(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            {loadingQuote ? (
              <div className="py-8 text-center space-y-2">
                <div className="w-8 h-8 border-3 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-xs text-slate-500 font-semibold">Querying dynamic refund rules...</p>
              </div>
            ) : cancelSuccessMsg ? (
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <h4 className="font-bold text-emerald-950 text-sm">Cancellation Processed</h4>
                <p className="text-xs text-emerald-800">{cancelSuccessMsg}</p>
                <button
                  onClick={() => setCancelModalBooking(null)}
                  className="mt-3 px-5 py-2 bg-emerald-700 text-white rounded-xl text-xs font-bold"
                >
                  Done
                </button>
              </div>
            ) : cancellationQuote ? (
              <div className="space-y-4">
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1 text-xs">
                  <div className="text-slate-600 font-medium">Applied Cancellation Tier:</div>
                  <div className="font-bold text-slate-900">{cancellationQuote.quote.policyDescription}</div>
                  <div className="text-[11px] text-slate-500">
                    Time until departure: <strong>{cancellationQuote.quote.hoursBeforeDeparture} hours</strong>
                  </div>
                </div>

                <div className="divide-y divide-slate-100 text-xs">
                  <div className="py-2 flex justify-between text-slate-600">
                    <span>Original Booking Total:</span>
                    <span className="font-mono font-bold text-slate-900">₹{cancellationQuote.total_fare}</span>
                  </div>
                  <div className="py-2 flex justify-between text-red-600">
                    <span>Cancellation Fee ({cancellationQuote.quote.deductionPercentage}%):</span>
                    <span className="font-mono font-bold">-₹{cancellationQuote.quote.cancellationFee}</span>
                  </div>
                  <div className="py-2.5 flex justify-between items-center text-sm font-bold text-emerald-700 bg-emerald-50/70 p-2.5 rounded-lg">
                    <span>Estimated Refund:</span>
                    <span className="font-mono text-base font-extrabold">₹{cancellationQuote.quote.refundAmount}</span>
                  </div>
                </div>

                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-800 leading-relaxed">
                  ⚠️ <strong>Seat Release:</strong> Berths {(cancelModalBooking.booked_seats || []).join(', ')} will be immediately released back to live inventory for other passengers.
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={() => setCancelModalBooking(null)}
                    type="button"
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                  >
                    Keep Booking
                  </button>
                  <button
                    onClick={handleExecuteCancellation}
                    disabled={cancelling || !cancellationQuote.quote.canCancel}
                    type="button"
                    className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition"
                  >
                    {cancelling ? 'Processing...' : 'Confirm Cancellation'}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
