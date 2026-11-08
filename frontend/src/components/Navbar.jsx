import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bus, User, LogOut, Shield, Compass, FileText, LayoutDashboard, Ticket } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout, demoLogin, isAdmin, isOperator } = useAuth();
  const navigate = useNavigate();

  const handleRoleSwitch = async (role) => {
    try {
      await demoLogin(role);
      if (role === 'ADMIN') navigate('/admin');
      else if (role === 'OPERATOR') navigate('/operator');
      else navigate('/');
    } catch (err) {
      console.error('Demo login failed:', err);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm no-print">
      {/* Reviewer Quick Access Banner */}
      <div className="bg-slate-900 text-slate-300 text-xs py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-emerald-400">ALGIONS ASSIGNMENT DEMO SWITCHER:</span>
            <span>Switch active role in 1 click for testing:</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleRoleSwitch('ADMIN')}
              className={`px-2 py-0.5 rounded font-medium transition ${
                user?.role === 'ADMIN'
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
              }`}
            >
              👑 Admin Demo
            </button>
            <button
              onClick={() => handleRoleSwitch('OPERATOR')}
              className={`px-2 py-0.5 rounded font-medium transition ${
                user?.role === 'OPERATOR'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
              }`}
            >
              🚍 Operator Demo
            </button>
            <button
              onClick={() => handleRoleSwitch('CUSTOMER')}
              className={`px-2 py-0.5 rounded font-medium transition ${
                user?.role === 'CUSTOMER'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
              }`}
            >
              👤 Customer Demo
            </button>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2.5 font-bold text-xl text-blue-600 tracking-tight">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
                <Bus className="w-5 h-5" />
              </div>
              <div>
                <span className="text-slate-900">Algions</span>
                <span className="text-blue-600">Bus</span>
                <span className="block text-[10px] font-medium text-slate-400 tracking-normal uppercase">Enterprise Transit</span>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              <Link
                to="/"
                className="px-3 py-2 text-sm font-medium text-slate-700 hover:text-blue-600 rounded-lg hover:bg-slate-50 transition"
              >
                Find Buses
              </Link>
              <Link
                to="/pnr-lookup"
                className="px-3 py-2 text-sm font-medium text-slate-700 hover:text-blue-600 rounded-lg hover:bg-slate-50 transition"
              >
                PNR Status / E-Ticket
              </Link>
              {user && (
                <Link
                  to="/my-bookings"
                  className="px-3 py-2 text-sm font-medium text-slate-700 hover:text-blue-600 rounded-lg hover:bg-slate-50 transition"
                >
                  My Bookings
                </Link>
              )}
              {isAdmin && (
                <Link
                  to="/admin"
                  className="px-3 py-2 text-sm font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg transition flex items-center gap-1.5"
                >
                  <Shield className="w-4 h-4" /> Admin Console
                </Link>
              )}
              {isOperator && (
                <Link
                  to="/operator"
                  className="px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition flex items-center gap-1.5"
                >
                  <LayoutDashboard className="w-4 h-4" /> Operator Manifests
                </Link>
              )}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="http://localhost:5000/api/docs"
              target="_blank"
              rel="noreferrer"
              className="hidden lg:flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-blue-600 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-md transition"
            >
              <FileText className="w-3.5 h-3.5" /> Swagger Docs
            </a>

            {user ? (
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <div className="text-sm font-semibold text-slate-800 leading-tight">{user.name}</div>
                  <span className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                    user.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' :
                    user.role === 'OPERATOR' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {user.role}
                  </span>
                </div>
                <button
                  onClick={logout}
                  title="Sign Out"
                  className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition"
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

