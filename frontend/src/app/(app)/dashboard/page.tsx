'use client';

import { useEffect, useState } from 'react';
import { dashboardApi } from '@/lib/api';
import { DashboardStats } from '@/types';
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils';
import {
  Package, Warehouse, AlertTriangle, FileInput,
  FileOutput, Users, TrendingUp, ArrowRight
} from 'lucide-react';
import {
  Card, CardHeader, CardTitle, CardContent,
  StatCard, Badge, Spinner, Table, TableHead,
  TableBody, TableRow, TableHeader, TableCell
} from '@/components/ui';
import Link from 'next/link';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line
} from 'recharts';

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6'];

export default function DashboardPage() {
  const [data, setData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi.getStats()
      .then((res) => setData(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-64">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Overview of your material management operations</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          title="Total Materials"
          value={data.stats.totalMaterials}
          icon={<Package size={20} />}
          color="blue"
        />
        <StatCard
          title="Inventory Value"
          value={formatCurrency(data.stats.inventoryValue)}
          icon={<Warehouse size={20} />}
          color="green"
        />
        <StatCard
          title="Low Stock"
          value={data.stats.lowStockCount}
          icon={<AlertTriangle size={20} />}
          color="yellow"
        />
        <StatCard
          title="Pending SRVs"
          value={data.stats.pendingSRVs}
          icon={<FileInput size={20} />}
          color="orange"
        />
        <StatCard
          title="Pending SIVs"
          value={data.stats.pendingSIVs}
          icon={<FileOutput size={20} />}
          color="purple"
        />
        <StatCard
          title="Suppliers"
          value={data.stats.totalSuppliers}
          icon={<Users size={20} />}
          color="blue"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stock Summary Bar Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Stock Overview (Top Materials)</CardTitle>
          </CardHeader>
          <CardContent>
            {data.stockSummary.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={data.stockSummary} margin={{ top: 5, right: 10, left: 0, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="current" name="Current Stock" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="minimum" name="Min Stock" fill="#fbbf24" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-400 text-sm">No data available</div>
            )}
          </CardContent>
        </Card>

        {/* Category Distribution Pie */}
        <Card>
          <CardHeader>
            <CardTitle>Material Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {data.categoryDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={data.categoryDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    dataKey="count"
                    nameKey="name"
                  >
                    {data.categoryDistribution.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => [v, 'Materials']} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-400 text-sm">No categories</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Alert */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Low Stock Alerts</CardTitle>
            <Link href="/inventory?filter=low" className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {data.lowStockMaterials.length > 0 ? (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeader>Material</TableHeader>
                    <TableHeader>Current</TableHeader>
                    <TableHeader>Minimum</TableHeader>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.lowStockMaterials.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-gray-800 text-xs">{m.name}</p>
                          <p className="text-xs text-gray-400">{m.code}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`text-xs font-semibold ${m.currentStock === 0 ? 'text-red-600' : 'text-yellow-600'}`}>
                          {m.currentStock} {m.unit}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-gray-500">{m.minimumStock} {m.unit}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="py-8 text-center text-sm text-gray-400">All stocks are adequate ✓</div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-100">
              {data.recentActivity.srvs.slice(0, 3).map((srv) => (
                <div key={srv.id} className="px-6 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-blue-50 rounded-lg">
                      <FileInput size={14} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{srv.srvNumber}</p>
                      <p className="text-xs text-gray-400">
                        {srv.supplier?.name} · {formatDate(srv.createdAt)}
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${getStatusColor(srv.status)}`}>
                    {srv.status}
                  </span>
                </div>
              ))}
              {data.recentActivity.sivs.slice(0, 3).map((siv) => (
                <div key={siv.id} className="px-6 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-purple-50 rounded-lg">
                      <FileOutput size={14} className="text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{siv.sivNumber}</p>
                      <p className="text-xs text-gray-400">
                        {siv.department} · {formatDate(siv.createdAt)}
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${getStatusColor(siv.status)}`}>
                    {siv.status}
                  </span>
                </div>
              ))}
              {data.recentActivity.srvs.length === 0 && data.recentActivity.sivs.length === 0 && (
                <div className="py-8 text-center text-sm text-gray-400">No recent activity</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Supplier Stats */}
      {data.suppliers.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Supplier Performance</CardTitle>
              <TrendingUp size={16} className="text-gray-400" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Supplier</TableHeader>
                  <TableHeader>Total Bids</TableHeader>
                  <TableHeader>Won Bids</TableHeader>
                  <TableHeader>Win Rate</TableHeader>
                  <TableHeader>Rating</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.suppliers.map((s, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell>{s.totalBids}</TableCell>
                    <TableCell>{s.wonBids}</TableCell>
                    <TableCell>
                      <Badge variant={s.wonBids / Math.max(s.totalBids, 1) > 0.5 ? 'success' : 'warning'}>
                        {s.totalBids > 0 ? ((s.wonBids / s.totalBids) * 100).toFixed(0) : 0}%
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-yellow-600 font-medium">{'★'.repeat(Math.round(s.rating))}</span>
                      <span className="text-gray-300">{'★'.repeat(5 - Math.round(s.rating))}</span>
                      <span className="text-xs text-gray-400 ml-1">({s.rating})</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
