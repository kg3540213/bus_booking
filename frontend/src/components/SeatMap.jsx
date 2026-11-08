import React, { useState } from 'react';
import { Check, ShieldAlert, User, Sparkles } from 'lucide-react';

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

  const getSeatStatusClass = (seat) => {
    const isSelected = selectedSeats.includes(seat.seat_number);
    const isBooked = seat.status === 'BOOKED';

    if (isBooked) {
      return 'bg-slate-200 border-slate-300 text-slate-400 cursor-not-allowed';
    }
    if (isSelected) {
      return 'bg-blue-600 border-blue-700 text-white shadow-md shadow-blue-500/30 scale-105';
    }
    if (seat.is_ladies_quota) {
      return 'bg-pink-50 border-pink-300 text-pink-700 hover:bg-pink-100 hover:border-pink-400 cursor-pointer';
    }
    return 'bg-white border-emerald-400 text-emerald-800 hover:bg-emerald-50 hover:border-emerald-500 cursor-pointer';
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100 mb-6">
        <div>
          <h3 className="font-bold text-slate-900 text-lg">Select Your Seats</h3>
          <p className="text-xs text-slate-500">
            {isSleeper ? 'Spacious individual & double sleeper berths' : 'Comfortable 2x2 pushback seating'}
          </p>
        </div>

        {/* Deck Switcher for Sleeper */}
        {isSleeper && (
          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveDeck('LOWER')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeDeck === 'LOWER'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Lower Deck ({lowerDeckSeats.filter(s => s.status === 'AVAILABLE').length} free)
            </button>
            <button
              type="button"
              onClick={() => setActiveDeck('UPPER')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeDeck === 'UPPER'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Upper Deck ({upperDeckSeats.filter(s => s.status === 'AVAILABLE').length} free)
            </button>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs mb-8 p-3 bg-slate-50 rounded-xl border border-slate-150">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded border border-emerald-400 bg-white"></div>
          <span className="text-slate-600 font-medium">Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded border border-pink-300 bg-pink-50"></div>
          <span className="text-slate-600 font-medium">Ladies Quota</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-blue-600"></div>
          <span className="text-slate-600 font-medium">Selected</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded border border-slate-300 bg-slate-200"></div>
          <span className="text-slate-600 font-medium">Already Booked</span>
        </div>
      </div>

      {/* Bus Layout Container */}
      <div className="max-w-md mx-auto bg-slate-100 rounded-3xl p-6 border-2 border-slate-200 relative">
        {/* Steering Wheel Indicator at Front */}
        <div className="flex justify-between items-center mb-6 pb-3 border-b border-slate-300 text-xs text-slate-500 font-medium uppercase tracking-wider">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Bus Front</span>
          </div>
          <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-md border border-slate-200 shadow-2xs">
            <span>☸ Driver</span>
          </div>
        </div>

        {/* Seats Grid */}
        <div className="space-y-4">
          {Object.keys(rows).map(rowNum => {
            const rowSeats = rows[rowNum].sort((a, b) => a.col_num - b.col_num);

            return (
              <div key={rowNum} className="flex items-center justify-between gap-3">
                {isSleeper ? (
                  // Sleeper: Col 1 on left, aisle, Col 2 & 3 on right
                  <>
                    <div className="w-24">
                      {rowSeats.filter(s => s.col_num === 1).map(seat => (
                        <button
                          key={seat.seat_number}
                          type="button"
                          disabled={seat.status === 'BOOKED'}
                          onClick={() => onSeatToggle(seat.seat_number, Number(seat.fare))}
                          className={`w-full h-14 rounded-xl border-2 flex flex-col items-center justify-center transition font-semibold text-xs relative ${getSeatStatusClass(seat)}`}
                        >
                          <span>{seat.seat_number}</span>
                          <span className="text-[10px] opacity-80">₹{Math.round(seat.fare)}</span>
                          {selectedSeats.includes(seat.seat_number) && (
                            <Check className="w-3.5 h-3.5 absolute top-1 right-1" />
                          )}
                        </button>
                      ))}
                    </div>

                    {/* Aisle */}
                    <div className="text-[10px] font-bold text-slate-300 uppercase tracking-widest rotate-90 select-none">
                      AISLE
                    </div>

                    <div className="flex items-center gap-2">
                      {rowSeats.filter(s => s.col_num > 1).map(seat => (
                        <button
                          key={seat.seat_number}
                          type="button"
                          disabled={seat.status === 'BOOKED'}
                          onClick={() => onSeatToggle(seat.seat_number, Number(seat.fare))}
                          className={`w-20 h-14 rounded-xl border-2 flex flex-col items-center justify-center transition font-semibold text-xs relative ${getSeatStatusClass(seat)}`}
                        >
                          <span>{seat.seat_number}</span>
                          <span className="text-[10px] opacity-80">₹{Math.round(seat.fare)}</span>
                          {selectedSeats.includes(seat.seat_number) && (
                            <Check className="w-3.5 h-3.5 absolute top-1 right-1" />
                          )}
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  // Seater 2x2: Col 1 & 2 on left, aisle, Col 3 & 4 on right
                  <>
                    <div className="flex items-center gap-2">
                      {rowSeats.filter(s => s.col_num <= 2).map(seat => (
                        <button
                          key={seat.seat_number}
                          type="button"
                          disabled={seat.status === 'BOOKED'}
                          onClick={() => onSeatToggle(seat.seat_number, Number(seat.fare))}
                          className={`w-14 h-12 rounded-xl border-2 flex flex-col items-center justify-center transition font-semibold text-xs relative ${getSeatStatusClass(seat)}`}
                        >
                          <span>{seat.seat_number}</span>
                          <span className="text-[10px] opacity-80">₹{Math.round(seat.fare)}</span>
                          {selectedSeats.includes(seat.seat_number) && (
                            <Check className="w-3 h-3 absolute top-1 right-1" />
                          )}
                        </button>
                      ))}
                    </div>

                    {/* Aisle */}
                    <div className="text-[10px] font-bold text-slate-300 select-none">|</div>

                    <div className="flex items-center gap-2">
                      {rowSeats.filter(s => s.col_num > 2).map(seat => (
                        <button
                          key={seat.seat_number}
                          type="button"
                          disabled={seat.status === 'BOOKED'}
                          onClick={() => onSeatToggle(seat.seat_number, Number(seat.fare))}
                          className={`w-14 h-12 rounded-xl border-2 flex flex-col items-center justify-center transition font-semibold text-xs relative ${getSeatStatusClass(seat)}`}
                        >
                          <span>{seat.seat_number}</span>
                          <span className="text-[10px] opacity-80">₹{Math.round(seat.fare)}</span>
                          {selectedSeats.includes(seat.seat_number) && (
                            <Check className="w-3 h-3 absolute top-1 right-1" />
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

        {/* Bus Rear */}
        <div className="mt-6 pt-3 border-t border-slate-300 text-center text-xs text-slate-400 font-medium uppercase tracking-wider">
          Bus Rear
        </div>
      </div>
    </div>
  );
}

