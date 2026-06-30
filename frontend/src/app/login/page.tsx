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
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const quickLogins = [
    { label: 'Admin', role: 'Administrator', email: 'admin@mmis.com', password: 'admin123', dot: 'bg-red-500' },
    { label: 'Manager', role: 'Store Manager', email: 'manager@mmis.com', password: 'manager123', dot: 'bg-blue-500' },
    { label: 'Officer', role: 'Inv. Officer', email: 'officer@mmis.com', password: 'officer123', dot: 'bg-emerald-500' },
    { label: 'Vendor', role: 'Vendor', email: 'vendor@techsupply.com', password: 'vendor123', dot: 'bg-amber-500' },
  ];

  return (
    <div className="min-h-screen bg-canvas dark:bg-canvas-dark flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-7">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-900 dark:bg-white rounded-2xl mb-4">
            <Package className="text-white dark:text-gray-900" size={22} />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">MMIS</h1>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Material Management & Inventory System</p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-[#15191f] border border-gray-100 dark:border-gray-800/80 rounded-2xl p-7 shadow-card-md">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Sign in</h2>
          <p className="text-gray-400 dark:text-gray-500 text-sm mb-6">Access your workspace</p>

          {error && (
            <div className="mb-5 px-3.5 py-2.5 bg-red-50 dark:bg-red-500/10 rounded-xl text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center flex-shrink-0 text-[10px] font-bold">!</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Email address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" required
                className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 dark:focus:ring-blue-500/40 focus:border-gray-300 dark:focus:border-blue-600 transition-all" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Password</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required
                  className="w-full px-3.5 py-2.5 pr-10 bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 dark:focus:ring-blue-500/40 focus:border-gray-300 dark:focus:border-blue-600 transition-all" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full mt-1 py-2.5 px-4 bg-gray-900 dark:bg-blue-600 hover:bg-gray-800 dark:hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group">
              {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Sign in <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" /></>}
            </button>
          </form>

          {/* Quick login */}
          <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800">
            <p className="text-[10px] font-bold text-gray-300 dark:text-gray-600 uppercase tracking-widest mb-3">Demo Accounts</p>
            <div className="grid grid-cols-2 gap-2">
              {quickLogins.map(ql => (
                <button key={ql.label} type="button" onClick={() => { setEmail(ql.email); setPassword(ql.password); }}
                  className="flex items-center gap-2.5 p-2.5 rounded-xl border border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-all text-left">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${ql.dot}`} />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-gray-700 dark:text-gray-200">{ql.label}</p>
                    <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate">{ql.role}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-gray-300 dark:text-gray-700 mt-6">MMIS v1.0 · Enterprise Material Management</p>
      </div>
    </div>
  );
}
