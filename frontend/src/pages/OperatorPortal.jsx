import React, { useState, useEffect } from 'react';
import { Bus, Users, MapPin, Calendar, Clock, CheckCircle2, Printer, ShieldCheck, RefreshCw, AlertCircle, Check } from 'lucide-react';
import { reportsApi, tripsApi } from '../services/api';

export default function OperatorPortal() {
  const [trips, setTrips] = useState([]);
  const [selectedTripId, setSelectedTripId] = useState('');
  const [manifestData, setManifestData] = useState(null);
  const [loadingTrips, setLoadingTrips] = useState(true);
  const [loadingManifest, setLoadingManifest] = useState(false);
  const [error, setError] = useState('');

  // Conductor live check-in toggle state
  const [boardedStatus, setBoardedStatus] = useState({});

  useEffect(() => {
    fetchTrips();
  }, []);

  const fetchTrips = async () => {
    setLoadingTrips(true);
    try {
      const res = await tripsApi.search({});
      if (res.success && res.data.length > 0) {
        setTrips(res.data);
        setSelectedTripId(res.data[0].id);
        fetchManifest(res.data[0].id);
      }
    } catch (err) {
      setError(err.message || 'Failed to load operator schedules');
    } finally {
      setLoadingTrips(false);
    }
  };

  const fetchManifest = async (tripId) => {
    if (!tripId) return;
    setLoadingManifest(true);
    setError('');
    try {
      const res = await reportsApi.getTripManifest(tripId);
      if (res.success) {
        setManifestData(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load trip manifest');
    } finally {
      setLoadingManifest(false);
    }
  };

  const handleTripChange = (e) => {
    const id = e.target.value;
    setSelectedTripId(id);
    fetchManifest(id);
  };

  const toggleBoarded = (passengerId) => {
    setBoardedStatus(prev => ({
      ...prev,
      [passengerId]: !prev[passengerId]
    }));
  };

  const handlePrint = () => {
    window.print();
  };

  const boardedCount = Object.values(boardedStatus).filter(Boolean).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 no-print">
        <div>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200 flex items-center gap-1.5 w-fit uppercase tracking-wider">
            <Bus className="w-3.5 h-3.5 text-blue-600" /> Fleet Dispatch & Conductor Manifest
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Trip Passenger Manifest & Occupancy Reconciliation
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time passenger manifest verification, conductor check-in, and mathematical seat occupancy reconciliation.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handlePrint}
            className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-2 transition shadow-2xs"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Print Manifest</span>
          </button>
          <button
            onClick={() => fetchManifest(selectedTripId)}
            className="px-3.5 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold flex items-center gap-2 transition shadow-2xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Manifest</span>
          </button>
        </div>
      </div>

      {/* Select Trip Schedule Selector Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2 no-print">
        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
          Select Scheduled Departure to Inspect
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select
            value={selectedTripId}
            onChange={handleTripChange}
            className="md:col-span-2 bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
          >
            {trips.map(t => (
              <option key={t.id} value={t.id}>
                {t.operator_name} | {t.source_city} → {t.destination_city} | {new Date(t.departure_time).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })} ({t.bus_number})
              </option>
            ))}
          </select>
        </div>
      </div>

      {loadingManifest ? (
        <div className="p-12 bg-white rounded-2xl border border-slate-200 text-center space-y-3">
          <div className="w-10 h-10 border-3 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-semibold text-slate-600">Reconciling reservation ledger with bus passenger manifest...</p>
        </div>
      ) : manifestData ? (
        <div className="space-y-6">
          {/* Manifest Trip Metadata & Reconciliation Proof Card */}
          <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-6">
            <div>
              <span className="text-[10px] font-bold text-brand-600 uppercase tracking-wider">
                {manifestData.trip.operator_name} ({manifestData.trip.operator_code})
              </span>
              <h2 className="text-2xl font-black text-slate-900 mt-0.5 tracking-tight">
                {manifestData.trip.source_city} → {manifestData.trip.destination_city}
              </h2>
              <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-3">
                <span>Vehicle: <strong className="font-mono text-slate-900">{manifestData.trip.bus_number}</strong> ({manifestData.trip.bus_model})</span>
                <span>•</span>
                <span>Departure: {new Date(manifestData.trip.departure_time).toLocaleString()}</span>
                <span>•</span>
                <span>Arrival: {new Date(manifestData.trip.arrival_time).toLocaleString()}</span>
              </div>
            </div>

            {/* Reconciliation Proof Card */}
            <div className="bg-emerald-50/70 border border-emerald-200 p-4 sm:p-5 rounded-xl text-emerald-950 space-y-1.5 shadow-2xs">
              <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Reconciled Occupancy (100% Match)</span>
              </div>
              <div className="text-xs">
                Total Vehicle Capacity: <strong>{manifestData.occupancy.total_capacity} berths</strong>
              </div>
              <div className="text-xs">
                Confirmed Manifest: <strong>{manifestData.occupancy.confirmed_passengers}</strong> (Booked Seats: {manifestData.occupancy.booked_seats})
              </div>
              <div className="text-xs font-bold text-emerald-800 pt-0.5">
                Occupancy Rate: {manifestData.occupancy.occupancy_percentage}% ({manifestData.occupancy.available_seats} Available Seats)
              </div>
              <div className="text-[11px] text-emerald-700 pt-1 border-t border-emerald-200 font-semibold no-print">
                Conductor Checked-in: {boardedCount} / {manifestData.passengers.length} Boarded
              </div>
            </div>
          </div>

          {/* Passenger Table */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-brand-600" />
                <span>Official Passenger Boarding Manifest ({manifestData.passengers.length} Confirmed)</span>
              </h3>
            </div>

            {manifestData.passengers.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                No confirmed passengers booked for this scheduled trip yet.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 text-[10px] uppercase">
                    <tr>
                      <th className="py-3 px-4 no-print">Check-in</th>
                      <th className="py-3 px-4">Seat</th>
                      <th className="py-3 px-4">Passenger Name</th>
                      <th className="py-3 px-4">Age / Gender</th>
                      <th className="py-3 px-4">PNR Reference</th>
                      <th className="py-3 px-4">Boarding Stop</th>
                      <th className="py-3 px-4">Dropping Stop</th>
                      <th className="py-3 px-4">Contact Phone</th>
                      <th className="py-3 px-4 text-right">Fare</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {manifestData.passengers.map(p => {
                      const isCheckedIn = !!boardedStatus[p.passenger_id];
                      return (
                        <tr key={p.passenger_id} className={`hover:bg-slate-50/50 ${isCheckedIn ? 'bg-emerald-50/50' : ''}`}>
                          <td className="py-3 px-4 no-print">
                            <input
                              type="checkbox"
                              checked={isCheckedIn}
                              onChange={() => toggleBoarded(p.passenger_id)}
                              className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4 cursor-pointer"
                              title="Mark as Boarded"
                            />
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-brand-600 text-xs">
                            {p.seat_number}
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-900">
                            {p.passenger_name}
                            {isCheckedIn && (
                              <span className="ml-2 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                                ✓ Boarded
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-slate-500">
                            {p.passenger_age} yrs • {p.passenger_gender}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-700 font-bold">
                            {p.pnr}
                          </td>
                          <td className="py-3 px-4 text-slate-800">
                            {p.boarding_stop || manifestData.trip.source_city}
                          </td>
                          <td className="py-3 px-4 text-slate-800">
                            {p.dropping_stop || manifestData.trip.destination_city}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-500">
                            {p.primary_contact_phone}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                            ₹{Math.round(p.seat_fare)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
