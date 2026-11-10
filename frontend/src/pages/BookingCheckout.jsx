import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Bus, User, MapPin, CreditCard, ShieldCheck, AlertCircle, ArrowLeft,
  CheckCircle2, Lock, Tag, QrCode, Phone, Mail, Check, Shield, Clock
} from 'lucide-react';
import { bookingsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function BookingCheckout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { trip, selectedSeats = [], seatObjs = [] } = location.state || {};

  if (!trip || selectedSeats.length === 0) {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 bg-white rounded-2xl border border-slate-200 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">No Trip Selected</h2>
        <p className="text-xs text-slate-500">Please search for a trip and select available seats first.</p>
        <button
          onClick={() => navigate('/')}
          className="px-5 py-2.5 bg-brand-600 text-white rounded-xl text-xs font-bold hover:bg-brand-700 transition"
        >
          Return to Bus Search
        </button>
      </div>
    );
  }

  // Pre-fill passenger state for each selected seat
  const [passengers, setPassengers] = useState(() =>
    selectedSeats.map((seatNum, idx) => ({
      seat_number: seatNum,
      passenger_name: idx === 0 && user?.name ? user.name : '',
      passenger_age: 26,
      passenger_gender: 'MALE',
    }))
  );

  // Boarding & Dropping stops
  const boardingStops = (trip.stops || []).filter(s => s.stop_type === 'BOARDING' || s.stop_type === 'BOTH');
  const droppingStops = (trip.stops || []).filter(s => s.stop_type === 'DROPPING' || s.stop_type === 'BOTH');

  const [boardingStopId, setBoardingStopId] = useState(boardingStops[0]?.id || null);
  const [droppingStopId, setDroppingStopId] = useState(droppingStops[0]?.id || null);

  // Primary Contact Info
  const [contactName, setContactName] = useState(user?.name || 'John Doe');
  const [contactEmail, setContactEmail] = useState(user?.email || 'user@example.com');
  const [contactPhone, setContactPhone] = useState(user?.phone || '+91 98765 43210');

  // Coupon / Promo Code State
  const [couponCode, setCouponCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [couponMessage, setCouponMessage] = useState('');

  // Payment Method
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isCollisionError, setIsCollisionError] = useState(false);

  const rawFare = seatObjs.reduce((sum, s) => sum + Number(s.fare), 0);
  const gstAmount = Math.round(rawFare * 0.05); // 5% GST
  const finalFare = Math.max(0, rawFare + gstAmount - appliedDiscount);

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    const code = couponCode.trim().toUpperCase();
    if (code === 'NEXFIRST') {
      const discount = Math.min(150, rawFare);
      setAppliedDiscount(discount);
      setCouponMessage(`Coupon NEXFIRST applied: ₹${discount} discount!`);
    } else if (code === 'SAVE10') {
      const discount = Math.round(rawFare * 0.10);
      setAppliedDiscount(discount);
      setCouponMessage(`Coupon SAVE10 applied: 10% discount (₹${discount})!`);
    } else {
      setAppliedDiscount(0);
      setCouponMessage('Invalid coupon code. Try NEXFIRST or SAVE10.');
    }
  };

  const handlePassengerChange = (index, field, value) => {
    const updated = [...passengers];
    updated[index][field] = value;
    setPassengers(updated);
  };

  const handleConfirmBooking = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage('');
    setIsCollisionError(false);

    try {
      const primaryName = (contactName || passengers[0]?.passenger_name || user?.name || 'Primary Traveler').trim();
      const primaryEmail = (contactEmail || user?.email || 'user@example.com').trim();
      const primaryPhone = (contactPhone || user?.phone || '+91 98765 43210').trim();

      const payload = {
        trip_id: Number(trip.id),
        selected_seats: selectedSeats,
        passengers: passengers.map((p, idx) => {
          const pName = (p.passenger_name || '').trim() || (idx === 0 ? primaryName : `Passenger ${idx + 1}`);
          const pAge = Number(p.passenger_age) || 26;
          const pGender = p.passenger_gender || 'MALE';
          return {
            seat_number: String(p.seat_number),
            passenger_name: pName,
            name: pName,
            passenger_age: pAge,
            age: pAge,
            passenger_gender: pGender,
            gender: pGender,
          };
        }),
        boarding_stop_id: boardingStopId ? Number(boardingStopId) : null,
        dropping_stop_id: droppingStopId ? Number(droppingStopId) : null,
        primary_contact_name: primaryName,
        contact_name: primaryName,
        primary_contact_email: primaryEmail,
        contact_email: primaryEmail,
        primary_contact_phone: primaryPhone,
        contact_phone: primaryPhone,
        payment_method: paymentMethod || 'UPI',
        discount_amount: Number(appliedDiscount) || 0,
      };

      const res = await bookingsApi.create(payload);
      if (res.success) {
        navigate('/confirmation', { state: { booking: res.data } });
      }
    } catch (err) {
      console.error('Booking submission error:', err);
      const is409 = err.status === 409 || err.message?.toLowerCase().includes('already booked') || err.message?.toLowerCase().includes('collision');
      setIsCollisionError(is409);

      let msg = err.message || 'Failed to complete booking. Please verify your details.';
      try {
        if (typeof msg === 'string' && (msg.startsWith('[') || msg.startsWith('{'))) {
          const parsed = JSON.parse(msg);
          if (Array.isArray(parsed)) {
            msg = parsed.map(item => `${item.path?.join('.') || 'Field'}: ${item.message}`).join('; ');
          }
        }
      } catch (_) {}

      if (is409) {
        msg = 'One or more of your selected berths were just confirmed by another passenger during checkout. Please return to the seat map and select another available berth.';
      }

      setErrorMessage(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Back button and Step Breadcrumbs */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Seat Selection</span>
        </button>

        <div className="flex items-center gap-2 text-xs font-bold">
          <span className="text-slate-400">1. Select Seats</span>
          <span className="text-slate-300">/</span>
          <span className="text-brand-600 bg-brand-50 px-2.5 py-0.5 rounded-full border border-brand-200">
            2. Passenger Details
          </span>
          <span className="text-slate-300">/</span>
          <span className="text-slate-400">3. Boarding Pass</span>
        </div>
      </div>

      {errorMessage && (
        <div className={`p-4 rounded-2xl border flex items-start gap-3 text-xs ${
          isCollisionError
            ? 'bg-amber-50 border-amber-300 text-amber-900'
            : 'bg-red-50 border-red-200 text-red-900'
        }`}>
          <AlertCircle className={`w-5 h-5 shrink-0 mt-0.5 ${isCollisionError ? 'text-amber-600' : 'text-red-600'}`} />
          <div>
            <div className="font-bold text-sm">
              {isCollisionError
                ? 'Seat Reservation Collision (ACID Protection)'
                : 'Unable to Confirm Reservation'}
            </div>
            <div className={`mt-0.5 ${isCollisionError ? 'text-amber-800' : 'text-red-700'}`}>
              {errorMessage}
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleConfirmBooking} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Form Column */}
        <div className="lg:col-span-7 space-y-6">
          {/* Section 1: Boarding & Dropping Points */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <MapPin className="w-4 h-4 text-brand-600" />
              <span>1. Boarding & Dropping Stations</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-600 mb-1.5">Select Boarding Point</label>
                <select
                  value={boardingStopId || ''}
                  onChange={(e) => setBoardingStopId(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
                  required
                >
                  {boardingStops.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.stop_name} ({s.scheduled_time || 'Depot'})
                    </option>
                  ))}
                  {boardingStops.length === 0 && <option value="">Main Central Bus Stand</option>}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1.5">Select Dropping Point</label>
                <select
                  value={droppingStopId || ''}
                  onChange={(e) => setDroppingStopId(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
                  required
                >
                  {droppingStops.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.stop_name} ({s.scheduled_time || 'Terminal'})
                    </option>
                  ))}
                  {droppingStops.length === 0 && <option value="">Main Central Drop Station</option>}
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Passenger Information */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <User className="w-4 h-4 text-brand-600" />
                <span>2. Passenger Details ({passengers.length} Passenger{passengers.length > 1 ? 's' : ''})</span>
              </h2>
              <span className="text-[11px] text-slate-400">Government ID required at boarding</span>
            </div>

            <div className="space-y-4">
              {passengers.map((p, index) => (
                <div key={p.seat_number} className="p-4 bg-slate-50/80 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-800 text-xs flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-brand-600 text-white rounded font-mono text-[11px]">
                        Seat {p.seat_number}
                      </span>
                      <span>Passenger {index + 1}</span>
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">Standard Fare</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs">
                    <div className="sm:col-span-6">
                      <label className="block font-bold text-slate-600 mb-1">Full Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. John Doe"
                        value={p.passenger_name}
                        onChange={(e) => handlePassengerChange(index, 'passenger_name', e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2.5 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block font-bold text-slate-600 mb-1">Age</label>
                      <input
                        type="number"
                        min="1"
                        max="120"
                        required
                        value={p.passenger_age}
                        onChange={(e) => handlePassengerChange(index, 'passenger_age', e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2.5 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
                      />
                    </div>

                    <div className="sm:col-span-4">
                      <label className="block font-bold text-slate-600 mb-1">Gender</label>
                      <div className="flex rounded-lg border border-slate-200 bg-white p-0.5">
                        {['MALE', 'FEMALE', 'OTHER'].map(g => (
                          <button
                            key={g}
                            type="button"
                            onClick={() => handlePassengerChange(index, 'passenger_gender', g)}
                            className={`flex-1 py-2 text-[10px] font-bold rounded-md transition ${
                              p.passenger_gender === g
                                ? 'bg-slate-900 text-white'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            {g === 'MALE' ? 'Male' : g === 'FEMALE' ? 'Female' : 'Other'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Contact Details */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Mail className="w-4 h-4 text-brand-600" />
              <span>3. Contact Information for E-Ticket & Live SMS</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-600 mb-1.5">Primary Contact Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1.5">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1.5">Mobile Phone Number</label>
                <input
                  type="tel"
                  required
                  placeholder="+91 98765 43210"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Payment Simulation */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-brand-600" />
                <span>4. Payment Method</span>
              </h2>
              <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> 100% Secure Sandbox
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              {[
                { id: 'UPI', label: 'Instant UPI', desc: 'GPay, PhonePe' },
                { id: 'CARD', label: 'Debit / Card', desc: 'Visa, Mastercard' },
                { id: 'NETBANKING', label: 'Net Banking', desc: 'All Major Banks' },
                { id: 'CASH', label: 'Pay at Bus', desc: 'Cash on Boarding' },
              ].map(method => (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setPaymentMethod(method.id)}
                  className={`p-3 rounded-xl border text-left transition ${
                    paymentMethod === method.id
                      ? 'border-brand-600 bg-brand-50/50 shadow-2xs ring-1 ring-brand-500'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="font-bold text-slate-900">{method.label}</div>
                  <div className="text-[10px] text-slate-500">{method.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Sticky Summary Column */}
        <div className="lg:col-span-5 space-y-5 sticky top-24">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            <div className="border-b border-slate-100 pb-4">
              <span className="text-[10px] font-bold text-brand-600 uppercase tracking-wider">
                Booking Summary
              </span>
              <h3 className="text-lg font-black text-slate-900 mt-0.5">{trip.operator_name}</h3>
              <p className="text-xs text-slate-500">{trip.bus_model} ({trip.bus_number})</p>
            </div>

            {/* Route & Timing Card */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-800">{trip.source_city}</span>
                <span className="font-mono text-slate-500">→</span>
                <span className="font-bold text-slate-800">{trip.destination_city}</span>
              </div>
              <div className="flex justify-between items-center text-[11px] text-slate-500">
                <span>{new Date(trip.departure_time).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                <span className="font-mono">{new Date(trip.departure_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} Departure</span>
              </div>
            </div>

            {/* Selected Seats Badges */}
            <div>
              <div className="text-xs font-bold text-slate-600 mb-1.5">Allocated Berths</div>
              <div className="flex flex-wrap gap-1.5">
                {selectedSeats.map(s => (
                  <span key={s} className="px-2.5 py-1 bg-slate-900 text-white font-mono text-xs font-bold rounded-lg">
                    Seat {s}
                  </span>
                ))}
              </div>
            </div>

            {/* Promo Code Box */}
            <div className="pt-2 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-brand-600" /> Have a Coupon Code?
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="NEXFIRST or SAVE10"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 uppercase focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shrink-0"
                >
                  Apply
                </button>
              </div>
              {couponMessage && (
                <p className={`text-[11px] mt-1.5 font-semibold ${
                  appliedDiscount > 0 ? 'text-emerald-600' : 'text-red-500'
                }`}>
                  {couponMessage}
                </p>
              )}
            </div>

            {/* Fare Breakdown */}
            <div className="pt-3 border-t border-slate-100 space-y-2 text-xs font-medium">
              <div className="flex justify-between text-slate-600">
                <span>Base Fare ({selectedSeats.length} Seats)</span>
                <span className="font-mono">₹{Math.round(rawFare)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Integrated GST (5%)</span>
                <span className="font-mono">₹{gstAmount}</span>
              </div>
              {appliedDiscount > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>Promo Discount Applied</span>
                  <span className="font-mono">- ₹{appliedDiscount}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-extrabold text-slate-900 pt-3 border-t border-slate-200">
                <span>Total Amount</span>
                <span className="font-mono text-xl text-brand-600">₹{Math.round(finalFare)}</span>
              </div>
            </div>

            {/* Confirm & Book CTA */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-md shadow-brand-600/20 transition flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Securing Seat Lock & Confirming...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Confirm Booking & Generate Ticket</span>
                </>
              )}
            </button>

            <div className="text-[11px] text-slate-400 text-center leading-relaxed flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>ACID Row Lock ensures absolute exclusivity</span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
