import React, { useState } from 'react';
import { Check, ShieldAlert, User, Shield, Info } from 'lucide-react';

export default function SeatMap({
  seats = [],
  selectedSeats = [],
  onSeatToggle,
  busType = 'AC_SLEEPER',
  baseFare = 1000,
}) {
  const [activeDeck, setActiveDeck] = useState('LOWER');

  const isSleeper = busType.includes('SLEEPER');
  const lowerDeckSeats = seats.filter(s => s.deck === 'LOWER');
  const upperDeckSeats = seats.filter(s => s.deck === 'UPPER');
  const currentDeckSeats = activeDeck === 'LOWER' ? lowerDeckSeats : upperDeckSeats;

  // Group seats by row
  const rows = {};
  currentDeckSeats.forEach(seat => {
    const r = seat.row_num || 1;
    if (!rows[r]) rows[r] = [];
    rows[r].push(seat);
  });

  const getSeatClasses = (seat) => {
    const isSelected = selectedSeats.includes(seat.seat_number);
    const isBooked = seat.status === 'BOOKED';

    if (isBooked) {
      return 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-80';
    }
    if (isSelected) {
      return 'bg-brand-600 border-brand-700 text-white shadow-md shadow-brand-600/30 scale-[1.02]';
    }
    if (seat.is_ladies_quota) {
      return 'bg-pink-50 border-pink-300 text-pink-700 hover:bg-pink-100 cursor-pointer';
    }
    return 'bg-white border-emerald-500 text-slate-900 hover:bg-emerald-50 hover:border-emerald-600 cursor-pointer';
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-6">
      {/* Header and Deck Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h3 className="font-extrabold text-slate-900 text-base">Select Your Desired Berths</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {isSleeper ? 'Single berth on left, double berths on right with personal charging and reading lamps.' : '2x2 pushback reclining seats with footrests.'}
          </p>
        </div>

        {/* Deck Switcher for Sleeper Coaches */}
        {isSleeper && (
          <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200">
            <button
              type="button"
              onClick={() => setActiveDeck('LOWER')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                activeDeck === 'LOWER'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Lower Deck ({lowerDeckSeats.filter(s => s.status === 'AVAILABLE').length} free)
            </button>
            <button
              type="button"
              onClick={() => setActiveDeck('UPPER')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                activeDeck === 'UPPER'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Upper Deck ({upperDeckSeats.filter(s => s.status === 'AVAILABLE').length} free)
            </button>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-5 text-xs p-3 bg-slate-50 rounded-xl border border-slate-200/80">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded border-2 border-emerald-500 bg-white"></div>
          <span className="text-slate-700 font-semibold">Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded border-2 border-pink-300 bg-pink-50"></div>
          <span className="text-slate-700 font-semibold">Ladies Quota</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-brand-600 border border-brand-700 flex items-center justify-center text-white">
            <Check className="w-3 h-3" />
          </div>
          <span className="text-slate-700 font-semibold">Selected</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded border border-slate-200 bg-slate-200"></div>
          <span className="text-slate-400 font-semibold">Booked / Taken</span>
        </div>
      </div>

      {/* Bus Chassis Visual Frame */}
      <div className="max-w-md mx-auto bg-slate-50 rounded-3xl p-5 sm:p-6 border-2 border-slate-200 relative shadow-inner">
        {/* Front Dashboard & Driver Cabin */}
        <div className="flex justify-between items-center mb-6 pb-3 border-b-2 border-slate-200 text-xs text-slate-500 font-bold uppercase tracking-wider">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[11px] text-slate-600">Coach Front</span>
          </div>

          <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs text-[11px] text-slate-700 font-mono">
            <span>☸ Driver Cabin</span>
          </div>
        </div>

        {/* Seat Layout Rows */}
        <div className="space-y-3.5">
          {Object.keys(rows).map(rowNum => {
            const rowSeats = rows[rowNum].sort((a, b) => a.col_num - b.col_num);

            return (
              <div key={rowNum} className="flex items-center justify-between gap-3">
                {isSleeper ? (
                  // Sleeper: Col 1 on left (Single Berth), Aisle, Col 2 & 3 on right (Double Berth)
                  <>
                    <div className="w-24">
                      {rowSeats.filter(s => s.col_num === 1).map(seat => (
                        <button
                          key={seat.seat_number}
                          type="button"
                          disabled={seat.status === 'BOOKED'}
                          onClick={() => onSeatToggle(seat.seat_number, Number(seat.fare))}
                          className={`w-full h-14 rounded-xl border-2 flex flex-col items-center justify-center transition font-bold text-xs relative sleeper-berth-pillow ${getSeatClasses(seat)}`}
                        >
                          <span className="font-mono text-xs">{seat.seat_number}</span>
                          <span className="text-[10px] font-mono opacity-80">₹{Math.round(seat.fare)}</span>
                          {selectedSeats.includes(seat.seat_number) && (
                            <Check className="w-3.5 h-3.5 absolute top-1 right-1 text-white" />
                          )}
                        </button>
                      ))}
                    </div>

                    {/* Central Aisle */}
                    <div className="text-[9px] font-bold text-slate-300 uppercase tracking-widest select-none font-mono">
                      AISLE
                    </div>

                    <div className="flex items-center gap-2">
                      {rowSeats.filter(s => s.col_num > 1).map(seat => (
                        <button
                          key={seat.seat_number}
                          type="button"
                          disabled={seat.status === 'BOOKED'}
                          onClick={() => onSeatToggle(seat.seat_number, Number(seat.fare))}
                          className={`w-20 h-14 rounded-xl border-2 flex flex-col items-center justify-center transition font-bold text-xs relative sleeper-berth-pillow ${getSeatClasses(seat)}`}
                        >
                          <span className="font-mono text-xs">{seat.seat_number}</span>
                          <span className="text-[10px] font-mono opacity-80">₹{Math.round(seat.fare)}</span>
                          {selectedSeats.includes(seat.seat_number) && (
                            <Check className="w-3.5 h-3.5 absolute top-1 right-1 text-white" />
                          )}
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  // Seater 2x2: Col 1 & 2 on left, Aisle, Col 3 & 4 on right
                  <>
                    <div className="flex items-center gap-2">
                      {rowSeats.filter(s => s.col_num <= 2).map(seat => (
                        <button
                          key={seat.seat_number}
                          type="button"
                          disabled={seat.status === 'BOOKED'}
                          onClick={() => onSeatToggle(seat.seat_number, Number(seat.fare))}
                          className={`w-14 h-12 rounded-xl border-2 flex flex-col items-center justify-center transition font-bold text-xs relative ${getSeatClasses(seat)}`}
                        >
                          <span className="font-mono text-xs">{seat.seat_number}</span>
                          <span className="text-[10px] font-mono opacity-80">₹{Math.round(seat.fare)}</span>
                          {selectedSeats.includes(seat.seat_number) && (
                            <Check className="w-3 h-3 absolute top-1 right-1 text-white" />
                          )}
                        </button>
                      ))}
                    </div>

                    <div className="text-[10px] font-bold text-slate-300 select-none">|</div>

                    <div className="flex items-center gap-2">
                      {rowSeats.filter(s => s.col_num > 2).map(seat => (
                        <button
                          key={seat.seat_number}
                          type="button"
                          disabled={seat.status === 'BOOKED'}
                          onClick={() => onSeatToggle(seat.seat_number, Number(seat.fare))}
                          className={`w-14 h-12 rounded-xl border-2 flex flex-col items-center justify-center transition font-bold text-xs relative ${getSeatClasses(seat)}`}
                        >
                          <span className="font-mono text-xs">{seat.seat_number}</span>
                          <span className="text-[10px] font-mono opacity-80">₹{Math.round(seat.fare)}</span>
                          {selectedSeats.includes(seat.seat_number) && (
                            <Check className="w-3 h-3 absolute top-1 right-1 text-white" />
                          )}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Rear Exit */}
        <div className="mt-6 pt-3 border-t-2 border-slate-200 text-center text-[11px] text-slate-400 font-bold uppercase tracking-wider">
          Coach Rear / Emergency Exit
        </div>
      </div>
    </div>
  );
}
