import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Bus, User, LogOut, Shield, Compass, FileText,
  LayoutDashboard, Ticket, ChevronDown, CheckCircle2,
  Sparkles, HelpCircle, PhoneCall
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout, demoLogin, isAdmin, isOperator } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleRoleSwitch = async (role) => {
    try {
      await demoLogin(role);
      if (role === 'ADMIN') navigate('/admin');
      else if (role === 'OPERATOR') navigate('/operator');
      else navigate('/');
    } catch (err) {
      console.error('Demo login switch error:', err);
    }
  };

  const getRoleBadge = (role) => {
    if (role === 'ADMIN') {
      return { label: 'Admin', color: 'bg-purple-50 text-purple-700 border-purple-200' };
    }
    if (role === 'OPERATOR') {
      return { label: 'Fleet Operator', color: 'bg-blue-50 text-blue-700 border-blue-200' };
    }
    return { label: 'Passenger', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  };

  const currentRoleInfo = getRoleBadge(user?.role || 'CUSTOMER');

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs no-print">
      {/* Top Reviewer Workspace Strip */}
      <div className="bg-slate-900 text-slate-300 text-xs py-1.5 px-4 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-semibold text-white tracking-wide">NexBus Central Reservation System</span>
            <span className="hidden md:inline text-slate-400 text-[11px]">• Strict ACID Seat Locking & Conductor Manifests</span>
          </div>

          {/* 1-Click Role Persona Switcher */}
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline text-slate-400 text-[11px] font-medium">Quick Persona Switch:</span>
            <div className="inline-flex rounded-lg bg-slate-800 p-0.5 border border-slate-700">
              <button
                type="button"
                onClick={() => handleRoleSwitch('CUSTOMER')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
                  user?.role === 'CUSTOMER'
                    ? 'bg-brand-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                Passenger
              </button>
              <button
                type="button"
                onClick={() => handleRoleSwitch('OPERATOR')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
                  user?.role === 'OPERATOR'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                Operator
              </button>
              <button
                type="button"
                onClick={() => handleRoleSwitch('ADMIN')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
                  user?.role === 'ADMIN'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                Admin
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Primary Nav Links */}
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center shadow-md shadow-brand-600/20 group-hover:bg-brand-700 transition">
                <Bus className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-0.5 leading-none">
                  <span className="text-xl font-extrabold text-slate-900 tracking-tight">Nex</span>
                  <span className="text-xl font-extrabold text-brand-600 tracking-tight">Bus</span>
                </div>
                <span className="block text-[10px] font-bold text-slate-400 tracking-wider uppercase mt-0.5">
                  Intercity Mobility
                </span>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              <Link
                to="/"
                className={`px-3 py-2 text-xs font-bold rounded-lg transition ${
                  location.pathname === '/' || location.pathname === '/search'
                    ? 'text-brand-600 bg-brand-50'
                    : 'text-slate-700 hover:text-brand-600 hover:bg-slate-50'
                }`}
              >
                Search Buses
              </Link>
              <Link
                to="/pnr-lookup"
                className={`px-3 py-2 text-xs font-bold rounded-lg transition ${
                  location.pathname === '/pnr-lookup'
                    ? 'text-brand-600 bg-brand-50'
                    : 'text-slate-700 hover:text-brand-600 hover:bg-slate-50'
                }`}
              >
                PNR Status / E-Ticket
              </Link>
              {user && (
                <Link
                  to="/my-bookings"
                  className={`px-3 py-2 text-xs font-bold rounded-lg transition ${
                    location.pathname === '/my-bookings'
                      ? 'text-brand-600 bg-brand-50'
                      : 'text-slate-700 hover:text-brand-600 hover:bg-slate-50'
                  }`}
                >
                  My Bookings
                </Link>
              )}
              {(isOperator || isAdmin) && (
                <Link
                  to="/operator"
                  className={`px-3 py-2 text-xs font-bold rounded-lg transition flex items-center gap-1.5 ${
                    location.pathname === '/operator'
                      ? 'text-blue-700 bg-blue-50 shadow-xs'
                      : 'text-blue-700 hover:bg-blue-50/60'
                  }`}
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  Operator Portal
                </Link>
              )}
              {isAdmin && (
                <Link
                  to="/admin"
                  className={`px-3 py-2 text-xs font-bold rounded-lg transition flex items-center gap-1.5 ${
                    location.pathname === '/admin'
                      ? 'text-purple-700 bg-purple-50 shadow-xs'
                      : 'text-purple-700 hover:bg-purple-50/60'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  Admin Console
                </Link>
              )}
            </nav>
          </div>

          {/* Right Action Area */}
          <div className="flex items-center gap-3">
            <a
              href="http://localhost:5000/api/docs"
              target="_blank"
              rel="noreferrer"
              className="hidden lg:flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 px-3 py-1.5 rounded-lg transition border border-slate-200"
            >
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              API Docs
            </a>

            {user ? (
              <div className="flex items-center gap-3 pl-2 border-l border-slate-200">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-bold text-slate-900 leading-tight">{user.name}</div>
                  <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border ${currentRoleInfo.color}`}>
                    {currentRoleInfo.label}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={logout}
                  title="Sign Out"
                  className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition border border-slate-200/60"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3.5 py-2 text-xs font-bold text-slate-700 hover:text-brand-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-sm shadow-brand-600/20 transition"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
