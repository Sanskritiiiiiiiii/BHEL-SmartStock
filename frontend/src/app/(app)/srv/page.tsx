'use client';

import { useEffect, useState, useCallback } from 'react';
import { srvApi, suppliersApi, materialsApi } from '@/lib/api';
import { SRV, Supplier, Material } from '@/types';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';
import { Plus, Search, Eye, CheckCircle, XCircle, FileInput, Trash2 } from 'lucide-react';
import {
  Card, CardContent, Button, StatusBadge,
  Table, TableHead, TableBody, TableRow, TableHeader, TableCell,
  Modal, Spinner, EmptyState, Pagination, ConfirmDialog
} from '@/components/ui';
import { formatDate } from '@/lib/utils';

interface SRVFormItem {
  materialId: string;
  quantity: string;
  unitPrice: string;
}

export default function SRVPage() {
  const { isRole } = useAuth();
  const [srvs, setSRVs] = useState<SRV[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [detailModal, setDetailModal] = useState<{ open: boolean; srv: SRV | null }>({ open: false, srv: null });
  const [createModal, setCreateModal] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [form, setForm] = useState({ supplierId: '', receiptDate: '', notes: '' });
  const [items, setItems] = useState<SRVFormItem[]>([{ materialId: '', quantity: '', unitPrice: '' }]);
  const [formLoading, setFormLoading] = useState(false);
  const [actionConfirm, setActionConfirm] = useState<{ open: boolean; srvId: string; action: 'approve' | 'reject' } | null>(null);

  const canCreate = isRole('ADMIN', 'STORE_MANAGER', 'INVENTORY_OFFICER', 'PROCUREMENT_OFFICER');
  const canApprove = isRole('ADMIN', 'STORE_MANAGER');

  const fetchSRVs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await srvApi.getAll({ page, limit: 10, search, status: statusFilter });
      setSRVs(res.data.data);
      setTotalPages(res.data.pagination.totalPages);
    } catch {
      toast.error('Failed to load SRVs');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => { fetchSRVs(); }, [fetchSRVs]);

  useEffect(() => {
    suppliersApi.getAll({ limit: 100 }).then((r) => setSuppliers(r.data.data));
    materialsApi.getAll({ limit: 200 }).then((r) => setMaterials(r.data.data));
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.some((i) => !i.materialId || !i.quantity)) {
      toast.error('Please fill in all item details');
      return;
    }
    setFormLoading(true);
    try {
      await srvApi.create({ ...form, items });
      toast.success('SRV created successfully');
      setCreateModal(false);
      resetForm();
      fetchSRVs();
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to create SRV');
    } finally {
      setFormLoading(false);
    }
  };

  const handleAction = async () => {
    if (!actionConfirm) return;
    try {
      await srvApi.updateStatus(actionConfirm.srvId, actionConfirm.action);
      toast.success(`SRV ${actionConfirm.action === 'approve' ? 'approved' : 'rejected'} successfully`);
      fetchSRVs();
      if (detailModal.open) setDetailModal({ open: false, srv: null });
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Operation failed');
    }
    setActionConfirm(null);
  };

  const resetForm = () => {
    setForm({ supplierId: '', receiptDate: '', notes: '' });
    setItems([{ materialId: '', quantity: '', unitPrice: '' }]);
  };

  const addItem = () => setItems([...items, { materialId: '', quantity: '', unitPrice: '' }]);
  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: keyof SRVFormItem, val: string) => {
    setItems(items.map((item, idx) => idx === i ? { ...item, [field]: val } : item));
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Store Receipt Vouchers</h1>
          <p className="text-sm text-gray-500 mt-1">Manage material receipts from suppliers</p>
        </div>
        {canCreate && (
          <Button onClick={() => { setCreateModal(true); resetForm(); }}>
            <Plus size={16} /> New SRV
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-3">
          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search by SRV number or supplier..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 bg-white"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        {loading ? (
          <div className="flex items-center justify-center py-16"><Spinner className="h-6 w-6" /></div>
        ) : srvs.length === 0 ? (
          <EmptyState title="No SRVs found" description="Create a new SRV to track material receipts" icon={<FileInput size={40} />} />
        ) : (
          <>
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>SRV Number</TableHeader>
                  <TableHeader>Supplier</TableHeader>
                  <TableHeader>Receipt Date</TableHeader>
                  <TableHeader>Items</TableHeader>
                  <TableHeader>Created By</TableHeader>
                  <TableHeader>Status</TableHeader>
                  <TableHeader>Actions</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {srvs.map((srv) => (
                  <TableRow key={srv.id}>
                    <TableCell>
                      <span className="font-mono text-xs font-semibold text-blue-700">{srv.srvNumber}</span>
                    </TableCell>
                    <TableCell className="font-medium">{srv.supplier?.name}</TableCell>
                    <TableCell className="text-gray-500">{formatDate(srv.receiptDate)}</TableCell>
                    <TableCell>
                      <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                        {srv.items.length} item{srv.items.length !== 1 ? 's' : ''}
                      </span>
                    </TableCell>
                    <TableCell className="text-gray-500">{srv.createdBy?.name}</TableCell>
                    <TableCell><StatusBadge status={srv.status} /></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => setDetailModal({ open: true, srv })}>
                          <Eye size={14} />
                        </Button>
                        {canApprove && srv.status === 'PENDING' && (
                          <>
                            <Button
                              variant="ghost" size="icon"
                              className="text-green-500 hover:text-green-700 hover:bg-green-50"
                              onClick={() => setActionConfirm({ open: true, srvId: srv.id, action: 'approve' })}
                            >
                              <CheckCircle size={14} />
                            </Button>
                            <Button
                              variant="ghost" size="icon"
                              className="text-red-400 hover:text-red-600 hover:bg-red-50"
                              onClick={() => setActionConfirm({ open: true, srvId: srv.id, action: 'reject' })}
                            >
                              <XCircle size={14} />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </>
        )}
      </Card>

      {/* Detail Modal */}
      <Modal open={detailModal.open} onClose={() => setDetailModal({ open: false, srv: null })} title="SRV Details" size="lg">
        {detailModal.srv && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-lg p-4 text-sm">
              <div><span className="text-gray-500">SRV Number:</span> <span className="font-mono font-bold text-blue-700 ml-2">{detailModal.srv.srvNumber}</span></div>
              <div><span className="text-gray-500">Status:</span> <span className="ml-2"><StatusBadge status={detailModal.srv.status} /></span></div>
              <div><span className="text-gray-500">Supplier:</span> <span className="font-medium ml-2">{detailModal.srv.supplier?.name}</span></div>
              <div><span className="text-gray-500">Receipt Date:</span> <span className="ml-2">{formatDate(detailModal.srv.receiptDate)}</span></div>
              <div><span className="text-gray-500">Created By:</span> <span className="ml-2">{detailModal.srv.createdBy?.name}</span></div>
              {detailModal.srv.notes && <div className="col-span-2"><span className="text-gray-500">Notes:</span> <span className="ml-2">{detailModal.srv.notes}</span></div>}
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Items</h4>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeader>Material</TableHeader>
                    <TableHeader>Code</TableHeader>
                    <TableHeader>Quantity</TableHeader>
                    <TableHeader>Unit Price</TableHeader>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {detailModal.srv.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.material?.name}</TableCell>
                      <TableCell><span className="font-mono text-xs">{item.material?.materialCode}</span></TableCell>
                      <TableCell>{item.quantity} {item.material?.unit}</TableCell>
                      <TableCell>₹{item.unitPrice.toLocaleString('en-IN')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {canApprove && detailModal.srv.status === 'PENDING' && (
              <div className="flex gap-3 pt-2">
                <Button
                  variant="default"
                  className="flex-1"
                  onClick={() => setActionConfirm({ open: true, srvId: detailModal.srv!.id, action: 'approve' })}
                >
                  <CheckCircle size={16} /> Approve SRV
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => setActionConfirm({ open: true, srvId: detailModal.srv!.id, action: 'reject' })}
                >
                  <XCircle size={16} /> Reject SRV
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Create SRV Modal */}
      <Modal open={createModal} onClose={() => setCreateModal(false)} title="Create New SRV" size="xl">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Supplier *</label>
              <select
                value={form.supplierId}
                onChange={(e) => setForm({ ...form, supplierId: e.target.value })}
                required
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 bg-white"
              >
                <option value="">Select supplier...</option>
                {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Receipt Date *</label>
              <input
                type="date"
                value={form.receiptDate}
                onChange={(e) => setForm({ ...form, receiptDate: e.target.value })}
                required
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              placeholder="Optional notes..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-gray-700">Items *</label>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus size={14} /> Add Item
              </Button>
            </div>
            <div className="space-y-2">
              {items.map((item, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center bg-gray-50 p-2 rounded-lg">
                  <div className="col-span-5">
                    <select
                      value={item.materialId}
                      onChange={(e) => updateItem(i, 'materialId', e.target.value)}
                      required
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500 bg-white"
                    >
                      <option value="">Select material...</option>
                      {materials.map((m) => (
                        <option key={m.id} value={m.id}>{m.name} ({m.materialCode})</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-3">
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={item.quantity}
                      onChange={(e) => updateItem(i, 'quantity', e.target.value)}
                      placeholder="Qty"
                      required
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="col-span-3">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(i, 'unitPrice', e.target.value)}
                      placeholder="Unit Price (₹)"
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="col-span-1 flex justify-center">
                    {items.length > 1 && (
                      <button type="button" onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600 p-0.5">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setCreateModal(false)}>Cancel</Button>
            <Button type="submit" disabled={formLoading}>
              {formLoading ? 'Creating...' : 'Create SRV'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!actionConfirm?.open}
        onClose={() => setActionConfirm(null)}
        onConfirm={handleAction}
        title={actionConfirm?.action === 'approve' ? 'Approve SRV' : 'Reject SRV'}
        message={
          actionConfirm?.action === 'approve'
            ? 'Approving this SRV will update inventory with the received quantities.'
            : 'Are you sure you want to reject this SRV?'
        }
        confirmLabel={actionConfirm?.action === 'approve' ? 'Approve' : 'Reject'}
        variant={actionConfirm?.action === 'reject' ? 'danger' : 'default'}
      />
    </div>
  );
}
