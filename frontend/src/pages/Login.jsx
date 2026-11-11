import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, BusFront, LockKeyhole, Mail, ShieldCheck, UserRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const personas = [
  { role: 'CUSTOMER', label: 'Passenger', email: 'user@example.com', password: 'User@123' },
  { role: 'OPERATOR', label: 'Operator', email: 'operator@intercity.com', password: 'Operator@123' },
  { role: 'ADMIN', label: 'Admin', email: 'admin@nexbus.com', password: 'Admin@123' },
];

export default function Login() {
  const [selectedRole, setSelectedRole] = useState('CUSTOMER');
  const [email, setEmail] = useState('user@example.com');
  const [password, setPassword] = useState('User@123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, demoLogin } = useAuth();
  const navigate = useNavigate();

  const destinationFor = (role) => role === 'ADMIN' ? '/admin' : role === 'OPERATOR' ? '/operator' : '/';

  const handleLogin = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const result = await login(email, password);
      if (result.success) navigate(destinationFor(result.data.user.role));
    } catch (err) {
      setError(err.message || 'We could not sign you in. Check your details and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await demoLogin(selectedRole);
      if (result.success) navigate(destinationFor(selectedRole));
    } catch (err) {
      setError(err.message || 'Demo sign-in is unavailable right now.');
    } finally {
      setLoading(false);
    }
  };

  const selectPersona = (persona) => {
    setSelectedRole(persona.role);
    setEmail(persona.email);
    setPassword(persona.password);
    setError('');
  };

  return (
    <div className="mx-auto grid min-h-[calc(100vh-120px)] max-w-7xl items-center gap-8 px-5 py-10 sm:px-8 lg:grid-cols-[1fr_0.85fr] lg:gap-16 lg:px-10">
      <section className="relative hidden min-h-[550px] overflow-hidden rounded-[2rem] bg-slate-950 lg:block">
        <img
          src="https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1400&q=85"
          alt="A coach travelling along an open road"
          className="absolute inset-0 h-full w-full object-cover opacity-65"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/25 to-slate-950/10" />
        <div className="absolute inset-x-0 bottom-0 p-10 text-white">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs backdrop-blur"><BusFront className="h-4 w-4" /> NexBus travel</span>
          <h1 className="mt-5 max-w-lg text-4xl font-semibold leading-tight tracking-tight">The road ahead is looking good.</h1>
          <p className="mt-3 max-w-md text-sm leading-6 text-white/75">Sign in to pick up where you left off, manage your tickets, and make your next trip yours.</p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-md">
        <div className="mb-7 text-center lg:text-left">
          <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-brand-700 lg:mx-0">
            <UserRound className="h-6 w-6" />
          </span>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-700">Welcome back</p>
          <h2 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">Log in to NexBus</h2>
          <p className="mt-2 text-sm text-slate-500">Enter your details to continue.</p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="mb-5 grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1">
            {personas.map((persona) => (
              <button
                key={persona.role}
                type="button"
                onClick={() => selectPersona(persona)}
                className={`rounded-lg px-2 py-2.5 text-xs font-medium transition ${
                  selectedRole === persona.role ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {persona.label}
              </button>
            ))}
          </div>

          {error && <div role="alert" className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-xs text-rose-800">{error}</div>}

          <form onSubmit={handleLogin} className="space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-slate-700">Email address</span>
              <span className="relative block">
                <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                <input type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-400 focus:ring-4 focus:ring-brand-100" placeholder="you@example.com" />
              </span>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-slate-700">Password</span>
              <span className="relative block">
                <LockKeyhole className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                <input type="password" required autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-400 focus:ring-4 focus:ring-brand-100" placeholder="Your password" />
              </span>
            </label>

            <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-wait disabled:opacity-60">
              {loading ? 'Signing in…' : 'Log in'} {!loading && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>

          <div className="my-5 flex items-center gap-3 text-[11px] text-slate-400">
            <span className="h-px flex-1 bg-slate-100" /> or use a demo account <span className="h-px flex-1 bg-slate-100" />
          </div>
          <button type="button" onClick={handleDemoLogin} disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-60">
            <ShieldCheck className="h-4 w-4 text-emerald-600" /> Continue as {personas.find((persona) => persona.role === selectedRole)?.label}
          </button>
          <p className="mt-5 text-center text-xs text-slate-500">
            New to NexBus? <Link to="/register" className="font-semibold text-brand-700 hover:text-brand-800">Create an account</Link>
          </p>
        </div>
      </section>
    </div>
  );
}
