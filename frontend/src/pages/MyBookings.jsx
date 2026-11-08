import React, { useState, useEffect } from 'react';
import { Ticket, Calendar, Clock, MapPin, AlertCircle, XCircle, CheckCircle2, ChevronRight, RefreshCw, ArrowRight } from 'lucide-react';
import { bookingsApi } from '../services/api';
import TicketCard from '../components/TicketCard';

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
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
        // If currently viewing this ticket in modal, refresh it
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

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">My Bookings & Travel History</h1>
        <p className="text-xs text-slate-500">Manage your reservations, view electronic boarding passes, or process cancellations.</p>
      </div>

      {loading ? (
        <div className="p-12 bg-white rounded-3xl border border-slate-200 text-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-semibold text-slate-600">Loading your travel records...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-red-50 rounded-3xl border border-red-200 text-center space-y-2">
          <AlertCircle className="w-8 h-8 text-red-600 mx-auto" />
          <h3 className="font-bold text-red-900 text-sm">Unable to Load Bookings</h3>
          <p className="text-xs text-red-700">{error}</p>
        </div>
      ) : bookings.length === 0 ? (
        <div className="p-12 bg-white rounded-3xl border border-slate-200 text-center space-y-3">
          <Ticket className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-900 text-base">No Bookings Found</h3>
          <p className="text-xs text-slate-500">You haven't booked any trips yet. Explore our schedules to make a reservation.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => {
            const isCancelled = b.status === 'CANCELLED';
            const depDate = new Date(b.departure_time);

            return (
              <div
                key={b.id}
                className="bg-white p-6 rounded-3xl border border-slate-200 hover:border-slate-300 transition shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-bold text-sm text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-100">
                      {b.pnr}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                      isCancelled ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {b.status}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      Booked {new Date(b.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <span>{b.source_city}</span>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                    <span>{b.destination_city}</span>
                  </div>

                  <div className="text-xs text-slate-500 flex flex-wrap items-center gap-3">
                    <span className="font-semibold text-slate-700">{b.operator_name}</span>
                    <span>•</span>
                    <span>Seats: <strong className="font-mono text-slate-800">{(b.booked_seats || []).join(', ')}</strong></span>
                    <span>•</span>
                    <span>Departure: {depDate.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end md:self-center">
                  <button
                    onClick={() => handleViewTicket(b.pnr)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <Ticket className="w-3.5 h-3.5" /> View E-Ticket
                  </button>

                  {!isCancelled && (
                    <button
                      onClick={() => handleOpenCancelModal(b)}
                      className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-bold transition"
                    >
                      Cancel Booking
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
              className="absolute -top-3 -right-3 z-10 w-9 h-9 bg-slate-800 hover:bg-slate-900 text-white rounded-full flex items-center justify-center shadow-lg border border-slate-700 font-bold"
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
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-bold text-red-600 uppercase tracking-wider">Booking Cancellation</span>
                <h3 className="text-lg font-black text-slate-900 mt-0.5">Cancel Reservation {cancelModalBooking.pnr}</h3>
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
                <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-xs text-slate-500">Calculating refund quote from policy engine...</p>
              </div>
            ) : cancelSuccessMsg ? (
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <h4 className="font-bold text-emerald-950 text-sm">Cancellation Finalized</h4>
                <p className="text-xs text-emerald-800">{cancelSuccessMsg}</p>
                <button
                  onClick={() => setCancelModalBooking(null)}
                  className="mt-3 px-4 py-2 bg-emerald-700 text-white rounded-xl text-xs font-bold"
                >
                  Close Window
                </button>
              </div>
            ) : cancellationQuote ? (
              <div className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
                  <div className="text-slate-600 font-medium">Applied Cancellation Policy:</div>
                  <div className="font-bold text-slate-900">{cancellationQuote.quote.policyDescription}</div>
                  <div className="text-[11px] text-slate-500">
                    Hours until departure: <strong>{cancellationQuote.quote.hoursBeforeDeparture} hrs</strong>
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
                  <div className="py-2 flex justify-between items-center text-sm font-bold text-emerald-700 bg-emerald-50/50 p-2 rounded-xl">
                    <span>Refund Amount to Customer:</span>
                    <span className="font-mono text-base font-black">₹{cancellationQuote.quote.refundAmount}</span>
                  </div>
                </div>

                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-800 leading-relaxed">
                  ⚠️ Note: Cancelling will immediately release seat(s){' '}
                  <strong>{(cancelModalBooking.booked_seats || []).join(', ')}</strong> back into inventory for other passengers.
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
                    className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-xs"
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

