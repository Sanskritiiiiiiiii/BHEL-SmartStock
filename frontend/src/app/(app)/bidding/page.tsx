'use client';

import { useEffect, useState, useCallback } from 'react';
import { tendersApi, materialsApi } from '@/lib/api';
import { Tender, Material } from '@/types';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';
import { Plus, Trophy, Clock, ShoppingBag, CheckCircle } from 'lucide-react';
import {
  Card, CardContent, CardHeader, CardTitle, Button, StatusBadge, Badge,
  Table, TableHead, TableBody, TableRow, TableHeader, TableCell,
  Modal, Spinner, EmptyState, ConfirmDialog
} from '@/components/ui';
import { formatDate } from '@/lib/utils';

export default function BiddingPage() {
  const { user, isRole } = useAuth();
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [detailModal, setDetailModal] = useState<{ open: boolean; tender: Tender | null }>({ open: false, tender: null });
  const [createModal, setCreateModal] = useState(false);
  const [bidModal, setBidModal] = useState<{ open: boolean; tenderId: string }>({ open: false, tenderId: '' });
  const [materials, setMaterials] = useState<Material[]>([]);
  const [tenderForm, setTenderForm] = useState({ title: '', description: '', materialId: '', quantity: '', deadline: '' });
  const [bidAmount, setBidAmount] = useState('');
  const [bidNotes, setBidNotes] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [winnerConfirm, setWinnerConfirm] = useState<{ open: boolean; tenderId: string; bidId: string } | null>(null);

  const isManager = isRole('ADMIN', 'STORE_MANAGER');
  const isVendor = isRole('VENDOR');

  const fetchTenders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await tendersApi.getAll({ status: statusFilter });
      setTenders(res.data.data);
    } catch {
      toast.error('Failed to load tenders');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { fetchTenders(); }, [fetchTenders]);

  useEffect(() => {
    materialsApi.getAll({ limit: 200 }).then((r) => setMaterials(r.data.data));
  }, []);

  const handleCreateTender = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      await tendersApi.create(tenderForm);
      toast.success('Tender created successfully');
      setCreateModal(false);
      setTenderForm({ title: '', description: '', materialId: '', quantity: '', deadline: '' });
      fetchTenders();
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to create tender');
    } finally {
      setFormLoading(false);
    }
  };

  const handleSubmitBid = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      await tendersApi.submitBid(bidModal.tenderId, { amount: bidAmount, notes: bidNotes });
      toast.success('Bid submitted successfully');
      setBidModal({ open: false, tenderId: '' });
      setBidAmount('');
      setBidNotes('');
      fetchTenders();
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to submit bid');
    } finally {
      setFormLoading(false);
    }
  };

  const handleSelectWinner = async () => {
    if (!winnerConfirm) return;
    try {
      await tendersApi.selectWinner(winnerConfirm.tenderId, winnerConfirm.bidId);
      toast.success('Winner selected! Tender closed.');
      fetchTenders();
      setDetailModal({ open: false, tender: null });
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to select winner');
    }
    setWinnerConfirm(null);
  };

  const getMyBid = (tender: Tender) => {
    if (!isVendor || !user?.vendorId) return null;
    return tender.bids.find((b) => b.supplierId === user.vendorId);
  };

  const formatINR = (amount: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-screen-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">Supplier Bidding Desk</h1>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">
            {isVendor ? 'View open tenders and submit your quotations' : 'Manage tenders and compare supplier bids'}
          </p>
        </div>
        {isManager && (
          <Button onClick={() => setCreateModal(true)}>
            <Plus size={16} /> Create Tender
          </Button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit">
        {[{ key: '', label: 'All' }, { key: 'OPEN', label: 'Open' }, { key: 'AWARDED', label: 'Awarded' }, { key: 'CLOSED', label: 'Closed' }].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              statusFilter === tab.key ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tenders grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16"><Spinner className="h-6 w-6" /></div>
      ) : tenders.length === 0 ? (
        <EmptyState title="No tenders found" description={isManager ? "Create a new tender to get started" : "No open tenders available"} icon={<ShoppingBag size={40} />} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {tenders.map((tender) => {
            const myBid = getMyBid(tender);
            const winnerBid = tender.bids.find((b) => b.isWinner);
            const isExpired = new Date(tender.deadline) < new Date();
            const lowestBid = tender.bids.length > 0 ? Math.min(...tender.bids.map((b) => b.amount)) : null;

            return (
              <Card key={tender.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{tender.title}</h3>
                      {tender.description && (
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{tender.description}</p>
                      )}
                    </div>
                    <StatusBadge status={tender.status} />
                  </div>

                  <div className="space-y-1.5 text-xs text-gray-500 mb-4">
                    <div className="flex items-center gap-1.5">
                      <Clock size={12} />
                      <span>Deadline: <span className={`font-medium ${isExpired && tender.status === 'OPEN' ? 'text-red-600' : 'text-gray-700'}`}>{formatDate(tender.deadline)}</span></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-lg">{tender.bids.length} bid{tender.bids.length !== 1 ? 's' : ''}</span>
                      {lowestBid !== null && (
                        <span className="text-green-600 font-medium">Lowest: {formatINR(lowestBid)}</span>
                      )}
                    </div>
                    {myBid && (
                      <div className="flex items-center gap-1 text-blue-600">
                        <CheckCircle size={12} />
                        <span>Your bid: {formatINR(myBid.amount)}</span>
                        {myBid.isWinner && <Trophy size={12} className="text-yellow-500" />}
                      </div>
                    )}
                    {winnerBid && (
                      <div className="flex items-center gap-1 text-green-600 font-medium">
                        <Trophy size={12} />
                        <span>Winner: {winnerBid.supplier?.name} — {formatINR(winnerBid.amount)}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => setDetailModal({ open: true, tender })}>
                      View Details
                    </Button>
                    {isVendor && tender.status === 'OPEN' && !isExpired && (
                      <Button size="sm" className="flex-1" onClick={() => setBidModal({ open: true, tenderId: tender.id })}>
                        {myBid ? 'Update Bid' : 'Submit Bid'}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Tender Detail Modal */}
      <Modal open={detailModal.open} onClose={() => setDetailModal({ open: false, tender: null })} title="Tender Details" size="xl">
        {detailModal.tender && (
          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-800/60 rounded-xl p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-500">Title:</span>
                <span className="font-semibold">{detailModal.tender.title}</span>
              </div>
              {detailModal.tender.description && (
                <div><span className="text-gray-500 dark:text-gray-500">Description:</span> <span className="ml-2">{detailModal.tender.description}</span></div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-500">Status:</span>
                <StatusBadge status={detailModal.tender.status} />
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-500">Deadline:</span>
                <span>{formatDate(detailModal.tender.deadline)}</span>
              </div>
              {detailModal.tender.quantity && (
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-500">Required Qty:</span>
                  <span className="font-medium">{detailModal.tender.quantity}</span>
                </div>
              )}
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">
                Submitted Bids ({detailModal.tender.bids.length})
              </h4>
              {detailModal.tender.bids.length === 0 ? (
                <p className="text-sm text-gray-400 py-4 text-center">No bids submitted yet</p>
              ) : (
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableHeader>Supplier</TableHeader>
                      <TableHeader>Amount (INR)</TableHeader>
                      <TableHeader>Submitted</TableHeader>
                      <TableHeader>Notes</TableHeader>
                      <TableHeader>Status</TableHeader>
                      {isManager && detailModal.tender.status === 'OPEN' && <TableHeader>Action</TableHeader>}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {detailModal.tender.bids
                      .sort((a, b) => a.amount - b.amount)
                      .map((bid, idx) => (
                        <TableRow key={bid.id} className={bid.isWinner ? 'bg-emerald-50 dark:bg-emerald-500/10' : ''}>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {idx === 0 && <span className="text-xs text-green-600 font-bold">LOWEST</span>}
                              <span className="font-medium">{bid.supplier?.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="font-bold text-gray-800 dark:text-gray-200">{formatINR(bid.amount)}</TableCell>
                          <TableCell className="text-gray-400 text-xs">{formatDate(bid.submittedAt)}</TableCell>
                          <TableCell className="text-gray-500 text-xs">{bid.notes || '—'}</TableCell>
                          <TableCell>
                            {bid.isWinner ? (
                              <Badge variant="success"><Trophy size={10} className="mr-1" />Winner</Badge>
                            ) : (
                              <Badge variant="default">Pending</Badge>
                            )}
                          </TableCell>
                          {isManager && detailModal.tender.status === 'OPEN' && (
                            <TableCell>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setWinnerConfirm({ open: true, tenderId: detailModal.tender!.id, bidId: bid.id })}
                              >
                                <Trophy size={13} /> Select
                              </Button>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Create Tender Modal */}
      <Modal open={createModal} onClose={() => setCreateModal(false)} title="Create New Tender" size="md">
        <form onSubmit={handleCreateTender} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input value={tenderForm.title} onChange={(e) => setTenderForm({ ...tenderForm, title: e.target.value })}
              required placeholder="e.g. Stainless Steel Supply Q1 2025"
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800/60 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-900/10 dark:focus:ring-blue-500/40 focus:border-gray-300 dark:focus:border-blue-600" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea value={tenderForm.description} onChange={(e) => setTenderForm({ ...tenderForm, description: e.target.value })}
              rows={3} placeholder="Detailed requirements..."
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800/60 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-900/10 dark:focus:ring-blue-500/40 focus:border-gray-300 dark:focus:border-blue-600 resize-none" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Material (Optional)</label>
              <select value={tenderForm.materialId} onChange={(e) => setTenderForm({ ...tenderForm, materialId: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800/60 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-900/10 dark:focus:ring-blue-500/40 focus:border-gray-300 dark:focus:border-blue-600">
                <option value="">None</option>
                {materials.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Required Qty</label>
              <input type="number" min="0" value={tenderForm.quantity} onChange={(e) => setTenderForm({ ...tenderForm, quantity: e.target.value })}
                placeholder="0"
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800/60 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-900/10 dark:focus:ring-blue-500/40 focus:border-gray-300 dark:focus:border-blue-600" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Deadline *</label>
            <input type="date" value={tenderForm.deadline} onChange={(e) => setTenderForm({ ...tenderForm, deadline: e.target.value })}
              required min={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800/60 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-900/10 dark:focus:ring-blue-500/40 focus:border-gray-300 dark:focus:border-blue-600" />
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setCreateModal(false)}>Cancel</Button>
            <Button type="submit" disabled={formLoading}>{formLoading ? 'Creating...' : 'Create Tender'}</Button>
          </div>
        </form>
      </Modal>

      {/* Submit Bid Modal */}
      <Modal open={bidModal.open} onClose={() => setBidModal({ open: false, tenderId: '' })} title="Submit Quotation" size="sm">
        <form onSubmit={handleSubmitBid} className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-500/10 rounded-xl p-3 text-sm text-blue-700 dark:text-blue-400">
            All amounts in Indian Rupees (INR ₹)
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bid Amount (₹) *</label>
            <input type="number" min="1" step="0.01" value={bidAmount} onChange={(e) => setBidAmount(e.target.value)}
              required placeholder="Enter your total bid amount"
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800/60 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-900/10 dark:focus:ring-blue-500/40 focus:border-gray-300 dark:focus:border-blue-600" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea value={bidNotes} onChange={(e) => setBidNotes(e.target.value)} rows={3}
              placeholder="Delivery terms, conditions, etc."
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800/60 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-900/10 dark:focus:ring-blue-500/40 focus:border-gray-300 dark:focus:border-blue-600 resize-none" />
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setBidModal({ open: false, tenderId: '' })}>Cancel</Button>
            <Button type="submit" disabled={formLoading}>{formLoading ? 'Submitting...' : 'Submit Bid'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!winnerConfirm?.open}
        onClose={() => setWinnerConfirm(null)}
        onConfirm={handleSelectWinner}
        title="Select Winning Bid"
        message="This will mark the selected bid as the winner and close the tender. Other vendors will not be awarded."
        confirmLabel="Select Winner"
      />
    </div>
  );
}
