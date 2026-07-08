'use client';

import { useEffect, useState } from 'react';
import { dashboardApi } from '@/lib/api';
import { DashboardStats } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Package, Warehouse, AlertTriangle, FileInput, FileOutput, Users, TrendingUp, ArrowUpRight, Clock } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, StatCard, Badge, Spinner, StatusBadge } from '@/components/ui';
import Link from 'next/link';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, Area, AreaChart,
} from 'recharts';

const COLORS = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#14b8a6','#f97316','#06b6d4'];

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-900 dark:bg-gray-800 border border-gray-700 rounded-xl p-3 shadow-xl text-xs">
      <p className="text-gray-400 mb-1.5 font-medium">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="flex items-center gap-2 font-semibold" style={{ color: p.color }}>
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi.getStats()
      .then(res => setData(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center min-h-96">
      <div className="flex flex-col items-center gap-3">
        <Spinner className="h-8 w-8" />
        <p className="text-sm text-gray-400">Loading dashboard...</p>
      </div>
    </div>
  );
  if (!data) return null;

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-screen-2xl mx-auto">

      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 rounded-2xl p-5 lg:p-6 text-white relative overflow-hidden">
        <div className="absolute right-0 top-0 w-48 h-full opacity-10">
          <div className="absolute right-8 top-4 w-24 h-24 rounded-full border-4 border-white" />
          <div className="absolute right-0 top-8 w-32 h-32 rounded-full border-4 border-white" />
        </div>
        <div className="relative">
          <p className="text-blue-100 text-sm font-medium">Good day 👋</p>
          <h1 className="text-xl lg:text-2xl font-bold mt-0.5">Material Management Dashboard</h1>
          <p className="text-blue-200 text-sm mt-1">Here&apos;s an overview of your inventory and operations</p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 lg:gap-4">
        <StatCard title="Total Materials" value={data.stats.totalMaterials} icon={<Package size={20} />} color="blue" />
        <StatCard title="Inventory Value" value={formatCurrency(data.stats.inventoryValue)} icon={<Warehouse size={20} />} color="green" />
        <StatCard title="Low Stock" value={data.stats.lowStockCount} icon={<AlertTriangle size={20} />} color="yellow" subtitle={data.stats.lowStockCount > 0 ? 'Need attention' : 'All good'} />
        <StatCard title="Pending SRVs" value={data.stats.pendingSRVs} icon={<FileInput size={20} />} color="orange" />
        <StatCard title="Pending SIVs" value={data.stats.pendingSIVs} icon={<FileOutput size={20} />} color="purple" />
        <StatCard title="Suppliers" value={data.stats.totalSuppliers} icon={<Users size={20} />} color="blue" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 lg:gap-6">

        {/* Stock Overview */}
        <Card className="xl:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Stock Overview</CardTitle>
                <p className="text-xs text-gray-400 mt-0.5">Current vs minimum stock levels</p>
              </div>
              <Link href="/inventory" className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium">
                View all <ArrowUpRight size={12} />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-2 pb-2">
            {data.stockSummary.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={data.stockSummary} margin={{ top: 5, right: 10, left: -20, bottom: 35 }} barGap={3}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" className="dark:opacity-10" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} angle={-30} textAnchor="end" axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 16 }} />
                  <Bar dataKey="current" name="Current" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={28} />
                  <Bar dataKey="minimum" name="Minimum" fill="#fbbf24" radius={[4, 4, 0, 0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-56 text-gray-400 text-sm">No stock data available</div>
            )}
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Material Categories</CardTitle>
            <p className="text-xs text-gray-400 mt-0.5">Distribution by category</p>
          </CardHeader>
          <CardContent className="pt-0">
            {data.categoryDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={data.categoryDistribution} cx="50%" cy="45%" innerRadius={55} outerRadius={85} dataKey="count" nameKey="name" paddingAngle={3}>
                    {data.categoryDistribution.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} strokeWidth={0} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => [v, 'Materials']} contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 8px 32px rgba(0,0,0,0.15)', fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 10 }} iconType="circle" iconSize={8} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-56 text-gray-400 text-sm">No data</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">

        {/* Low Stock Alerts */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>⚠️ Low Stock Alerts</CardTitle>
                <p className="text-xs text-gray-400 mt-0.5">Materials below minimum threshold</p>
              </div>
              <Link href="/inventory?filter=low" className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium">
                View all <ArrowUpRight size={12} />
              </Link>
            </div>
          </CardHeader>
          {data.lowStockMaterials.length === 0 ? (
            <CardContent>
              <div className="flex items-center gap-3 py-4 px-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl">
                <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center text-emerald-600 text-lg">✓</div>
                <div>
                  <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">All stocks adequate</p>
                  <p className="text-xs text-emerald-600/70 dark:text-emerald-500">No materials below minimum levels</p>
                </div>
              </div>
            </CardContent>
          ) : (
            <div className="divide-y divide-gray-50 dark:divide-gray-800">
              {data.lowStockMaterials.map(m => {
                const pct = m.minimumStock > 0 ? (m.currentStock / m.minimumStock) * 100 : 0;
                return (
                  <div key={m.id} className="px-6 py-3.5 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm flex-shrink-0 font-bold ${m.currentStock === 0 ? 'bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400' : 'bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400'}`}>
                      {m.currentStock === 0 ? '0' : '!'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">{m.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${m.currentStock === 0 ? 'bg-red-500' : 'bg-amber-500'}`} style={{ width: `${Math.min(100, pct)}%` }} />
                        </div>
                        <span className="text-xs text-gray-400 font-mono flex-shrink-0">
                          {m.currentStock}/{m.minimumStock} {m.unit}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Activity</CardTitle>
                <p className="text-xs text-gray-400 mt-0.5">Latest SRVs and SIVs</p>
              </div>
              <Clock size={14} className="text-gray-400" />
            </div>
          </CardHeader>
          <div className="divide-y divide-gray-50 dark:divide-gray-800">
            {[...data.recentActivity.srvs.slice(0, 3).map(s => ({ ...s, type: 'SRV' as const })),
              ...data.recentActivity.sivs.slice(0, 3).map(s => ({ ...s, type: 'SIV' as const }))]
              .slice(0, 6)
              .map((item) => (
                <div key={item.id} className="px-6 py-3.5 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${item.type === 'SRV' ? 'bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400' : 'bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400'}`}>
                    {item.type === 'SRV' ? <FileInput size={14} /> : <FileOutput size={14} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold font-mono text-gray-700 dark:text-gray-300">
                        {item.type === 'SRV' ? (item as typeof data.recentActivity.srvs[0]).srvNumber : (item as typeof data.recentActivity.sivs[0]).sivNumber}
                      </span>
                      <StatusBadge status={item.status} />
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">
                      {item.type === 'SRV'
                        ? (item as typeof data.recentActivity.srvs[0]).supplier?.name
                        : (item as typeof data.recentActivity.sivs[0]).department
                      } · {formatDate(item.createdAt)}
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

      {/* Supplier Performance */}
      {data.suppliers.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Supplier Performance</CardTitle>
                <p className="text-xs text-gray-400 mt-0.5">Top suppliers by bid performance</p>
              </div>
              <Link href="/suppliers" className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium">
                Manage <ArrowUpRight size={12} />
              </Link>
            </div>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  {['Supplier', 'Total Bids', 'Won', 'Win Rate', 'Rating'].map(h => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {data.suppliers.map((s, i) => {
                  const winRate = s.totalBids > 0 ? ((s.wonBids / s.totalBids) * 100).toFixed(0) : '0';
                  return (
                    <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-xs font-bold">
                            {s.name.charAt(0)}
                          </div>
                          <span className="font-semibold text-gray-800 dark:text-gray-200">{s.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3.5 text-gray-500 dark:text-gray-400">{s.totalBids}</td>
                      <td className="px-6 py-3.5 text-gray-500 dark:text-gray-400">{s.wonBids}</td>
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div className="h-full rounded-full bg-blue-500" style={{ width: `${winRate}%` }} />
                          </div>
                          <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">{winRate}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-1">
                          {[1,2,3,4,5].map(star => (
                            <div key={star} className={`w-3 h-3 rounded-sm ${star <= Math.round(s.rating) ? 'bg-amber-400' : 'bg-gray-100 dark:bg-gray-700'}`} />
                          ))}
                          <span className="text-xs text-gray-400 ml-1">{s.rating}</span>
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
