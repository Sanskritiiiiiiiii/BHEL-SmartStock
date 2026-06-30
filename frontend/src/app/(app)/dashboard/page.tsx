'use client';

import { useEffect, useState } from 'react';
import { dashboardApi } from '@/lib/api';
import { DashboardStats } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Package, Warehouse, AlertTriangle, FileInput, FileOutput, Users, ArrowUpRight, Clock, Check } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, StatCard, Spinner, StatusBadge } from '@/components/ui';
import Link from 'next/link';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const COLORS = ['#2563eb','#10b981','#f59e0b','#ef4444','#8b5cf6','#14b8a6','#f97316','#06b6d4'];

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-900 dark:bg-gray-800 border border-gray-800 dark:border-gray-700 rounded-xl px-3 py-2.5 shadow-xl text-xs">
      <p className="text-gray-400 mb-1.5 font-semibold">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="flex items-center gap-2 font-bold text-white">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          {p.name}: <span className="tabular">{p.value}</span>
        </p>
      ))}
    </div>
  );
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi.getStats().then(res => setData(res.data.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center min-h-96">
      <Spinner className="h-7 w-7" />
    </div>
  );
  if (!data) return null;

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-screen-2xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">Dashboard</h1>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">Overview of your material management operations</p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 lg:gap-4">
        <StatCard title="Total Materials" value={data.stats.totalMaterials} icon={<Package size={16} />} color="blue" />
        <StatCard title="Inventory Value" value={formatCurrency(data.stats.inventoryValue)} icon={<Warehouse size={16} />} color="green" />
        <StatCard title="Low Stock" value={data.stats.lowStockCount} icon={<AlertTriangle size={16} />} color="yellow" />
        <StatCard title="Pending SRVs" value={data.stats.pendingSRVs} icon={<FileInput size={16} />} color="orange" />
        <StatCard title="Pending SIVs" value={data.stats.pendingSIVs} icon={<FileOutput size={16} />} color="purple" />
        <StatCard title="Suppliers" value={data.stats.totalSuppliers} icon={<Users size={16} />} color="blue" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 lg:gap-5">
        <Card className="xl:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Stock Overview</CardTitle>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Current vs minimum stock levels</p>
              </div>
              <Link href="/inventory" className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center gap-1 font-semibold transition-colors">
                View all <ArrowUpRight size={12} />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-3 pb-1">
            {data.stockSummary.length > 0 ? (
              <ResponsiveContainer width="100%" height={236}>
                <BarChart data={data.stockSummary} margin={{ top: 5, right: 5, left: -25, bottom: 35 }} barGap={3}>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-gray-100 dark:text-gray-800" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9ca3af' }} angle={-30} textAnchor="end" axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,.02)' }} />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 14 }} iconType="circle" iconSize={7} />
                  <Bar dataKey="current" name="Current" fill="#2563eb" radius={[5, 5, 0, 0]} maxBarSize={24} />
                  <Bar dataKey="minimum" name="Minimum" fill="#e5e7eb" radius={[5, 5, 0, 0]} maxBarSize={24} className="dark:fill-gray-700" />
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="flex items-center justify-center h-56 text-gray-400 text-sm">No data</div>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Material Categories</CardTitle>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">By category</p>
          </CardHeader>
          <CardContent className="pt-1">
            {data.categoryDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={236}>
                <PieChart>
                  <Pie data={data.categoryDistribution} cx="50%" cy="45%" innerRadius={52} outerRadius={82} dataKey="count" nameKey="name" paddingAngle={2}>
                    {data.categoryDistribution.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} strokeWidth={0} />)}
                  </Pie>
                  <Tooltip formatter={(v) => [v, 'Materials']} contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 8px 32px rgba(0,0,0,0.15)', fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 10 }} iconType="circle" iconSize={7} />
                </PieChart>
              </ResponsiveContainer>
            ) : <div className="flex items-center justify-center h-56 text-gray-400 text-sm">No data</div>}
          </CardContent>
        </Card>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5">

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Low Stock Alerts</CardTitle>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Below minimum threshold</p>
              </div>
              <Link href="/inventory?filter=low" className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center gap-1 font-semibold transition-colors">
                View all <ArrowUpRight size={12} />
              </Link>
            </div>
          </CardHeader>
          {data.lowStockMaterials.length === 0 ? (
            <CardContent>
              <div className="flex items-center gap-3 py-3.5 px-4 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl">
                <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <Check size={14} strokeWidth={3} />
                </div>
                <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">All stocks are adequate</p>
              </div>
            </CardContent>
          ) : (
            <div className="divide-y divide-gray-50 dark:divide-gray-800/60">
              {data.lowStockMaterials.map(m => {
                const pct = m.minimumStock > 0 ? (m.currentStock / m.minimumStock) * 100 : 0;
                return (
                  <div key={m.id} className="px-5 sm:px-6 py-3 flex items-center gap-3.5">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs flex-shrink-0 font-bold ${m.currentStock === 0 ? 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400' : 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400'}`}>
                      {m.currentStock === 0 ? '0' : '!'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-gray-800 dark:text-gray-200 truncate">{m.name}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <div className="flex-1 h-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden max-w-[120px]">
                          <div className={`h-full rounded-full ${m.currentStock === 0 ? 'bg-red-500' : 'bg-amber-500'}`} style={{ width: `${Math.min(100, pct)}%` }} />
                        </div>
                        <span className="text-[11px] text-gray-400 dark:text-gray-500 tabular flex-shrink-0">{m.currentStock}/{m.minimumStock} {m.unit}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Activity</CardTitle>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Latest SRVs and SIVs</p>
              </div>
              <Clock size={13} className="text-gray-300 dark:text-gray-600" />
            </div>
          </CardHeader>
          <div className="divide-y divide-gray-50 dark:divide-gray-800/60">
            {[...data.recentActivity.srvs.slice(0,3).map(s => ({ ...s, type: 'SRV' as const })),
              ...data.recentActivity.sivs.slice(0,3).map(s => ({ ...s, type: 'SIV' as const }))].slice(0,6).map(item => (
              <div key={item.id} className="px-5 sm:px-6 py-3 flex items-center gap-3">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${item.type === 'SRV' ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400' : 'bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400'}`}>
                  {item.type === 'SRV' ? <FileInput size={13} /> : <FileOutput size={13} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold font-mono text-gray-700 dark:text-gray-300">
                      {item.type === 'SRV' ? (item as typeof data.recentActivity.srvs[0]).srvNumber : (item as typeof data.recentActivity.sivs[0]).sivNumber}
                    </span>
                    <StatusBadge status={item.status} />
                  </div>
                  <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5 truncate">
                    {item.type === 'SRV' ? (item as typeof data.recentActivity.srvs[0]).supplier?.name : (item as typeof data.recentActivity.sivs[0]).department} · {formatDate(item.createdAt)}
                  </p>
                </div>
              </div>
            ))}
            {data.recentActivity.srvs.length === 0 && data.recentActivity.sivs.length === 0 && (
              <div className="px-6 py-8 text-center text-sm text-gray-400">No recent activity</div>
            )}
          </div>
        </Card>
      </div>

      {/* Supplier performance */}
      {data.suppliers.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Supplier Performance</CardTitle>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Top suppliers by bid performance</p>
              </div>
              <Link href="/suppliers" className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center gap-1 font-semibold transition-colors">
                Manage <ArrowUpRight size={12} />
              </Link>
            </div>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800/80">
                  {['Supplier','Total Bids','Won','Win Rate','Rating'].map(h => (
                    <th key={h} className="px-5 sm:px-6 py-3 text-left text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800/60">
                {data.suppliers.map((s, i) => {
                  const winRate = s.totalBids > 0 ? ((s.wonBids / s.totalBids) * 100).toFixed(0) : '0';
                  return (
                    <tr key={i} className="hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition-colors">
                      <td className="px-5 sm:px-6 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-gray-900 dark:bg-gray-700 flex items-center justify-center text-white text-xs font-bold">{s.name.charAt(0)}</div>
                          <span className="font-semibold text-gray-800 dark:text-gray-200">{s.name}</span>
                        </div>
                      </td>
                      <td className="px-5 sm:px-6 py-3.5 text-gray-500 dark:text-gray-400 tabular">{s.totalBids}</td>
                      <td className="px-5 sm:px-6 py-3.5 text-gray-500 dark:text-gray-400 tabular">{s.wonBids}</td>
                      <td className="px-5 sm:px-6 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                            <div className="h-full rounded-full bg-blue-500" style={{ width: `${winRate}%` }} />
                          </div>
                          <span className="text-xs font-bold text-gray-600 dark:text-gray-300 tabular">{winRate}%</span>
                        </div>
                      </td>
                      <td className="px-5 sm:px-6 py-3.5">
                        <div className="flex items-center gap-0.5">
                          {[1,2,3,4,5].map(star => <div key={star} className={`w-2.5 h-2.5 rounded-sm ${star <= Math.round(s.rating) ? 'bg-amber-400' : 'bg-gray-100 dark:bg-gray-800'}`} />)}
                          <span className="text-xs text-gray-400 dark:text-gray-500 ml-1.5 tabular">{s.rating}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
