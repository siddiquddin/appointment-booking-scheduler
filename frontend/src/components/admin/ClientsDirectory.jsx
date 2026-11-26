import React, { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Edit3, History, Plus, Search, Trash2, X } from 'lucide-react';
import { api } from '../../api/client.js';
import { useDebounce } from '../../hooks/useDebounce.js';
import { useToast } from '../../context/ToastContext.jsx';
import { Modal } from '../ui/Modal.jsx';
import { ConfirmDialog } from '../ui/ConfirmDialog.jsx';
import { StatusBadge } from '../ui/StatusBadge.jsx';
import { SkeletonRow } from '../ui/Skeleton.jsx';

export function ClientsDirectory() {
  const toast = useToast();

  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);

  // Add/Edit Client modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [formState, setFormState] = useState({ fullName: '', email: '', phone: '', notes: '' });
  const [saving, setSaving] = useState(false);

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // History slide-over drawer
  const [historyClient, setHistoryClient] = useState(null);
  const [historyItems, setHistoryItems] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const loadClients = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getClients(debouncedSearch);
      setClients(res.data || []);
    } catch (err) {
      toast.error(err.message || 'Failed to load clients');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, toast]);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  function openAddModal() {
    setEditingClient(null);
    setFormState({ fullName: '', email: '', phone: '', notes: '' });
    setModalOpen(true);
  }

  function openEditModal(client) {
    setEditingClient(client);
    setFormState({
      fullName: client.fullName || '',
      email: client.email || '',
      phone: client.phone || '',
      notes: client.notes || ''
    });
    setModalOpen(true);
  }

  async function openHistoryDrawer(client) {
    setHistoryClient(client);
    setLoadingHistory(true);
    try {
      const res = await api.getAppointments({ clientId: client._id });
      setHistoryItems(res.data || []);
    } catch (err) {
      toast.error(err.message || 'Could not load booking history');
    } finally {
      setLoadingHistory(false);
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingClient) {
        await api.updateClient(editingClient._id, formState);
        toast.success('Client profile updated');
      } else {
        await api.createClient(formState);
        toast.success('Client added to directory');
      }
      setModalOpen(false);
      await loadClients();
    } catch (err) {
      toast.error(err.message || 'Failed to save client');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.deleteClient(deleteTarget._id);
      toast.success('Client deleted');
      setDeleteTarget(null);
      await loadClients();
    } catch (err) {
      toast.error(err.message || 'Failed to delete client');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Clients Directory</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Search profiles, manage notes, and inspect full booking history
          </p>
        </div>
        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 text-xs font-semibold text-slate-950 hover:bg-amber-300 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Client
        </button>
      </div>

      {/* Debounced Search Bar */}
      <div className="glass-panel rounded-2xl p-3 flex items-center gap-3">
        <Search className="h-4 w-4 text-slate-400 ml-2 shrink-0" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search clients by full name, email, or phone..."
          className="w-full bg-transparent py-1.5 text-sm outline-none placeholder:text-slate-500"
        />
        {searchTerm && (
          <button
            type="button"
            onClick={() => setSearchTerm('')}
            className="text-xs text-slate-400 hover:text-white px-2"
          >
            Clear
          </button>
        )}
      </div>

      {loading ? (
        <SkeletonRow count={5} />
      ) : clients.length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 text-center text-sm text-slate-500 dark:text-slate-400">
          No clients found{debouncedSearch ? ` matching "${debouncedSearch}"` : ''}.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {clients.map((client) => (
            <div
              key={client._id}
              className="glass-panel rounded-2xl p-5 flex flex-col justify-between gap-4"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white">
                      {client.fullName}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{client.email}</p>
                    <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-0.5">{client.phone}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openHistoryDrawer(client)}
                      className="rounded-lg p-1.5 text-sky-400 hover:bg-sky-500/10"
                      title="View booking history"
                    >
                      <History className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditModal(client)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
                      title="Edit client"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(client)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-500/15 hover:text-rose-400"
                      title="Delete client"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                {client.notes && (
                  <p className="mt-3 rounded-xl border border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-white/[0.02] px-3 py-2 text-xs text-slate-600 dark:text-slate-300">
                    {client.notes}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => openHistoryDrawer(client)}
                className="text-left text-xs font-medium text-amber-500 hover:text-amber-400 inline-flex items-center gap-1.5"
              >
                <History className="h-3.5 w-3.5" />
                Inspect Booking History
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Client Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingClient ? 'Edit Client Profile' : 'Add New Client'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Full Name</label>
            <input
              type="text"
              required
              value={formState.fullName}
              onChange={(e) => setFormState((s) => ({ ...s, fullName: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] px-3.5 py-2.5 text-sm outline-none focus:border-amber-400"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Email</label>
              <input
                type="email"
                required
                value={formState.email}
                onChange={(e) => setFormState((s) => ({ ...s, email: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] px-3.5 py-2.5 text-sm outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Phone</label>
              <input
                type="tel"
                required
                value={formState.phone}
                onChange={(e) => setFormState((s) => ({ ...s, phone: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] px-3.5 py-2.5 text-sm outline-none focus:border-amber-400"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Notes</label>
            <textarea
              rows={3}
              value={formState.notes}
              onChange={(e) => setFormState((s) => ({ ...s, notes: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] px-3.5 py-2 text-sm outline-none focus:border-amber-400"
            />
          </div>
          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="rounded-xl border border-slate-200 dark:border-white/10 px-4 py-2 text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-amber-400 px-5 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-300 disabled:opacity-50"
            >
              {saving ? 'Saving...' : editingClient ? 'Save Profile' : 'Create Client'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Client"
        message={`Delete client "${deleteTarget?.fullName}" from the directory?`}
      />

      {/* Slide-Over Client Booking History Drawer */}
      {historyClient && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div onClick={() => setHistoryClient(null)} className="fixed inset-0 bg-black/65 backdrop-blur-sm" />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            className="relative z-10 h-full w-full max-w-md overflow-y-auto border-l border-slate-200 dark:border-white/10 bg-white dark:bg-[#0d1017] p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between border-b border-slate-200 dark:border-white/10 pb-4 mb-5">
              <div>
                <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                  {historyClient.fullName}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">{historyClient.email} · {historyClient.phone}</p>
              </div>
              <button
                type="button"
                onClick={() => setHistoryClient(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {loadingHistory ? (
              <SkeletonRow count={3} />
            ) : historyItems.length === 0 ? (
              <div className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">
                No appointment history recorded for this client yet.
              </div>
            ) : (
              <div className="space-y-3">
                {historyItems.map((item) => (
                  <div
                    key={item._id}
                    className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] p-4 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm text-slate-900 dark:text-white">
                        {item.service?.name || 'Service'}
                      </span>
                      <StatusBadge status={item.status} />
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Specialist: {item.staffName} · ${item.service?.price ?? 0}
                    </div>
                    <div className="text-xs font-mono text-slate-600 dark:text-slate-300">
                      {new Date(item.appointmentDate).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.aside>
        </div>
      )}
    </div>
  );
}
