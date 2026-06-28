'use client';

import { useEffect, useState, useCallback } from 'react';
import { materialsApi } from '@/lib/api';
import { Material } from '@/types';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';
import { Plus, Search, Pencil, Trash2, Package } from 'lucide-react';
import {
  Card, CardContent, Button, Input, Select, Badge,
  Table, TableHead, TableBody, TableRow, TableHeader, TableCell,
  Modal, Spinner, EmptyState, Pagination, ConfirmDialog, StatusBadge
} from '@/components/ui';

interface MaterialFormData {
  materialCode: string;
  name: string;
  category: string;
  description: string;
  unit: string;
  minimumStock: string;
  maximumStock: string;
  safetyBuffer: string;
  leadTime: string;
  initialStock: string;
}

const defaultForm: MaterialFormData = {
  materialCode: '',
  name: '',
  category: '',
  description: '',
  unit: 'pcs',
  minimumStock: '0',
  maximumStock: '0',
  safetyBuffer: '0',
  leadTime: '0',
  initialStock: '0',
};

const UNITS = ['pcs', 'kg', 'g', 'L', 'mL', 'm', 'cm', 'set', 'unit', 'box', 'roll', 'sheet'];

export default function MaterialsPage() {
  const { isRole } = useAuth();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [form, setForm] = useState<MaterialFormData>(defaultForm);
  const [formLoading, setFormLoading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const canEdit = isRole('ADMIN', 'STORE_MANAGER', 'INVENTORY_OFFICER');
  const canDelete = isRole('ADMIN', 'STORE_MANAGER');

  const fetchMaterials = useCallback(async () => {
    setLoading(true);
    try {
      const res = await materialsApi.getAll({ page, limit: 10, search, category: categoryFilter });
      setMaterials(res.data.data);
      setTotalPages(res.data.pagination.totalPages);
    } catch {
      toast.error('Failed to load materials');
    } finally {
      setLoading(false);
    }
  }, [page, search, categoryFilter]);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  useEffect(() => {
    materialsApi.getCategories()
      .then((res) => setCategories(res.data.data.map((c: { name: string }) => c.name)))
      .catch(console.error);
  }, []);

  const openCreate = () => {
    setEditingMaterial(null);
    setForm(defaultForm);
    setModalOpen(true);
  };

  const openEdit = (material: Material) => {
    setEditingMaterial(material);
    setForm({
      materialCode: material.materialCode,
      name: material.name,
      category: material.category,
      description: material.description || '',
      unit: material.unit,
      minimumStock: String(material.minimumStock),
      maximumStock: String(material.maximumStock),
      safetyBuffer: String(material.safetyBuffer),
      leadTime: String(material.leadTime),
      initialStock: String(material.currentStock || 0),
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      if (editingMaterial) {
        await materialsApi.update(editingMaterial.id, form);
        toast.success('Material updated');
      } else {
        await materialsApi.create(form);
        toast.success('Material created');
      }
      setModalOpen(false);
      fetchMaterials();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Operation failed';
      toast.error(msg);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await materialsApi.delete(deleteId);
      toast.success('Material deleted');
      fetchMaterials();
    } catch {
      toast.error('Failed to delete material');
    } finally {
      setDeleteId(null);
    }
  };

  const getStockBadge = (current: number, minimum: number) => {
    if (current === 0) return <Badge variant="danger">Out of Stock</Badge>;
    if (current <= minimum) return <Badge variant="warning">Low Stock</Badge>;
    return <Badge variant="success">Adequate</Badge>;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Material Master</h1>
          <p className="text-sm text-gray-500 mt-1">Manage all materials and their specifications</p>
        </div>
        {canEdit && (
          <Button onClick={openCreate}>
            <Plus size={16} /> Add Material
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
                placeholder="Search materials..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 bg-white"
            >
              <option value="">All Categories</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner className="h-6 w-6" />
          </div>
        ) : materials.length === 0 ? (
          <EmptyState
            title="No materials found"
            description="Create your first material to get started"
            icon={<Package size={40} />}
          />
        ) : (
          <>
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Code</TableHeader>
                  <TableHeader>Name</TableHeader>
                  <TableHeader>Category</TableHeader>
                  <TableHeader>Unit</TableHeader>
                  <TableHeader>Current Stock</TableHeader>
                  <TableHeader>Min / Max</TableHeader>
                  <TableHeader>Status</TableHeader>
                  {canEdit && <TableHeader>Actions</TableHeader>}
                </TableRow>
              </TableHead>
              <TableBody>
                {materials.map((material) => (
                  <TableRow key={material.id}>
                    <TableCell>
                      <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">
                        {material.materialCode}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-gray-800">{material.name}</p>
                        {material.description && (
                          <p className="text-xs text-gray-400 truncate max-w-48">{material.description}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{material.category}</TableCell>
                    <TableCell>{material.unit}</TableCell>
                    <TableCell>
                      <span className="font-semibold text-gray-800">
                        {material.currentStock ?? material.inventory?.currentStock ?? 0}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-gray-500">
                      {material.minimumStock} / {material.maximumStock}
                    </TableCell>
                    <TableCell>
                      {getStockBadge(
                        material.currentStock ?? material.inventory?.currentStock ?? 0,
                        material.minimumStock
                      )}
                    </TableCell>
                    {canEdit && (
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(material)}>
                            <Pencil size={14} />
                          </Button>
                          {canDelete && (
                            <Button variant="ghost" size="icon" onClick={() => setDeleteId(material.id)}
                              className="text-red-400 hover:text-red-600 hover:bg-red-50">
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

      {/* Create/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingMaterial ? 'Edit Material' : 'Add New Material'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Material Code *</label>
              <input
                value={form.materialCode}
                onChange={(e) => setForm({ ...form, materialCode: e.target.value })}
                required
                disabled={!!editingMaterial}
                placeholder="e.g. STL001"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 disabled:bg-gray-50 font-mono"
              />
              <p className="text-xs text-gray-400 mt-1">Dashes removed automatically</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Material Name *</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                placeholder="e.g. Stainless Steel Sheet"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
              <input
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                required
                placeholder="e.g. Metals"
                list="categories-list"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              />
              <datalist id="categories-list">
                {categories.map((c) => <option key={c} value={c} />)}
              </datalist>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit *</label>
              <select
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
                required
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 bg-white"
              >
                {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Optional description..."
              rows={2}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Stock</label>
              <input
                type="number"
                value={form.minimumStock}
                onChange={(e) => setForm({ ...form, minimumStock: e.target.value })}
                min="0"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Stock</label>
              <input
                type="number"
                value={form.maximumStock}
                onChange={(e) => setForm({ ...form, maximumStock: e.target.value })}
                min="0"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Safety Buffer</label>
              <input
                type="number"
                value={form.safetyBuffer}
                onChange={(e) => setForm({ ...form, safetyBuffer: e.target.value })}
                min="0"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lead Time (days)</label>
              <input
                type="number"
                value={form.leadTime}
                onChange={(e) => setForm({ ...form, leadTime: e.target.value })}
                min="0"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {!editingMaterial && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Initial Stock</label>
              <input
                type="number"
                value={form.initialStock}
                onChange={(e) => setForm({ ...form, initialStock: e.target.value })}
                min="0"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={formLoading}>
              {formLoading ? 'Saving...' : editingMaterial ? 'Update Material' : 'Create Material'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Material"
        message="Are you sure you want to delete this material? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}
