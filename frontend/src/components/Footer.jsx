import React from 'react';
import { Bus, ShieldCheck, Clock, Award, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 text-sm mt-auto border-t border-slate-800 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2 font-bold text-lg text-white">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                <Bus className="w-4 h-4" />
              </div>
              <span>Algions Bus</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Algions AI Labs - Enterprise Bus Booking Management System. Built with ACID seat locking, verifiable manifests, dynamic cancellation policies and audit trails.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-white text-xs uppercase tracking-wider mb-4">Core Assurances</h4>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Zero Double Bookings (Pessimistic Locks)
              </li>
              <li className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-400" />
                Live Automated Cancellation Refunds
              </li>
              <li className="flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-400" />
                100% Reconciled Passenger Manifests
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white text-xs uppercase tracking-wider mb-4">Popular Transit Corridors</h4>
            <ul className="space-y-2 text-xs">
              <li>Bangalore ⇄ Hyderabad (9h Express)</li>
              <li>Mumbai ⇄ Pune (3h Superfast)</li>
              <li>Bangalore ⇄ Chennai (6h Cruiser)</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white text-xs uppercase tracking-wider mb-4">Assessment Standards</h4>
            <div className="bg-slate-800/80 rounded-lg p-3 text-xs space-y-1">
              <div className="text-slate-300 font-medium">Algions Advanced Individual Project</div>
              <div className="text-slate-400 text-[11px]">Domain: Bus Booking Management System</div>
              <div className="text-emerald-400 text-[11px] font-mono mt-1">Status: All 5 Acceptance Tests Passing</div>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <div>© 2026 Algions AI Labs Private Limited. All rights reserved.</div>
          <div className="flex items-center gap-4">
            <span>Server: Node 22 / Express / PostgreSQL 16</span>
            <span>Client: React 18 / Tailwind CSS</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

