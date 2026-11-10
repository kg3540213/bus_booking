import React, { useState } from 'react';
import { Search, Ticket, AlertCircle, CheckCircle2, ShieldCheck, Bus } from 'lucide-react';
import { bookingsApi } from '../services/api';
import TicketCard from '../components/TicketCard';

export default function PNRLookup() {
  const [pnr, setPnr] = useState('PNR-NBX-984210');
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!pnr.trim()) return;

    setLoading(true);
    setError('');
    setBooking(null);

    try {
      const res = await bookingsApi.getByPNR(pnr.trim());
      if (res.success) {
        setBooking(res.data);
      }
    } catch (err) {
      setError(err.message || 'No reservation found for this PNR reference. Please check the code and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="text-center space-y-2 max-w-xl mx-auto">
        <div className="w-12 h-12 bg-brand-50 text-brand-600 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-brand-200">
          <Ticket className="w-6 h-6" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          PNR Status & Digital Boarding Pass
        </h1>
        <p className="text-xs text-slate-500 leading-relaxed">
          Enter your 10-character reservation PNR to retrieve real-time coach status or print your official travel pass.
        </p>
      </div>

      {/* PNR Search Card */}
      <div className="max-w-xl mx-auto bg-white p-6 rounded-2xl border border-slate-200 shadow-xs no-print">
        <form onSubmit={handleSearch} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              Enter PNR Number
            </label>
            <div className="relative">
              <input
                type="text"
                required
                placeholder="e.g. PNR-NBX-984210"
                value={pnr}
                onChange={(e) => setPnr(e.target.value.toUpperCase())}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm font-mono font-bold text-slate-900 tracking-wider focus:outline-none focus:ring-2 focus:ring-brand-500 uppercase"
              />
            </div>
            <div className="text-[11px] text-slate-400 mt-2">
              Sample seeded test PNR: <code className="font-mono text-brand-600 font-bold cursor-pointer hover:underline" onClick={() => setPnr('PNR-NBX-984210')}>PNR-NBX-984210</code>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Querying Central Reservation System...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Retrieve Official Boarding Pass</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Error State */}
      {error && (
        <div className="max-w-xl mx-auto p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-900 text-xs">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Ticket Result Display */}
      {booking && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <TicketCard booking={booking} />
        </div>
      )}
    </div>
  );
}
