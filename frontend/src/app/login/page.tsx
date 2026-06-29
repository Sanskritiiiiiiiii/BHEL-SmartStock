'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';
import { Package, Eye, EyeOff, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      router.push('/dashboard');
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Invalid credentials';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const quickLogins = [
    { label: 'Admin', role: 'Administrator', email: 'admin@mmis.com', password: 'admin123', color: 'from-red-500 to-rose-600' },
    { label: 'Manager', role: 'Store Manager', email: 'manager@mmis.com', password: 'manager123', color: 'from-blue-500 to-blue-700' },
    { label: 'Officer', role: 'Inv. Officer', email: 'officer@mmis.com', password: 'officer123', color: 'from-emerald-500 to-green-600' },
    { label: 'Vendor', role: 'Vendor', email: 'vendor@techsupply.com', password: 'vendor123', color: 'from-amber-500 to-orange-600' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-blue-600/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-blue-800/10 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-blue-900/5 blur-3xl" />
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)', backgroundSize: '50px 50px' }} />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl mb-4 shadow-2xl shadow-blue-900/50">
            <Package className="text-white" size={30} />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">MMIS</h1>
          <p className="text-blue-300 text-sm mt-1.5">Material Management & Inventory System</p>
        </div>

        {/* Card */}
        <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
          <h2 className="text-xl font-bold text-white mb-1">Sign in</h2>
          <p className="text-blue-300/70 text-sm mb-6">Access your workspace</p>

          {error && (
            <div className="mb-5 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-300 flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0 text-xs">!</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-blue-300/70 uppercase tracking-wide mb-1.5">Email address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-blue-300/70 uppercase tracking-wide mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-3 pr-11 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full mt-2 py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all duration-150 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-blue-900/30 group">
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Sign in <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" /></>
              )}
            </button>
          </form>

          {/* Quick login */}
          <div className="mt-6 pt-6 border-t border-white/10">
            <p className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-3 text-center">Demo Accounts</p>
            <div className="grid grid-cols-2 gap-2">
              {quickLogins.map(ql => (
                <button key={ql.label} type="button" onClick={() => { setEmail(ql.email); setPassword(ql.password); }}
                  className="flex items-center gap-2.5 p-2.5 rounded-xl border border-white/10 hover:bg-white/5 hover:border-white/20 transition-all text-left group">
                  <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${ql.color} flex items-center justify-center text-xs font-bold text-white flex-shrink-0`}>
                    {ql.label[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-white">{ql.label}</p>
                    <p className="text-xs text-white/40 truncate">{ql.role}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-white/20 mt-6">MMIS v1.0 · Enterprise Material Management</p>
      </div>
    </div>
  );
}
