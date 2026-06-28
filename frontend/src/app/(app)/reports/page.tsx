'use client';

import { useState } from 'react';
import { reportsApi } from '@/lib/api';
import { toast } from 'sonner';
import { BarChart3, Package, Users, FileInput, FileOutput, TrendingUp, Download } from 'lucide-react';
import {
  Card, CardContent, CardHeader, CardTitle, Button, Badge, Spinner, StatusBadge,
  Table, TableHead, TableBody, TableRow, TableHeader, TableCell
} from '@/components/ui';
import { formatDate, formatCurrency } from '@/lib/utils';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';

type ReportType = 'inventory' | 'suppliers' | 'srv' | 'siv' | 'forecasts';

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6'];

const reportTabs = [
  { key: 'inventory' as ReportType, label: 'Inventory', icon: <Package size={15} /> },
  { key: 'suppliers' as ReportType, label: 'Suppliers', icon: <Users size={15} /> },
  { key: 'srv' as ReportType, label: 'SRV', icon: <FileInput size={15} /> },
  { key: 'siv' as ReportType, label: 'SIV', icon: <FileOutput size={15} /> },
  { key: 'forecasts' as ReportType, label: 'Forecast', icon: <TrendingUp size={15} /> },
];

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<ReportType>('inventory');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loaded, setLoaded] = useState<ReportType | null>(null);

  const loadReport = async (type: ReportType) => {
    setActiveTab(type);
    if (loaded === type) return;
    setLoading(true);
    try {
      let res;
      if (type === 'inventory') res = await reportsApi.getInventory();
      else if (type === 'suppliers') res = await reportsApi.getSuppliers();
      else if (type === 'srv') res = await reportsApi.getSRV();
      else if (type === 'siv') res = await reportsApi.getSIV();
      else res = await reportsApi.getForecasts();
      setData(res.data.data);
      setLoaded(type);
    } catch {
      toast.error('Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  const renderInventoryReport = () => {
    const d = data as {
      stats: { total: number; lowStock: number; outOfStock: number; adequate: number; totalValue: number };
      inventory: Array<{ material: { name: string; materialCode: string; category: string; unit: string; minimumStock: number }; currentStock: number; lastUpdated: string }>;
    };
    if (!d) return null;
    const pieData = [
      { name: 'Adequate', value: d.stats.adequate },
      { name: 'Low Stock', value: d.stats.lowStock },
      { name: 'Out of Stock', value: d.stats.outOfStock },
    ];
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: 'Total Items', value: d.stats.total, color: 'text-blue-600' },
            { label: 'Adequate', value: d.stats.adequate, color: 'text-green-600' },
            { label: 'Low Stock', value: d.stats.lowStock, color: 'text-yellow-600' },
            { label: 'Out of Stock', value: d.stats.outOfStock, color: 'text-red-600' },
            { label: 'Est. Value', value: formatCurrency(d.stats.totalValue), color: 'text-purple-600' },
          ].map((stat) => (
            <div key={stat.label} className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-500">{stat.label}</p>
              <p className={`text-xl font-bold mt-0.5 ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Stock Status Distribution</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" nameKey="name">
                  {pieData.map((_, i) => <Cell key={i} fill={['#22c55e', '#f59e0b', '#ef4444'][i]} />)}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Stock by Category</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={Object.entries(
                  d.inventory.reduce((acc: Record<string, number>, inv) => {
                    const cat = inv.material.category;
                    acc[cat] = (acc[cat] || 0) + inv.currentStock;
                    return acc;
                  }, {})
                ).map(([name, value]) => ({ name, value }))}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>Material</TableHeader>
              <TableHeader>Code</TableHeader>
              <TableHeader>Category</TableHeader>
              <TableHeader>Current Stock</TableHeader>
              <TableHeader>Min Stock</TableHeader>
              <TableHeader>Status</TableHeader>
              <TableHeader>Last Updated</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {d.inventory.map((inv, i) => {
              const status = inv.currentStock === 0 ? 'danger' : inv.currentStock <= inv.material.minimumStock ? 'warning' : 'success';
              return (
                <TableRow key={i}>
                  <TableCell className="font-medium">{inv.material.name}</TableCell>
                  <TableCell><span className="font-mono text-xs">{inv.material.materialCode}</span></TableCell>
                  <TableCell className="text-gray-500">{inv.material.category}</TableCell>
                  <TableCell className="font-semibold">{inv.currentStock} {inv.material.unit}</TableCell>
                  <TableCell className="text-gray-400">{inv.material.minimumStock}</TableCell>
                  <TableCell>
                    <Badge variant={status as 'danger' | 'warning' | 'success'}>
                      {status === 'danger' ? 'Out of Stock' : status === 'warning' ? 'Low' : 'OK'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-400 text-xs">{formatDate(inv.lastUpdated)}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    );
  };

  const renderSupplierReport = () => {
    const suppliers = data as Array<{
      name: string; email: string; rating: number; totalBids: number; wonBids: number;
      winRate: string; totalBidAmount: number; totalSRVs: number; approvedSRVs: number;
    }>;
    if (!suppliers) return null;
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Win Rate Comparison</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={suppliers.map((s) => ({ name: s.name.split(' ')[0], rate: parseFloat(s.winRate) }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis unit="%" tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [`${v}%`, 'Win Rate']} />
                <Bar dataKey="rate" fill="#22c55e" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Total Bid Amounts (₹)</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={suppliers.map((s) => ({ name: s.name.split(' ')[0], amount: s.totalBidAmount }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [formatCurrency(Number(v)), 'Total Bids']} />
                <Bar dataKey="amount" fill="#3b82f6" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>Supplier</TableHeader>
              <TableHeader>Email</TableHeader>
              <TableHeader>Rating</TableHeader>
              <TableHeader>Total Bids</TableHeader>
              <TableHeader>Won Bids</TableHeader>
              <TableHeader>Win Rate</TableHeader>
              <TableHeader>SRVs</TableHeader>
              <TableHeader>Total Bid Value</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {suppliers.map((s, i) => (
              <TableRow key={i}>
                <TableCell className="font-semibold">{s.name}</TableCell>
                <TableCell className="text-gray-500">{s.email}</TableCell>
                <TableCell>
                  <span className="text-yellow-500">{'★'.repeat(Math.round(s.rating))}</span>
                  <span className="text-xs text-gray-400 ml-1">({s.rating})</span>
                </TableCell>
                <TableCell>{s.totalBids}</TableCell>
                <TableCell>{s.wonBids}</TableCell>
                <TableCell>
                  <Badge variant={parseFloat(s.winRate) > 50 ? 'success' : 'warning'}>{s.winRate}%</Badge>
                </TableCell>
                <TableCell>{s.approvedSRVs}/{s.totalSRVs}</TableCell>
                <TableCell className="font-medium">{formatCurrency(s.totalBidAmount)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  const renderSRVReport = () => {
    const d = data as {
      stats: { total: number; pending: number; approved: number; rejected: number };
      srvs: Array<{ srvNumber: string; supplier: { name: string }; receiptDate: string; status: string; items: unknown[] }>;
    };
    if (!d) return null;
    const pieData = [
      { name: 'Approved', value: d.stats.approved },
      { name: 'Pending', value: d.stats.pending },
      { name: 'Rejected', value: d.stats.rejected },
    ].filter((p) => p.value > 0);

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Total SRVs', value: d.stats.total, color: 'text-blue-600' },
            { label: 'Approved', value: d.stats.approved, color: 'text-green-600' },
            { label: 'Pending', value: d.stats.pending, color: 'text-yellow-600' },
            { label: 'Rejected', value: d.stats.rejected, color: 'text-red-600' },
          ].map((s) => (
            <div key={s.label} className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className={`text-xl font-bold mt-0.5 ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {pieData.length > 0 && (
          <div className="w-64 mx-auto">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={70} dataKey="value" nameKey="name">
                  {pieData.map((_, i) => <Cell key={i} fill={['#22c55e', '#f59e0b', '#ef4444'][i]} />)}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>SRV Number</TableHeader>
              <TableHeader>Supplier</TableHeader>
              <TableHeader>Receipt Date</TableHeader>
              <TableHeader>Items</TableHeader>
              <TableHeader>Status</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {d.srvs.map((srv, i) => (
              <TableRow key={i}>
                <TableCell><span className="font-mono text-xs font-bold text-blue-700">{srv.srvNumber}</span></TableCell>
                <TableCell className="font-medium">{srv.supplier?.name}</TableCell>
                <TableCell className="text-gray-500">{formatDate(srv.receiptDate)}</TableCell>
                <TableCell><Badge variant="info">{(srv.items as unknown[]).length} items</Badge></TableCell>
                <TableCell><StatusBadge status={srv.status} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  const renderSIVReport = () => {
    const d = data as {
      stats: { total: number; pending: number; approved: number; rejected: number };
      departmentBreakdown: Array<{ name: string; count: number }>;
      sivs: Array<{ sivNumber: string; department: string; issueDate: string; status: string; items: unknown[] }>;
    };
    if (!d) return null;
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Total SIVs', value: d.stats.total, color: 'text-purple-600' },
            { label: 'Approved', value: d.stats.approved, color: 'text-green-600' },
            { label: 'Pending', value: d.stats.pending, color: 'text-yellow-600' },
            { label: 'Rejected', value: d.stats.rejected, color: 'text-red-600' },
          ].map((s) => (
            <div key={s.label} className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className={`text-xl font-bold mt-0.5 ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {d.departmentBreakdown.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">SIVs by Department</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={d.departmentBreakdown}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#8b5cf6" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>SIV Number</TableHeader>
              <TableHeader>Department</TableHeader>
              <TableHeader>Issue Date</TableHeader>
              <TableHeader>Items</TableHeader>
              <TableHeader>Status</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {d.sivs.map((siv, i) => (
              <TableRow key={i}>
                <TableCell><span className="font-mono text-xs font-bold text-purple-700">{siv.sivNumber}</span></TableCell>
                <TableCell className="font-medium">{siv.department}</TableCell>
                <TableCell className="text-gray-500">{formatDate(siv.issueDate)}</TableCell>
                <TableCell><Badge variant="info">{(siv.items as unknown[]).length} items</Badge></TableCell>
                <TableCell><StatusBadge status={siv.status} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  const renderForecastReport = () => {
    const forecasts = data as Array<{
      material: { name: string; materialCode: string; category: string };
      alpha: number;
      forecastData: { future: number[]; futureLabels: string[] };
      updatedAt: string;
    }>;
    if (!forecasts) return null;
    return (
      <div className="space-y-4">
        {forecasts.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No forecasts saved yet. Use the Forecasting module to generate forecasts.</p>
        ) : (
          forecasts.map((f, i) => {
            const future = f.forecastData?.future || [];
            return (
              <Card key={i}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <span className="font-semibold text-gray-800">{f.material?.name}</span>
                      <span className="text-xs text-gray-400 ml-2 font-mono">{f.material?.materialCode}</span>
                    </div>
                    <div className="text-xs text-gray-400">
                      α = {f.alpha} | Updated {formatDate(f.updatedAt)}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                    {(f.forecastData?.futureLabels || []).map((label: string, j: number) => (
                      <div key={j} className="bg-amber-50 border border-amber-200 rounded p-2 text-center">
                        <p className="text-xs text-amber-600">{label}</p>
                        <p className="font-bold text-gray-800">{future[j]?.toFixed(0) ?? '—'}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-sm text-gray-500 mt-1">Comprehensive reporting dashboard</p>
      </div>

      {/* Report Tabs */}
      <div className="flex gap-2 flex-wrap">
        {reportTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => loadReport(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
              activeTab === tab.key
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400 hover:text-blue-600'
            }`}
          >
            {tab.icon}
            {tab.label} Report
          </button>
        ))}
      </div>

      {/* Report Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 size={16} className="text-blue-600" />
              {reportTabs.find((t) => t.key === activeTab)?.label} Report
            </CardTitle>
            <Button variant="outline" size="sm" onClick={() => loadReport(activeTab)}>
              <Download size={14} /> Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-16"><Spinner className="h-6 w-6" /></div>
          ) : !data || loaded !== activeTab ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <BarChart3 size={40} className="text-gray-300 mb-4" />
              <p className="text-sm text-gray-500">Click a report tab above to load data</p>
            </div>
          ) : (
            <div>
              {activeTab === 'inventory' && renderInventoryReport()}
              {activeTab === 'suppliers' && renderSupplierReport()}
              {activeTab === 'srv' && renderSRVReport()}
              {activeTab === 'siv' && renderSIVReport()}
              {activeTab === 'forecasts' && renderForecastReport()}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
