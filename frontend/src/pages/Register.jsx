import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Bus, Lock, Mail, User, Phone, MapPin, Building2, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [selectedRole, setSelectedRole] = useState('CUSTOMER');

  // Customer Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');

  // Operator Specific Form State
  const [companyName, setCompanyName] = useState('');
  const [companyCode, setCompanyCode] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = {
        name,
        email,
        password,
        phone,
        role: selectedRole,
        ...(selectedRole === 'OPERATOR' && {
          company_name: companyName,
          company_code: companyCode.toUpperCase(),
          company_phone: phone,
          company_address: companyAddress,
        }),
      };

      const res = await register(payload);
      if (res.success) {
        if (selectedRole === 'OPERATOR') {
          navigate('/operator');
        } else {
          navigate('/');
        }
      }
    } catch (err) {
      setError(err.message || 'Registration failed. Please check your information.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto my-12 px-4 space-y-6">
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-brand-600 text-white flex items-center justify-center mx-auto shadow-md shadow-brand-600/20">
          <Bus className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Create Your NexBus Account</h1>
        <p className="text-xs text-slate-500">
          Join thousands of travelers or register your bus fleet on our central reservation system
        </p>
      </div>

      {/* Role Selection Segmented Control */}
      <div className="bg-white p-1.5 rounded-2xl border border-slate-200 shadow-2xs grid grid-cols-2 gap-1">
        <button
          type="button"
          onClick={() => { setSelectedRole('CUSTOMER'); setError(''); }}
          className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition ${
            selectedRole === 'CUSTOMER'
              ? 'bg-slate-900 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <User className="w-4 h-4" />
          <span>I am a Passenger / Traveler</span>
        </button>

        <button
          type="button"
          onClick={() => { setSelectedRole('OPERATOR'); setError(''); }}
          className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition ${
            selectedRole === 'OPERATOR'
              ? 'bg-slate-900 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Bus className="w-4 h-4" />
          <span>I am a Bus Operator Partner</span>
        </button>
      </div>

      {/* Role Context */}
      <div className={`p-4 rounded-xl border text-xs leading-relaxed ${
        selectedRole === 'OPERATOR'
          ? 'bg-blue-50/70 border-blue-200 text-blue-900'
          : 'bg-slate-50 border-slate-200 text-slate-700'
      }`}>
        <div className="font-bold mb-0.5">
          {selectedRole === 'OPERATOR'
            ? '🚍 Bus Fleet Operator Partner Account'
            : '👤 Personal Traveler Account'}
        </div>
        <div className="opacity-90">
          {selectedRole === 'OPERATOR'
            ? 'Register your transit company to publish schedules, manage digital conductor manifests, and reconcile seat occupancy.'
            : 'Book seats instantly, access e-tickets, track live buses, and process automated tiered refunds.'}
        </div>
      </div>

      {error && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2.5 text-red-900 text-xs">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Registration Form */}
      <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200 shadow-xs space-y-5">
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Operator Specific Company Fields */}
          {selectedRole === 'OPERATOR' && (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5 pb-1 border-b border-slate-200">
                <Building2 className="w-3.5 h-3.5 text-brand-600" />
                Transit Company Details
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Company / Fleet Brand Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Falcon Intercity Express"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2.5 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Company Code (2-4 letters)</label>
                  <input
                    type="text"
                    required
                    maxLength={5}
                    placeholder="e.g. FCN"
                    value={companyCode}
                    onChange={(e) => setCompanyCode(e.target.value.toUpperCase())}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2.5 font-mono font-bold text-slate-900 uppercase focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Depot / Headquarter City</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bangalore, Karnataka"
                    value={companyAddress}
                    onChange={(e) => setCompanyAddress(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2.5 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Account Credentials */}
          <div className="space-y-3">
            <div className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5 pb-1 border-b border-slate-100">
              <User className="w-3.5 h-3.5 text-brand-600" />
              {selectedRole === 'OPERATOR' ? 'Fleet Manager Profile' : 'Traveler Profile'}
            </div>

            <div>
              <label className="block font-bold text-slate-600 uppercase mb-1">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-600 uppercase mb-1">Email Address</label>
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
                <label className="block font-bold text-slate-600 uppercase mb-1">Mobile Phone</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition font-mono"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-600 uppercase mb-1">Password (min 6 characters)</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition font-mono"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white rounded-xl font-bold text-xs shadow-md shadow-brand-600/20 transition flex items-center justify-center gap-2 mt-4"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Creating Account...</span>
              </>
            ) : (
              <>
                <span>Complete {selectedRole === 'OPERATOR' ? 'Operator Partner' : 'Passenger'} Registration</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Already have an account?</span>
          <Link
            to="/login"
            className="font-bold text-brand-600 hover:text-brand-700 hover:underline"
          >
            Sign In Here →
          </Link>
        </div>
      </div>
    </div>
  );
}
