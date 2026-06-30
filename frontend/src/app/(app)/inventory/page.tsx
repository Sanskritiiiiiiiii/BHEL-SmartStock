'use client';

import { useEffect, useState, useCallback } from 'react';
import { inventoryApi } from '@/lib/api';
import { Inventory } from '@/types';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';
import { Search, Warehouse, AlertTriangle, PackageX, PackageCheck, SlidersHorizontal } from 'lucide-react';
import {
  Card, CardContent, CardHeader, CardTitle, Button, Badge, StatCard,
  Table, TableHead, TableBody, TableRow, TableHeader, TableCell,
  Modal, Spinner, EmptyState, Pagination
} from '@/components/ui';
import { formatDate } from '@/lib/utils';

export default function InventoryPage() {
  const { isRole } = useAuth();
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [stats, setStats] = useState({ total: 0, lowStock: 0, outOfStock: 0, adequate: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [adjustModal, setAdjustModal] = useState<{ open: boolean; item: Inventory | null }>({ open: false, item: null });
  const [adjustForm, setAdjustForm] = useState({ quantity: '', type: 'set' as 'add' | 'subtract' | 'set' });
  const [adjustLoading, setAdjustLoading] = useState(false);

  const canAdjust = isRole('ADMIN', 'STORE_MANAGER', 'INVENTORY_OFFICER');

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await inventoryApi.getAll({ page, limit: 12, search, filter });
      setInventory(res.data.data);
      setStats(res.data.stats);
      setTotalPages(res.data.pagination.totalPages);
    } catch {
      toast.error('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  }, [page, search, filter]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const getStockStatus = (current: number, minimum: number) => {
    if (current === 0) return { label: 'Out of Stock', variant: 'danger' as const, color: 'text-red-600 dark:text-red-400' };
    if (current <= minimum) return { label: 'Low Stock', variant: 'warning' as const, color: 'text-amber-600 dark:text-amber-400' };
    return { label: 'Adequate', variant: 'success' as const, color: 'text-emerald-600 dark:text-emerald-400' };
  };

  const getStockPercent = (current: number, maximum: number) => {
    if (maximum === 0) return 0;
    return Math.min(100, (current / maximum) * 100);
  };

  const handleAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustModal.item) return;
    setAdjustLoading(true);
    try {
      await inventoryApi.adjustStock(adjustModal.item.materialId, adjustForm);
      toast.success('Stock adjusted successfully');
      setAdjustModal({ open: false, item: null });
      fetchInventory();
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to adjust stock');
    } finally {
      setAdjustLoading(false);
    }
  };

  const filterTabs = [
    { key: 'all', label: 'All', icon: <Warehouse size={14} /> },
    { key: 'low', label: 'Low Stock', icon: <AlertTriangle size={14} /> },
    { key: 'out', label: 'Out of Stock', icon: <PackageX size={14} /> },
    { key: 'ok', label: 'Adequate', icon: <PackageCheck size={14} /> },
  ];

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-screen-2xl mx-auto">
      <div>
        <h1 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">Inventory Management</h1>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">Monitor stock levels and manage inventory</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Items" value={stats.total} icon={<Warehouse size={20} />} color="blue" />
        <StatCard title="Low Stock" value={stats.lowStock} icon={<AlertTriangle size={20} />} color="yellow" />
        <StatCard title="Out of Stock" value={stats.outOfStock} icon={<PackageX size={20} />} color="red" />
        <StatCard title="Adequate Stock" value={stats.adequate} icon={<PackageCheck size={20} />} color="green" />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-3">
          <div className="flex gap-3 flex-wrap items-center">
            <div className="relative flex-1 min-w-48">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search materials..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800/60 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-900/10 dark:focus:ring-blue-500/40 focus:border-gray-300 dark:focus:border-blue-600"
              />
            </div>
            <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
              {filterTabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => { setFilter(tab.key); setPage(1); }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    filter === tab.key
                      ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner className="h-6 w-6" />
          </div>
        ) : inventory.length === 0 ? (
          <EmptyState
            title="No inventory records found"
            description="Add materials to start tracking inventory"
            icon={<Warehouse size={40} />}
          />
        ) : (
          <>
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Material</TableHeader>
                  <TableHeader>Code</TableHeader>
                  <TableHeader>Category</TableHeader>
                  <TableHeader>Current Stock</TableHeader>
                  <TableHeader>Stock Level</TableHeader>
                  <TableHeader>Min / Max</TableHeader>
                  <TableHeader>Status</TableHeader>
                  <TableHeader>Last Updated</TableHeader>
                  {canAdjust && <TableHeader>Action</TableHeader>}
                </TableRow>
              </TableHead>
              <TableBody>
                {inventory.map((inv) => {
                  const status = getStockStatus(inv.currentStock, inv.material!.minimumStock);
                  const pct = getStockPercent(inv.currentStock, inv.material!.maximumStock);
                  return (
                    <TableRow key={inv.id}>
                      <TableCell>
                        <span className="font-medium text-gray-800 dark:text-gray-200">{inv.material?.name}</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-lg">
                          {inv.material?.materialCode}
                        </span>
                      </TableCell>
                      <TableCell className="text-gray-500 dark:text-gray-500">{inv.material?.category}</TableCell>
                      <TableCell>
                        <span className={`font-bold ${status.color}`}>
                          {inv.currentStock} {inv.material?.unit}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="w-24">
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                pct === 0 ? 'bg-red-500' : pct < 30 ? 'bg-yellow-500' : 'bg-green-500'
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-400 mt-0.5">{pct.toFixed(0)}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-gray-500 dark:text-gray-500">
                        {inv.material?.minimumStock} / {inv.material?.maximumStock}
                      </TableCell>
                      <TableCell>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-gray-400 dark:text-gray-500">{formatDate(inv.lastUpdated)}</TableCell>
                      {canAdjust && (
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setAdjustModal({ open: true, item: inv });
                              setAdjustForm({ quantity: String(inv.currentStock), type: 'set' });
                            }}
                          >
                            <SlidersHorizontal size={13} /> Adjust
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </>
        )}
      </Card>

      {/* Adjust Stock Modal */}
      <Modal
        open={adjustModal.open}
        onClose={() => setAdjustModal({ open: false, item: null })}
        title="Adjust Stock"
        size="sm"
      >
        {adjustModal.item && (
          <form onSubmit={handleAdjust} className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-800/60 rounded-xl p-3">
              <p className="font-medium text-gray-800 dark:text-gray-200">{adjustModal.item.material?.name}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Current stock: <span className="font-semibold text-gray-700 dark:text-gray-300">{adjustModal.item.currentStock} {adjustModal.item.material?.unit}</span>
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Adjustment Type</label>
              <div className="grid grid-cols-3 gap-2">
                {(['set', 'add', 'subtract'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setAdjustForm({ ...adjustForm, type: t })}
                    className={`py-1.5 text-xs rounded-lg border font-medium capitalize transition-all ${
                      adjustForm.type === t
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-gray-300 text-gray-600 hover:border-blue-400'
                    }`}
                  >
                    {t === 'set' ? 'Set to' : t === 'add' ? '+ Add' : '– Remove'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={adjustForm.quantity}
                onChange={(e) => setAdjustForm({ ...adjustForm, quantity: e.target.value })}
                required
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800/60 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-900/10 dark:focus:ring-blue-500/40 focus:border-gray-300 dark:focus:border-blue-600"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setAdjustModal({ open: false, item: null })}>
                Cancel
              </Button>
              <Button type="submit" disabled={adjustLoading}>
                {adjustLoading ? 'Saving...' : 'Apply Adjustment'}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
