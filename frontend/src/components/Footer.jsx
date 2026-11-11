import React from 'react';
import { Link } from 'react-router-dom';
import { BusFront, Ticket } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white no-print">
      <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-7 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10">
        <Link to="/" className="inline-flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white">
            <BusFront className="h-4 w-4" />
          </span>
          <span>
            <span className="block text-sm font-semibold text-slate-900">Nex<span className="text-brand-600">Bus</span></span>
            <span className="block text-[10px] text-slate-500">A simpler way to travel</span>
          </span>
        </Link>
        <p className="text-xs text-slate-500">Plan a route, choose a seat, and travel with confidence.</p>
        <Link to="/pnr-lookup" className="inline-flex items-center gap-2 text-xs font-medium text-slate-600 transition hover:text-brand-700">
          <Ticket className="h-4 w-4" /> Find your ticket
        </Link>
      </div>
    </footer>
  );
}
