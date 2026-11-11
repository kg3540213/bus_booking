import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Building2, BusFront, LockKeyhole, Mail, MapPin, Phone, UserRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [selectedRole, setSelectedRole] = useState('CUSTOMER');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companyCode, setCompanyCode] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload = {
        name, email, password, phone, role: selectedRole,
        ...(selectedRole === 'OPERATOR' && {
          company_name: companyName,
          company_code: companyCode.toUpperCase(),
          company_phone: phone,
          company_address: companyAddress,
        }),
      };
      const result = await register(payload);
      if (result.success) navigate(selectedRole === 'OPERATOR' ? '/operator' : '/');
    } catch (err) {
      setError(err.message || 'We could not create your account. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = 'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-400 focus:ring-4 focus:ring-brand-100';

  return (
    <div className="mx-auto grid min-h-[calc(100vh-120px)] max-w-7xl items-center gap-8 px-5 py-10 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16 lg:px-10">
      <section className="order-2 mx-auto w-full max-w-xl lg:order-1">
        <div className="mb-6">
          <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-brand-700">
            {selectedRole === 'OPERATOR' ? <BusFront className="h-6 w-6" /> : <UserRound className="h-6 w-6" />}
          </span>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-700">Get started</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">Make room for a new journey.</h1>
          <p className="mt-2 text-sm text-slate-500">A few details and you’re ready to go.</p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="mb-5 grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1">
            {[
              ['CUSTOMER', 'I’m travelling'],
              ['OPERATOR', 'I run a fleet'],
            ].map(([role, label]) => (
              <button key={role} type="button" onClick={() => { setSelectedRole(role); setError(''); }} className={`rounded-lg px-3 py-2.5 text-xs font-medium transition ${selectedRole === role ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>
                {label}
              </button>
            ))}
          </div>

          {error && <div role="alert" className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-xs text-rose-800">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            {selectedRole === 'OPERATOR' && (
              <div className="space-y-3 rounded-2xl bg-slate-50 p-4">
                <h2 className="flex items-center gap-2 text-xs font-semibold text-slate-800"><Building2 className="h-4 w-4 text-brand-600" /> Fleet details</h2>
                <input aria-label="Company name" type="text" required value={companyName} onChange={(event) => setCompanyName(event.target.value)} className={inputClass} placeholder="Company or fleet name" />
                <div className="grid gap-3 sm:grid-cols-2">
                  <input aria-label="Company code" type="text" required minLength={2} maxLength={10} value={companyCode} onChange={(event) => setCompanyCode(event.target.value.toUpperCase())} className={`${inputClass} font-mono uppercase`} placeholder="Company code" />
                  <span className="relative block">
                    <MapPin className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                    <input aria-label="Depot address" type="text" required value={companyAddress} onChange={(event) => setCompanyAddress(event.target.value)} className={`${inputClass} pl-10`} placeholder="Depot city / address" />
                  </span>
                </div>
              </div>
            )}

            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-slate-700">Full name</span>
              <span className="relative block">
                <UserRound className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                <input type="text" required minLength={2} autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} className={`${inputClass} pl-10`} placeholder="Your name" />
              </span>
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-slate-700">Email address</span>
                <span className="relative block">
                  <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                  <input type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className={`${inputClass} pl-10`} placeholder="you@example.com" />
                </span>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-slate-700">Phone number</span>
                <span className="relative block">
                  <Phone className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                  <input type="tel" required autoComplete="tel" value={phone} onChange={(event) => setPhone(event.target.value)} className={`${inputClass} pl-10`} placeholder="+91 98765 43210" />
                </span>
              </label>
            </div>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-slate-700">Password <span className="font-normal text-slate-400">(at least 6 characters)</span></span>
              <span className="relative block">
                <LockKeyhole className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                <input type="password" required minLength={6} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} className={`${inputClass} pl-10`} placeholder="Create a password" />
              </span>
            </label>

            <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-wait disabled:opacity-60">
              {loading ? 'Creating account…' : 'Create account'} {!loading && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>

          <p className="mt-5 text-center text-xs text-slate-500">
            Already have an account? <Link to="/login" className="font-semibold text-brand-700 hover:text-brand-800">Log in</Link>
          </p>
        </div>
      </section>

      <section className="relative order-1 hidden min-h-[570px] overflow-hidden rounded-[2rem] bg-slate-950 lg:order-2 lg:block">
        <img
          src="https://images.unsplash.com/photo-1494783367193-149034c05e8f?auto=format&fit=crop&w=1400&q=85"
          alt="A scenic road through the mountains"
          className="absolute inset-0 h-full w-full object-cover opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/15 to-slate-950/10" />
        <div className="absolute bottom-0 p-10 text-white">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs backdrop-blur"><BusFront className="h-4 w-4" /> Travel at your own pace</span>
          <h2 className="mt-5 max-w-lg text-4xl font-semibold leading-tight tracking-tight">Good trips start with a simple plan.</h2>
          <p className="mt-3 max-w-md text-sm leading-6 text-white/75">Choose your route, find your seat, and leave the rest to us.</p>
        </div>
      </section>
    </div>
  );
}
