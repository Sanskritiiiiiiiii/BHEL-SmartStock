'use client';

import { useEffect, useState, useCallback } from 'react';
import { suppliersApi } from '@/lib/api';
import { Supplier } from '@/types';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';
import { Plus, Search, Pencil, Trash2, Users, Star } from 'lucide-react';
import {
  Card, CardContent, Button,
  Table, TableHead, TableBody, TableRow, TableHeader, TableCell,
  Modal, Spinner, EmptyState, Pagination, ConfirmDialog, Badge
} from '@/components/ui';

export default function SuppliersPage() {
  const { isRole } = useAuth();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '' });
  const [formLoading, setFormLoading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const canManage = isRole('ADMIN', 'STORE_MANAGER');
  const canDelete = isRole('ADMIN');

  const fetchSuppliers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await suppliersApi.getAll({ page, limit: 10, search });
      setSuppliers(res.data.data);
      setTotalPages(res.data.pagination.totalPages);
    } catch {
      toast.error('Failed to load suppliers');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetchSuppliers(); }, [fetchSuppliers]);

  const openCreate = () => {
    setEditingSupplier(null);
    setForm({ name: '', email: '', phone: '', address: '' });
    setModalOpen(true);
  };

  const openEdit = (s: Supplier) => {
    setEditingSupplier(s);
    setForm({ name: s.name, email: s.email, phone: s.phone || '', address: s.address || '' });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      if (editingSupplier) {
        await suppliersApi.update(editingSupplier.id, form);
        toast.success('Supplier updated');
      } else {
        await suppliersApi.create(form);
        toast.success('Supplier created');
      }
      setModalOpen(false);
      fetchSuppliers();
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Operation failed');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await suppliersApi.delete(deleteId);
      toast.success('Supplier deleted');
      fetchSuppliers();
    } catch {
      toast.error('Failed to delete supplier');
    } finally {
      setDeleteId(null);
    }
  };

  const renderStars = (rating: number) => (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={13}
          className={star <= Math.round(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'}
        />
      ))}
      <span className="text-xs text-gray-500 ml-1">{rating.toFixed(1)}</span>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Suppliers</h1>
          <p className="text-sm text-gray-500 mt-1">Manage supplier information and performance</p>
        </div>
        {canManage && (
          <Button onClick={openCreate}>
            <Plus size={16} /> Add Supplier
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="py-3">
          <div className="relative max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search suppliers..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        {loading ? (
          <div className="flex items-center justify-center py-16"><Spinner className="h-6 w-6" /></div>
        ) : suppliers.length === 0 ? (
          <EmptyState title="No suppliers found" description="Add your first supplier" icon={<Users size={40} />} />
        ) : (
          <>
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Name</TableHeader>
                  <TableHeader>Email</TableHeader>
                  <TableHeader>Phone</TableHeader>
                  <TableHeader>Rating</TableHeader>
                  <TableHeader>Bids</TableHeader>
                  <TableHeader>Win Rate</TableHeader>
                  {canManage && <TableHeader>Actions</TableHeader>}
                </TableRow>
              </TableHead>
              <TableBody>
                {suppliers.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>
                      <div>
                        <p className="font-semibold text-gray-800">{s.name}</p>
                        {s.address && <p className="text-xs text-gray-400 truncate max-w-48">{s.address}</p>}
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-600">{s.email}</TableCell>
                    <TableCell className="text-gray-500">{s.phone || '—'}</TableCell>
                    <TableCell>{renderStars(s.rating)}</TableCell>
                    <TableCell>
                      <span className="text-xs">
                        <span className="font-semibold text-gray-800">{s.wonBids}</span>
                        <span className="text-gray-400"> / {s.totalBids}</span>
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={s.totalBids > 0 && s.wonBids / s.totalBids > 0.5 ? 'success' : 'warning'}>
                        {s.totalBids > 0 ? ((s.wonBids / s.totalBids) * 100).toFixed(0) : 0}%
                      </Badge>
                    </TableCell>
                    {canManage && (
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(s)}>
                            <Pencil size={14} />
                          </Button>
                          {canDelete && (
                            <Button
                              variant="ghost" size="icon"
                              className="text-red-400 hover:text-red-600 hover:bg-red-50"
                              onClick={() => setDeleteId(s.id)}
                            >
                              <Trash2 size={14} />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </>
        )}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingSupplier ? 'Edit Supplier' : 'Add Supplier'} size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} rows={2}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 resize-none" />
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={formLoading}>
              {formLoading ? 'Saving...' : editingSupplier ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Supplier"
        message="Are you sure you want to delete this supplier? This cannot be undone."
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}
