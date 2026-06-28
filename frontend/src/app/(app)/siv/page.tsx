'use client';

import { useEffect, useState, useCallback } from 'react';
import { sivApi, materialsApi } from '@/lib/api';
import { SIV, Material } from '@/types';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';
import { Plus, Search, Eye, CheckCircle, XCircle, FileOutput, Trash2 } from 'lucide-react';
import {
  Card, CardContent, Button, StatusBadge,
  Table, TableHead, TableBody, TableRow, TableHeader, TableCell,
  Modal, Spinner, EmptyState, Pagination, ConfirmDialog
} from '@/components/ui';
import { formatDate, DEPARTMENTS } from '@/lib/utils';

interface SIVFormItem {
  materialId: string;
  quantity: string;
}

export default function SIVPage() {
  const { isRole } = useAuth();
  const [sivs, setSIVs] = useState<SIV[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [detailModal, setDetailModal] = useState<{ open: boolean; siv: SIV | null }>({ open: false, siv: null });
  const [createModal, setCreateModal] = useState(false);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [form, setForm] = useState({ department: '', issueDate: '', notes: '' });
  const [items, setItems] = useState<SIVFormItem[]>([{ materialId: '', quantity: '' }]);
  const [formLoading, setFormLoading] = useState(false);
  const [actionConfirm, setActionConfirm] = useState<{ open: boolean; sivId: string; action: 'approve' | 'reject' } | null>(null);

  const canCreate = isRole('ADMIN', 'STORE_MANAGER', 'INVENTORY_OFFICER');
  const canApprove = isRole('ADMIN', 'STORE_MANAGER');

  const fetchSIVs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await sivApi.getAll({ page, limit: 10, search, status: statusFilter });
      setSIVs(res.data.data);
      setTotalPages(res.data.pagination.totalPages);
    } catch {
      toast.error('Failed to load SIVs');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => { fetchSIVs(); }, [fetchSIVs]);

  useEffect(() => {
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
      await sivApi.create({ ...form, items });
      toast.success('SIV created successfully');
      setCreateModal(false);
      resetForm();
      fetchSIVs();
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to create SIV');
    } finally {
      setFormLoading(false);
    }
  };

  const handleAction = async () => {
    if (!actionConfirm) return;
    try {
      await sivApi.updateStatus(actionConfirm.sivId, actionConfirm.action);
      toast.success(`SIV ${actionConfirm.action === 'approve' ? 'approved' : 'rejected'} successfully`);
      if (actionConfirm.action === 'approve') toast.info('Inventory has been updated');
      fetchSIVs();
      if (detailModal.open) setDetailModal({ open: false, siv: null });
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Operation failed');
    }
    setActionConfirm(null);
  };

  const resetForm = () => {
    setForm({ department: '', issueDate: '', notes: '' });
    setItems([{ materialId: '', quantity: '' }]);
  };

  const addItem = () => setItems([...items, { materialId: '', quantity: '' }]);
  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: keyof SIVFormItem, val: string) => {
    setItems(items.map((item, idx) => idx === i ? { ...item, [field]: val } : item));
  };

  // Get current stock for a material
  const getMaterialStock = (materialId: string) => {
    const m = materials.find((mat) => mat.id === materialId);
    return m ? (m.currentStock ?? m.inventory?.currentStock ?? 0) : 0;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Store Issue Vouchers</h1>
          <p className="text-sm text-gray-500 mt-1">Manage material issues to departments</p>
        </div>
        {canCreate && (
          <Button onClick={() => { setCreateModal(true); resetForm(); }}>
            <Plus size={16} /> New SIV
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
                placeholder="Search by SIV number or department..."
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
        ) : sivs.length === 0 ? (
          <EmptyState title="No SIVs found" description="Create a new SIV to issue materials" icon={<FileOutput size={40} />} />
        ) : (
          <>
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>SIV Number</TableHeader>
                  <TableHeader>Department</TableHeader>
                  <TableHeader>Issue Date</TableHeader>
                  <TableHeader>Items</TableHeader>
                  <TableHeader>Created By</TableHeader>
                  <TableHeader>Status</TableHeader>
                  <TableHeader>Actions</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {sivs.map((siv) => (
                  <TableRow key={siv.id}>
                    <TableCell>
                      <span className="font-mono text-xs font-semibold text-purple-700">{siv.sivNumber}</span>
                    </TableCell>
                    <TableCell className="font-medium">{siv.department}</TableCell>
                    <TableCell className="text-gray-500">{formatDate(siv.issueDate)}</TableCell>
                    <TableCell>
                      <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full font-medium">
                        {siv.items.length} item{siv.items.length !== 1 ? 's' : ''}
                      </span>
                    </TableCell>
                    <TableCell className="text-gray-500">{siv.createdBy?.name}</TableCell>
                    <TableCell><StatusBadge status={siv.status} /></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => setDetailModal({ open: true, siv })}>
                          <Eye size={14} />
                        </Button>
                        {canApprove && siv.status === 'PENDING' && (
                          <>
                            <Button
                              variant="ghost" size="icon"
                              className="text-green-500 hover:text-green-700 hover:bg-green-50"
                              onClick={() => setActionConfirm({ open: true, sivId: siv.id, action: 'approve' })}
                            >
                              <CheckCircle size={14} />
                            </Button>
                            <Button
                              variant="ghost" size="icon"
                              className="text-red-400 hover:text-red-600 hover:bg-red-50"
                              onClick={() => setActionConfirm({ open: true, sivId: siv.id, action: 'reject' })}
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
      <Modal open={detailModal.open} onClose={() => setDetailModal({ open: false, siv: null })} title="SIV Details" size="lg">
        {detailModal.siv && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-lg p-4 text-sm">
              <div><span className="text-gray-500">SIV Number:</span> <span className="font-mono font-bold text-purple-700 ml-2">{detailModal.siv.sivNumber}</span></div>
              <div><span className="text-gray-500">Status:</span> <span className="ml-2"><StatusBadge status={detailModal.siv.status} /></span></div>
              <div><span className="text-gray-500">Department:</span> <span className="font-medium ml-2">{detailModal.siv.department}</span></div>
              <div><span className="text-gray-500">Issue Date:</span> <span className="ml-2">{formatDate(detailModal.siv.issueDate)}</span></div>
              <div><span className="text-gray-500">Created By:</span> <span className="ml-2">{detailModal.siv.createdBy?.name}</span></div>
              {detailModal.siv.notes && <div className="col-span-2"><span className="text-gray-500">Notes:</span> <span className="ml-2">{detailModal.siv.notes}</span></div>}
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Items</h4>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeader>Material</TableHeader>
                    <TableHeader>Code</TableHeader>
                    <TableHeader>Quantity</TableHeader>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {detailModal.siv.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.material?.name}</TableCell>
                      <TableCell><span className="font-mono text-xs">{item.material?.materialCode}</span></TableCell>
                      <TableCell>{item.quantity} {item.material?.unit}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {canApprove && detailModal.siv.status === 'PENDING' && (
              <div className="flex gap-3 pt-2">
                <Button
                  variant="default" className="flex-1"
                  onClick={() => setActionConfirm({ open: true, sivId: detailModal.siv!.id, action: 'approve' })}
                >
                  <CheckCircle size={16} /> Approve & Deduct Stock
                </Button>
                <Button
                  variant="destructive" className="flex-1"
                  onClick={() => setActionConfirm({ open: true, sivId: detailModal.siv!.id, action: 'reject' })}
                >
                  <XCircle size={16} /> Reject SIV
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Create SIV Modal */}
      <Modal open={createModal} onClose={() => setCreateModal(false)} title="Create New SIV" size="xl">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
              <select
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                required
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 bg-white"
              >
                <option value="">Select department...</option>
                {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Issue Date *</label>
              <input
                type="date"
                value={form.issueDate}
                onChange={(e) => setForm({ ...form, issueDate: e.target.value })}
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
              {items.map((item, i) => {
                const stock = getMaterialStock(item.materialId);
                return (
                  <div key={i} className="grid grid-cols-12 gap-2 items-center bg-gray-50 p-2 rounded-lg">
                    <div className="col-span-7">
                      <select
                        value={item.materialId}
                        onChange={(e) => updateItem(i, 'materialId', e.target.value)}
                        required
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500 bg-white"
                      >
                        <option value="">Select material...</option>
                        {materials.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name} ({m.materialCode}) — Stock: {m.currentStock ?? 0}
                          </option>
                        ))}
                      </select>
                      {item.materialId && (
                        <p className="text-xs text-gray-400 mt-0.5">Available: {stock}</p>
                      )}
                    </div>
                    <div className="col-span-4">
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        max={stock || undefined}
                        value={item.quantity}
                        onChange={(e) => updateItem(i, 'quantity', e.target.value)}
                        placeholder="Quantity"
                        required
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
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setCreateModal(false)}>Cancel</Button>
            <Button type="submit" disabled={formLoading}>
              {formLoading ? 'Creating...' : 'Create SIV'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!actionConfirm?.open}
        onClose={() => setActionConfirm(null)}
        onConfirm={handleAction}
        title={actionConfirm?.action === 'approve' ? 'Approve SIV' : 'Reject SIV'}
        message={
          actionConfirm?.action === 'approve'
            ? 'Approving this SIV will deduct the issued quantities from inventory.'
            : 'Are you sure you want to reject this SIV?'
        }
        confirmLabel={actionConfirm?.action === 'approve' ? 'Approve' : 'Reject'}
        variant={actionConfirm?.action === 'reject' ? 'danger' : 'default'}
      />
    </div>
  );
}
