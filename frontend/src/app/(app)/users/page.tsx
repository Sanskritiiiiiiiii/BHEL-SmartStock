'use client';

import { useEffect, useState, useCallback } from 'react';
import { authApi, suppliersApi } from '@/lib/api';
import { User, Supplier } from '@/types';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Plus, Users } from 'lucide-react';
import {
  Card, Button, Badge,
  Table, TableHead, TableBody, TableRow, TableHeader, TableCell,
  Modal, Spinner, EmptyState
} from '@/components/ui';

const ROLES = [
  { value: 'ADMIN', label: 'Admin' },
  { value: 'STORE_MANAGER', label: 'Store Manager' },
  { value: 'INVENTORY_OFFICER', label: 'Inventory Officer' },
  { value: 'PROCUREMENT_OFFICER', label: 'Procurement Officer' },
  { value: 'VENDOR', label: 'Vendor' },
];

const roleColors: Record<string, 'danger' | 'warning' | 'success' | 'info' | 'default'> = {
  ADMIN: 'danger',
  STORE_MANAGER: 'warning',
  INVENTORY_OFFICER: 'info',
  PROCUREMENT_OFFICER: 'success',
  VENDOR: 'default',
};

export default function UsersPage() {
  const { isRole } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'INVENTORY_OFFICER', vendorId: '' });
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    if (!isRole('ADMIN')) {
      router.push('/dashboard');
      return;
    }
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, suppliersRes] = await Promise.all([
        authApi.getUsers(),
        suppliersApi.getAll({ limit: 100 }),
      ]);
      setUsers(usersRes.data.data);
      setSuppliers(suppliersRes.data.data);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      await authApi.createUser(form);
      toast.success('User created successfully');
      setModalOpen(false);
      setForm({ name: '', email: '', password: '', role: 'INVENTORY_OFFICER', vendorId: '' });
      fetchData();
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to create user');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-screen-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">User Management</h1>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">Manage system users and their roles</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus size={16} /> Add User
        </Button>
      </div>

      <Card>
        {loading ? (
          <div className="flex items-center justify-center py-16"><Spinner className="h-6 w-6" /></div>
        ) : users.length === 0 ? (
          <EmptyState title="No users found" icon={<Users size={40} />} />
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Name</TableHeader>
                <TableHeader>Email</TableHeader>
                <TableHeader>Role</TableHeader>
                <TableHeader>Vendor</TableHeader>
                <TableHeader>Created</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-xs font-semibold text-blue-600">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium">{u.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-500 dark:text-gray-500">{u.email}</TableCell>
                  <TableCell>
                    <Badge variant={roleColors[u.role] || 'default'}>
                      {u.role.replace(/_/g, ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-400 text-sm">
                    {(u.vendor as { name?: string } | null)?.name || '—'}
                  </TableCell>
                  <TableCell className="text-gray-400 text-xs">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Create New User" size="md">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800/60 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-900/10 dark:focus:ring-blue-500/40 focus:border-gray-300 dark:focus:border-blue-600" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800/60 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-900/10 dark:focus:ring-blue-500/40 focus:border-gray-300 dark:focus:border-blue-600" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6}
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800/60 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-900/10 dark:focus:ring-blue-500/40 focus:border-gray-300 dark:focus:border-blue-600" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value, vendorId: '' })}
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800/60 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-900/10 dark:focus:ring-blue-500/40 focus:border-gray-300 dark:focus:border-blue-600">
              {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          {form.role === 'VENDOR' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Linked Supplier *</label>
              <select value={form.vendorId} onChange={(e) => setForm({ ...form, vendorId: e.target.value })} required={form.role === 'VENDOR'}
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800/60 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-900/10 dark:focus:ring-blue-500/40 focus:border-gray-300 dark:focus:border-blue-600">
                <option value="">Select supplier...</option>
                {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={formLoading}>{formLoading ? 'Creating...' : 'Create User'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
