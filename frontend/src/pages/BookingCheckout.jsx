import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bus, User, MapPin, CreditCard, ShieldCheck, AlertCircle, ArrowLeft, CheckCircle2, Lock } from 'lucide-react';
import { bookingsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function BookingCheckout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { trip, selectedSeats = [], seatObjs = [] } = location.state || {};

  if (!trip || selectedSeats.length === 0) {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 bg-white rounded-3xl border border-slate-200 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">No Trip Selected</h2>
        <p className="text-xs text-slate-500">Please search for a trip and choose available seats first.</p>
        <button
          onClick={() => navigate('/')}
          className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition"
        >
          Go to Bus Search
        </button>
      </div>
    );
  }

  // Pre-fill passenger state for each selected seat
  const [passengers, setPassengers] = useState(() =>
    selectedSeats.map((seatNum, idx) => ({
      seat_number: seatNum,
      passenger_name: idx === 0 && user?.name ? user.name : '',
      passenger_age: 28,
      passenger_gender: 'MALE',
    }))
  );

  // Boarding & Dropping stops
  const boardingStops = (trip.stops || []).filter(s => s.stop_type === 'BOARDING' || s.stop_type === 'BOTH');
  const droppingStops = (trip.stops || []).filter(s => s.stop_type === 'DROPPING' || s.stop_type === 'BOTH');

  const [boardingStopId, setBoardingStopId] = useState(boardingStops[0]?.id || null);
  const [droppingStopId, setDroppingStopId] = useState(droppingStops[0]?.id || null);

  // Primary Contact Info
  const [contactName, setContactName] = useState(user?.name || '');
  const [contactEmail, setContactEmail] = useState(user?.email || '');
  const [contactPhone, setContactPhone] = useState(user?.phone || '+91 98765 43210');

  // Mock Payment
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [submitting, setSubmitting] = useState(false);
  const [conflictError, setConflictError] = useState('');

  const totalFare = seatObjs.reduce((sum, s) => sum + Number(s.fare), 0);

  const handlePassengerChange = (index, field, value) => {
    const updated = [...passengers];
    updated[index][field] = value;
    setPassengers(updated);
  };

  const handleConfirmBooking = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setConflictError('');

    try {
      const payload = {
        trip_id: trip.id,
        selected_seats: selectedSeats,
        passengers: passengers.map(p => ({
          ...p,
          passenger_age: parseInt(p.passenger_age, 10),
        })),
        primary_contact_name: contactName,
        primary_contact_email: contactEmail,
        primary_contact_phone: contactPhone,
        boarding_stop_id: boardingStopId ? parseInt(boardingStopId, 10) : null,
        dropping_stop_id: droppingStopId ? parseInt(droppingStopId, 10) : null,
        idempotency_key: `booking-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        payment_method: paymentMethod,
      };

      const res = await bookingsApi.create(payload);

      if (res.success) {
        navigate('/confirmation', { state: { booking: res.data } });
      }
    } catch (err) {
      console.error('Booking submission error:', err);
      if (err.status === 409) {
        // Seat collision! Acceptance Test 2 verification
        setConflictError(err.message || 'Seat Collision: One or more selected seats were booked by another user. Please choose alternative seats.');
      } else {
        setConflictError(err.message || 'Failed to confirm booking. Please review your details.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back button & Header */}
      <div>
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition mb-3"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Seat Selection
        </button>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Review & Confirm Booking</h1>
        <p className="text-xs text-slate-500">Provide passenger details and complete the mock transaction.</p>
      </div>

      {/* Seat Collision / Conflict Alert */}
      {conflictError && (
        <div className="p-4 bg-red-50 border-2 border-red-300 rounded-2xl flex items-start gap-3 text-red-900 animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
          <div className="space-y-1">
            <h4 className="font-bold text-sm">Seat Allocation Collision</h4>
            <p className="text-xs">{conflictError}</p>
            <button
              onClick={() => navigate(-1)}
              className="mt-2 inline-block px-3 py-1 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700"
            >
              Choose Alternate Available Seats
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleConfirmBooking} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Form Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Boarding and Dropping Stops */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-600" />
              Boarding & Dropping Points
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Boarding Point ({trip.source_city})
                </label>
                <select
                  value={boardingStopId || ''}
                  onChange={(e) => setBoardingStopId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  required
                >
                  {boardingStops.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.stop_name} (+{s.time_offset_mins}m)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Dropping Point ({trip.destination_city})
                </label>
                <select
                  value={droppingStopId || ''}
                  onChange={(e) => setDroppingStopId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  required
                >
                  {droppingStops.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.stop_name} (+{s.time_offset_mins}m)
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Passenger Information */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <User className="w-4 h-4 text-blue-600" />
              Passenger Manifest Details ({selectedSeats.length} Seats)
            </h3>

            {passengers.map((p, idx) => (
              <div key={p.seat_number} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                  <span>Passenger #{idx + 1}</span>
                  <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 rounded-full font-mono">
                    Seat: {p.seat_number}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  <div className="sm:col-span-6">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Verma"
                      value={p.passenger_name}
                      onChange={(e) => handlePassengerChange(idx, 'passenger_name', e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Age</label>
                    <input
                      type="number"
                      required
                      min="1"
                      max="110"
                      value={p.passenger_age}
                      onChange={(e) => handlePassengerChange(idx, 'passenger_age', e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Gender</label>
                    <select
                      value={p.passenger_gender}
                      onChange={(e) => handlePassengerChange(idx, 'passenger_gender', e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    >
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Primary Contact Details */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Ticket Delivery & Contact Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Contact Name</label>
                <input
                  type="text"
                  required
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Mobile Phone</label>
                <input
                  type="text"
                  required
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>
          </div>

          {/* Simulated Payment Method */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-blue-600" />
              Payment Gateway Simulation
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: 'UPI', label: 'UPI / QR Code', desc: 'Google Pay, PhonePe, Paytm' },
                { id: 'CARD', label: 'Credit / Debit Card', desc: 'Visa, Mastercard, RuPay' },
                { id: 'NETBANKING', label: 'Net Banking', desc: 'HDFC, SBI, ICICI, Axis' },
              ].map(opt => (
                <div
                  key={opt.id}
                  onClick={() => setPaymentMethod(opt.id)}
                  className={`p-3 rounded-2xl border-2 cursor-pointer transition ${
                    paymentMethod === opt.id
                      ? 'border-blue-600 bg-blue-50/50 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="font-bold text-xs text-slate-900">{opt.label}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{opt.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Summary Column */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6 sticky top-24">
            <h3 className="font-bold text-slate-900 text-sm pb-3 border-b border-slate-100">
              Booking Summary
            </h3>

            <div>
              <div className="text-xs font-bold text-slate-900">{trip.operator_name}</div>
              <div className="text-xs text-slate-500">{trip.bus_model}</div>
              <div className="text-sm font-black text-slate-800 mt-2">
                {trip.source_city} → {trip.destination_city}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Departure: {new Date(trip.departure_time).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Selected Seats:</span>
                <span className="font-bold text-slate-900 font-mono">{selectedSeats.join(', ')}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Passenger Count:</span>
                <span className="font-bold text-slate-900">{selectedSeats.length} Persons</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Base Seat Fare:</span>
                <span>₹{totalFare}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>GST & Passenger Levy:</span>
                <span>₹0 (Included)</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-sm">
                <span className="font-bold text-slate-900">Total Payable:</span>
                <span className="text-xl font-black text-blue-600 font-mono">₹{totalFare}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white font-bold text-sm rounded-2xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Securing Seats & Locking...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Confirm & Secure Booking</span>
                </>
              )}
            </button>

            <div className="text-[11px] text-slate-400 text-center leading-relaxed">
              Protected by PostgreSQL ACID Pessimistic Row Locking. Duplicate bookings for the same seat are strictly prevented.
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

