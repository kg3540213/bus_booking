import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Bus, Lock, Mail, User, Shield, CheckCircle2, AlertCircle, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [selectedRole, setSelectedRole] = useState('CUSTOMER');
  const [email, setEmail] = useState('user@example.com');
  const [password, setPassword] = useState('User@123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, demoLogin } = useAuth();
  const navigate = useNavigate();

  // Role metadata and quick credentials
  const roleConfig = {
    CUSTOMER: {
      title: 'Passenger Account Sign In',
      badge: 'Passenger',
      badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      description: 'Book intercity buses, select berths, manage reservations, track live trips, and process instant refunds.',
      demoEmail: 'user@example.com',
      demoPass: 'User@123',
      redirect: '/',
      icon: User,
    },
    OPERATOR: {
      title: 'Fleet Dispatcher & Conductor Portal',
      badge: 'Fleet Operator',
      badgeColor: 'bg-blue-50 text-blue-800 border-blue-200',
      description: 'Access route schedules, passenger manifests, conductor check-in, and seat occupancy reports.',
      demoEmail: 'operator@intercity.com',
      demoPass: 'Operator@123',
      redirect: '/operator',
      icon: Bus,
    },
    ADMIN: {
      title: 'System Administrator Console',
      badge: 'System Admin',
      badgeColor: 'bg-purple-50 text-purple-800 border-purple-200',
      description: 'Manage bus operators, fleet inventory, routes, trips, live security audit trail, and analytics.',
      demoEmail: 'admin@nexbus.com',
      demoPass: 'Admin@123',
      redirect: '/admin',
      icon: Shield,
    },
  };

  const currentConfig = roleConfig[selectedRole];

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setError('');
    setEmail(roleConfig[role].demoEmail);
    setPassword(roleConfig[role].demoPass);
  };

  const handleStandardLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await login(email, password);
      if (res.success) {
        const userRole = res.data.user.role;
        if (userRole === 'ADMIN') navigate('/admin');
        else if (userRole === 'OPERATOR') navigate('/operator');
        else navigate('/');
      }
    } catch (err) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleOneClickDemo = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await demoLogin(selectedRole);
      if (res.success) {
        navigate(currentConfig.redirect);
      }
    } catch (err) {
      setError(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto my-12 px-4 space-y-6">
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-brand-600 text-white flex items-center justify-center mx-auto shadow-md shadow-brand-600/20">
          <Bus className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Sign In to NexBus</h1>
        <p className="text-xs text-slate-500">
          Select your account role to continue with tailored operational access
        </p>
      </div>

      {/* Role Selection Segmented Control */}
      <div className="bg-white p-1.5 rounded-2xl border border-slate-200 shadow-2xs grid grid-cols-3 gap-1">
        {[
          { id: 'CUSTOMER', label: 'Passenger', icon: User },
          { id: 'OPERATOR', label: 'Bus Operator', icon: Bus },
          { id: 'ADMIN', label: 'System Admin', icon: Shield },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = selectedRole === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleRoleSelect(tab.id)}
              className={`py-2.5 px-2 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition ${
                isActive
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Role Context & 1-Click Login Card */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between">
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${currentConfig.badgeColor}`}>
            {currentConfig.badge} Persona
          </span>
          <span className="text-[11px] text-slate-500 font-medium">Reviewer Preset</span>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          {currentConfig.description}
        </p>

        <button
          type="button"
          onClick={handleOneClickDemo}
          disabled={loading}
          className="w-full py-2.5 bg-white hover:bg-slate-100/80 text-slate-800 border border-slate-300 font-bold text-xs rounded-xl shadow-2xs transition flex items-center justify-center gap-2"
        >
          <Sparkles className="w-3.5 h-3.5 text-brand-600" />
          <span>1-Click Sign In as {currentConfig.badge} ({currentConfig.demoEmail})</span>
        </button>
      </div>

      {error && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2.5 text-red-900 text-xs">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Email / Password Form */}
      <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200 shadow-xs space-y-5">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-sm font-extrabold text-slate-900">{currentConfig.title}</h2>
          <p className="text-xs text-slate-400">Enter your credentials or click the preset above</p>
        </div>

        <form onSubmit={handleStandardLogin} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-600 uppercase tracking-wider mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-600 uppercase tracking-wider mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white rounded-xl font-bold text-xs shadow-md shadow-brand-600/20 transition flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Signing In...</span>
              </>
            ) : (
              <>
                <span>Sign In as {selectedRole.toLowerCase()}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>New to NexBus?</span>
          <Link
            to="/register"
            className="font-bold text-brand-600 hover:text-brand-700 hover:underline"
          >
            Create an Account →
          </Link>
        </div>
      </div>
    </div>
  );
}
