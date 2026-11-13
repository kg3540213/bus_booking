import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, BookOpen, BusFront, ChevronDown, LayoutDashboard, LogOut, Shield, Ticket, UserRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout, demoLogin, isAdmin, isOperator } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const switchDemoRole = async (role) => {
    try {
      await demoLogin(role);
      navigate(role === 'ADMIN' ? '/admin' : role === 'OPERATOR' ? '/operator' : '/');
    } catch (error) {
      console.error('Demo login switch error:', error);
    }
  };

  const linkClass = (path) => `rounded-lg px-3 py-2 text-sm font-medium transition ${
    location.pathname === path || (path === '/' && location.pathname === '/search')
      ? 'bg-rose-50 text-brand-700'
      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'
  }`;

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl no-print">
      <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-7 lg:px-10">
        <Link to="/" aria-label="NexBus home" className="group flex shrink-0 items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white shadow-md shadow-brand-600/20 transition group-hover:-rotate-3 group-hover:scale-105">
            <BusFront className="h-5 w-5" />
          </span>
          <span>
            <span className="block text-[19px] font-bold leading-5 tracking-tight text-slate-950">
              Nex<span className="text-brand-600">Bus</span>
            </span>
            <span className="mt-0.5 block text-[9px] font-semibold uppercase tracking-[0.17em] text-slate-400">Go somewhere good</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
          <Link to="/" className={linkClass('/')}>Find a bus</Link>
          <Link to="/pnr-lookup" className={linkClass('/pnr-lookup')}>Check a ticket</Link>
          {user && <Link to="/my-bookings" className={linkClass('/my-bookings')}>My trips</Link>}
          {(isOperator || isAdmin) && (
            <Link to="/operator" className={`${linkClass('/operator')} inline-flex items-center gap-1.5`}>
              <LayoutDashboard className="h-4 w-4" /> Operator
            </Link>
          )}
          {isAdmin && (
            <Link to="/admin" className={`${linkClass('/admin')} inline-flex items-center gap-1.5`}>
              <Shield className="h-4 w-4" /> Admin
            </Link>
          )}
          <a
            href="/api/docs/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            <BookOpen className="h-4 w-4" /> API Docs
          </a>
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <details className="group relative hidden sm:block">
            <summary className="flex cursor-pointer list-none items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-500 transition hover:bg-slate-50 hover:text-slate-900">
              Demo access <ChevronDown className="h-3.5 w-3.5 transition group-open:rotate-180" />
            </summary>
            <div className="absolute right-0 top-full mt-2 w-52 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
              <p className="px-2.5 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Try a demo account</p>
              {[
                ['CUSTOMER', 'Passenger'],
                ['OPERATOR', 'Bus operator'],
                ['ADMIN', 'Administrator'],
              ].map(([role, label]) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => switchDemoRole(role)}
                  className="w-full rounded-xl px-2.5 py-2 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-brand-700"
                >
                  {label}
                </button>
              ))}
            </div>
          </details>

          {user ? (
            <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
              <span className="hidden text-right sm:block">
                <span className="block max-w-28 truncate text-xs font-semibold text-slate-900">{user.name}</span>
                <span className="block text-[10px] text-slate-500">{user.role === 'CUSTOMER' ? 'Passenger' : user.role.toLowerCase()}</span>
              </span>
              <button
                type="button"
                onClick={() => { logout(); navigate('/'); }}
                aria-label="Sign out"
                title="Sign out"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-brand-700"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <>
              <Link to="/login" aria-label="Log in" className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:border-brand-200 hover:bg-rose-50 hover:text-brand-700 sm:hidden">
                <UserRound className="h-4 w-4" />
              </Link>
              <Link to="/login" className="hidden rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 sm:inline-flex sm:items-center sm:gap-1.5">
                <UserRound className="h-4 w-4" /> Log in
              </Link>
              <Link to="/register" className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 hover:shadow-md">
                <span className="hidden sm:inline">Create account</span>
                <span className="sm:hidden">Join</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </>
          )}
        </div>
      </div>
      <div className="flex items-center justify-center gap-5 border-t border-slate-100 px-4 py-2 md:hidden">
        <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600"><BusFront className="h-3.5 w-3.5" /> Find a bus</Link>
        <Link to="/pnr-lookup" className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600"><Ticket className="h-3.5 w-3.5" /> Check a ticket</Link>
        {user && <Link to="/my-bookings" className="text-xs font-medium text-slate-600">My trips</Link>}
        <a href="/api/docs/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700">
          <BookOpen className="h-3.5 w-3.5" /> API Docs
        </a>
      </div>
    </header>
  );
}
