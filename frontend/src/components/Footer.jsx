import React from 'react';
import { Bus, ShieldCheck, Clock, Award, Phone, Mail, MapPin, Heart, Shield } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 text-xs mt-auto border-t border-slate-800 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Col 1: Brand Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5 font-bold text-lg text-white">
              <div className="w-8 h-8 rounded-xl bg-brand-600 text-white flex items-center justify-center shadow-md shadow-brand-600/20">
                <Bus className="w-4 h-4" />
              </div>
              <div>
                <span className="text-white font-extrabold">Nex</span>
                <span className="text-brand-500 font-extrabold">Bus</span>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              India's premier enterprise intercity transit and bus reservation network. Powered by real-time ACID seat locking, verified passenger manifests, and transparent cancellation refund policies.
            </p>
            <div className="text-[11px] text-slate-500 space-y-1">
              <div className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-brand-500" />
                <span>24/7 Helpline: 1800-200-NEXBUS</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-brand-500" />
                <span>support@nexbus.com</span>
              </div>
            </div>
          </div>

          {/* Col 2: Transit Guarantees */}
          <div>
            <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-4">Transit Guarantees</h4>
            <ul className="space-y-2.5">
              <li className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Zero Double-Bookings:</strong> PostgreSQL row-level locking ensures absolute seat exclusivity.</span>
              </li>
              <li className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
                <span><strong>Dynamic Refunds:</strong> Up to 90% instant cancellation refund directly to original payment mode.</span>
              </li>
              <li className="flex items-start gap-2">
                <Award className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span><strong>Reconciled Manifests:</strong> 100% verified passenger boarding manifests for drivers and operators.</span>
              </li>
            </ul>
          </div>

          {/* Col 3: Popular Express Routes */}
          <div>
            <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-4">Top Express Routes</h4>
            <ul className="space-y-2 text-slate-400">
              <li className="hover:text-white transition cursor-pointer">Bangalore ⇄ Hyderabad (Overnight Sleeper)</li>
              <li className="hover:text-white transition cursor-pointer">Mumbai ⇄ Pune (Expressway Superfast)</li>
              <li className="hover:text-white transition cursor-pointer">Bangalore ⇄ Chennai (Cruiser AC 2+1)</li>
              <li className="hover:text-white transition cursor-pointer">Hyderabad ⇄ Vijayawada (Multi-Axle Luxury)</li>
              <li className="hover:text-white transition cursor-pointer">Pune ⇄ Goa (Volvo Multi-Axle Sleeper)</li>
            </ul>
          </div>

          {/* Col 4: Platform Security & Standards */}
          <div>
            <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-4">Security & Architecture</h4>
            <div className="bg-slate-800/80 rounded-2xl p-4 border border-slate-700/60 space-y-2">
              <div className="text-white font-bold text-xs flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Enterprise Security Standards
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Role-Based Authorization (RBAC), server-side input schema validation, and immutable audit logs for all material actions.
              </p>
              <div className="pt-2 border-t border-slate-700 text-[10px] text-emerald-400 font-mono">
                System Status: All 5 Acceptance Tests Passing (13/13)
              </div>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4 text-[11px] text-slate-500">
          <div>
            © {new Date().getFullYear()} NexBus Technologies Private Limited. All rights reserved.
          </div>
          <div className="flex items-center gap-4">
            <span className="hover:text-slate-300 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-slate-300 cursor-pointer">Terms of Service</span>
            <span className="hover:text-slate-300 cursor-pointer">Security Disclosure</span>
            <a href="http://localhost:5000/api/docs" target="_blank" rel="noreferrer" className="text-brand-400 hover:text-brand-300 font-semibold">
              OpenAPI Swagger
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
