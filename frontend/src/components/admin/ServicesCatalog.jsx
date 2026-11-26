import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Clock, Edit3, Plus, Power, Trash2 } from 'lucide-react';
import { api } from '../../api/client.js';
import { useToast } from '../../context/ToastContext.jsx';
import { Modal } from '../ui/Modal.jsx';
import { ConfirmDialog } from '../ui/ConfirmDialog.jsx';
import { SkeletonCards } from '../ui/Skeleton.jsx';

export function ServicesCatalog() {
  const toast = useToast();

  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('All');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [formState, setFormState] = useState({
    name: '',
    category: 'Hair Studio',
    durationMinutes: 45,
    price: 90,
    isActive: true
  });
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadServices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getServices();
      setServices(res.data || []);
    } catch (err) {
      toast.error(err.message || 'Failed to load services');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  const categories = useMemo(() => {
    const unique = new Set(services.map((s) => s.category));
    return ['All', ...Array.from(unique)];
  }, [services]);

  const visibleServices = useMemo(() => {
    if (categoryFilter === 'All') return services;
    return services.filter((s) => s.category === categoryFilter);
  }, [services, categoryFilter]);

  function openAddModal() {
    setEditingService(null);
    setFormState({ name: '', category: 'Hair Studio', durationMinutes: 45, price: 90, isActive: true });
    setModalOpen(true);
  }

  function openEditModal(svc) {
    setEditingService(svc);
    setFormState({
      name: svc.name,
      category: svc.category,
      durationMinutes: svc.durationMinutes,
      price: svc.price,
      isActive: svc.isActive
    });
    setModalOpen(true);
  }

  async function toggleActive(svc) {
    try {
      await api.updateService(svc._id, { isActive: !svc.isActive });
      toast.success(`${svc.name} marked ${!svc.isActive ? 'Active' : 'Inactive'}`);
      await loadServices();
    } catch (err) {
      toast.error(err.message || 'Could not toggle service');
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...formState,
        durationMinutes: Number(formState.durationMinutes),
        price: Number(formState.price)
      };
      if (editingService) {
        await api.updateService(editingService._id, payload);
        toast.success('Service updated');
      } else {
        await api.createService(payload);
        toast.success('Service added to catalog');
      }
      setModalOpen(false);
      await loadServices();
    } catch (err) {
      toast.error(err.message || 'Failed to save service');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.deleteService(deleteTarget._id);
      toast.success('Service deleted');
      setDeleteTarget(null);
      await loadServices();
    } catch (err) {
      toast.error(err.message || 'Failed to delete service');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Services Catalog</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Configure service durations, pricing, categories, and public booking visibility
          </p>
        </div>
        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 text-xs font-semibold text-slate-950 hover:bg-amber-300 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Service
        </button>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategoryFilter(cat)}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
              categoryFilter === cat
                ? 'border-amber-400 bg-amber-400/15 text-amber-600 dark:text-amber-300'
                : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:border-slate-400 dark:hover:border-white/25'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <SkeletonCards count={6} />
      ) : visibleServices.length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 text-center text-sm text-slate-500 dark:text-slate-400">
          No services found in this category.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleServices.map((svc) => (
            <div
              key={svc._id}
              className={`glass-panel rounded-2xl p-5 flex flex-col justify-between gap-4 transition-opacity ${
                svc.isActive ? '' : 'opacity-65'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <span className="rounded-full border border-slate-200 dark:border-white/10 px-2.5 py-0.5 text-[11px] font-medium text-slate-500 dark:text-slate-300">
                    {svc.category}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                      svc.isActive
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300'
                        : 'bg-slate-500/15 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {svc.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white">{svc.name}</h3>
                <div className="mt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {svc.durationMinutes} min
                  </span>
                  <span className="font-display text-base font-bold text-amber-500 dark:text-amber-300">
                    ${svc.price}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-slate-200 dark:border-white/[0.08] pt-3">
                <button
                  type="button"
                  onClick={() => toggleActive(svc)}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-amber-400"
                >
                  <Power className="h-3.5 w-3.5" />
                  {svc.isActive ? 'Deactivate' : 'Activate'}
                </button>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => openEditModal(svc)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
                    title="Edit service"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(svc)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-500/15 hover:text-rose-400"
                    title="Delete service"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingService ? 'Edit Service' : 'Add Service'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Service Name</label>
            <input
              type="text"
              required
              value={formState.name}
              onChange={(e) => setFormState((s) => ({ ...s, name: e.target.value }))}
              placeholder="e.g., Botanical Scalp Ritual"
              className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] px-3.5 py-2.5 text-sm outline-none focus:border-amber-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Category</label>
            <input
              type="text"
              required
              value={formState.category}
              onChange={(e) => setFormState((s) => ({ ...s, category: e.target.value }))}
              placeholder="e.g., Wellness & Spa"
              className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] px-3.5 py-2.5 text-sm outline-none focus:border-amber-400"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                Duration (Minutes)
              </label>
              <input
                type="number"
                required
                min={5}
                max={480}
                value={formState.durationMinutes}
                onChange={(e) => setFormState((s) => ({ ...s, durationMinutes: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] px-3.5 py-2.5 text-sm outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Price ($)</label>
              <input
                type="number"
                required
                min={0}
                step="0.01"
                value={formState.price}
                onChange={(e) => setFormState((s) => ({ ...s, price: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] px-3.5 py-2.5 text-sm outline-none focus:border-amber-400"
              />
            </div>
          </div>
          <label className="flex items-center gap-2.5 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={formState.isActive}
              onChange={(e) => setFormState((s) => ({ ...s, isActive: e.target.checked }))}
              className="h-4 w-4 rounded border-slate-300 accent-amber-400"
            />
            Available for public client self-booking
          </label>
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
              {saving ? 'Saving...' : editingService ? 'Save Changes' : 'Create Service'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Service"
        message={`Delete "${deleteTarget?.name}" from the service catalog?`}
      />
    </div>
  );
}
