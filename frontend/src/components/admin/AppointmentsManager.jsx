import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, Edit3, Plus, Trash2 } from 'lucide-react';
import { api } from '../../api/client.js';
import { useToast } from '../../context/ToastContext.jsx';
import { Modal } from '../ui/Modal.jsx';
import { ConfirmDialog } from '../ui/ConfirmDialog.jsx';
import { StatusBadge } from '../ui/StatusBadge.jsx';
import { SkeletonRow } from '../ui/Skeleton.jsx';

const STATUSES = ['Scheduled', 'Completed', 'Cancelled', 'No-Show'];
const STAFF_LIST = ['Dr. Aria Chen', 'Soren Lindqvist', 'Marcus Cole', 'General Staff'];

function toLocalInputValue(isoString) {
  const d = isoString ? new Date(isoString) : new Date();
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(
    d.getMinutes()
  )}`;
}

export function AppointmentsManager() {
  const toast = useToast();

  const [appointments, setAppointments] = useState([]);
  const [clients, setClients] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterDate, setFilterDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterStaff, setFilterStaff] = useState('All');

  // Create / Edit modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAppt, setEditingAppt] = useState(null);
  const [formState, setFormState] = useState({
    client: '',
    service: '',
    staffName: STAFF_LIST[0],
    appointmentDate: '',
    status: 'Scheduled',
    notes: ''
  });
  const [saving, setSaving] = useState(false);
  const [conflictMsg, setConflictMsg] = useState('');

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadReferenceData = useCallback(async () => {
    try {
      const [clientsRes, servicesRes] = await Promise.all([api.getClients(), api.getServices()]);
      setClients(clientsRes.data || []);
      setServices(servicesRes.data || []);
    } catch (err) {
      toast.error(err.message || 'Failed to load clients or services');
    }
  }, [toast]);

  const loadAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getAppointments({
        date: filterDate,
        status: filterStatus,
        staffName: filterStaff
      });
      setAppointments(res.data || []);
    } catch (err) {
      toast.error(err.message || 'Failed to fetch appointments');
    } finally {
      setLoading(false);
    }
  }, [filterDate, filterStatus, filterStaff, toast]);

  useEffect(() => {
    loadReferenceData();
  }, [loadReferenceData]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  const selectedService = useMemo(
    () => services.find((s) => s._id === formState.service) || null,
    [services, formState.service]
  );

  const calculatedEndTime = useMemo(() => {
    if (!selectedService || !formState.appointmentDate) return '—';
    const start = new Date(formState.appointmentDate);
    if (Number.isNaN(start.getTime())) return '—';
    const end = new Date(start.getTime() + selectedService.durationMinutes * 60000);
    return end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }, [selectedService, formState.appointmentDate]);

  function openCreateModal() {
    const nextHour = new Date();
    nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0);
    setEditingAppt(null);
    setConflictMsg('');
    setFormState({
      client: clients[0]?._id || '',
      service: services.find((s) => s.isActive)?._id || services[0]?._id || '',
      staffName: STAFF_LIST[0],
      appointmentDate: toLocalInputValue(nextHour.toISOString()),
      status: 'Scheduled',
      notes: ''
    });
    setModalOpen(true);
  }

  function openEditModal(appt) {
    setEditingAppt(appt);
    setConflictMsg('');
    setFormState({
      client: appt.client?._id || '',
      service: appt.service?._id || '',
      staffName: appt.staffName || 'General Staff',
      appointmentDate: toLocalInputValue(appt.appointmentDate),
      status: appt.status,
      notes: appt.notes || ''
    });
    setModalOpen(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    setConflictMsg('');
    setSaving(true);

    try {
      const payload = {
        ...formState,
        appointmentDate: new Date(formState.appointmentDate).toISOString()
      };
      if (editingAppt) {
        await api.updateAppointment(editingAppt._id, payload);
        toast.success('Appointment updated successfully');
      } else {
        await api.createAppointment(payload);
        toast.success('Appointment scheduled successfully');
      }
      setModalOpen(false);
      await loadAppointments();
    } catch (err) {
      if (err.status === 409) {
        setConflictMsg(err.message);
      }
      toast.error(err.message || 'Failed to save appointment');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.deleteAppointment(deleteTarget._id);
      toast.success('Appointment deleted');
      setDeleteTarget(null);
      await loadAppointments();
    } catch (err) {
      toast.error(err.message || 'Failed to delete appointment');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Appointments Manager</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Schedule, filter, edit, and verify zero-overlap staff assignments
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 text-xs font-semibold text-slate-950 hover:bg-amber-300 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Appointment
        </button>
      </div>

      {/* Filters Toolbar */}
      <div className="glass-panel rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div>
          <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">Date</label>
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] px-3 py-2 text-xs outline-none focus:border-amber-400"
          />
        </div>
        <div>
          <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">Status</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] px-3 py-2 text-xs outline-none focus:border-amber-400"
          >
            <option value="All" className="bg-slate-900 text-white">All Statuses</option>
            {STATUSES.map((st) => (
              <option key={st} value={st} className="bg-slate-900 text-white">{st}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">Staff</label>
          <select
            value={filterStaff}
            onChange={(e) => setFilterStaff(e.target.value)}
            className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] px-3 py-2 text-xs outline-none focus:border-amber-400"
          >
            <option value="All" className="bg-slate-900 text-white">All Specialists</option>
            {STAFF_LIST.map((staff) => (
              <option key={staff} value={staff} className="bg-slate-900 text-white">{staff}</option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <button
            type="button"
            onClick={() => {
              setFilterDate('');
              setFilterStatus('All');
              setFilterStaff('All');
            }}
            className="w-full rounded-xl border border-slate-200 dark:border-white/10 px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* Appointments Table / Cards */}
      {loading ? (
        <SkeletonRow count={5} />
      ) : appointments.length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 text-center text-sm text-slate-500 dark:text-slate-400">
          No appointments match the current filter criteria.
        </div>
      ) : (
        <>
          {/* Mobile Card List */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {appointments.map((appt) => (
              <div key={appt._id} className="glass-panel rounded-2xl p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-medium text-slate-900 dark:text-white">
                      {appt.client?.fullName || 'Removed Client'}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {appt.service?.name || 'Removed Service'} · {appt.staffName}
                    </div>
                  </div>
                  <StatusBadge status={appt.status} />
                </div>
                <div className="flex items-center justify-between border-t border-slate-200 dark:border-white/[0.06] pt-2.5 text-xs">
                  <span className="font-mono text-slate-600 dark:text-slate-300">
                    {new Date(appt.appointmentDate).toLocaleDateString()} ·{' '}
                    {new Date(appt.appointmentDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <div className="inline-flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => openEditModal(appt)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10"
                      title="Edit appointment"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(appt)}
                      className="rounded-lg p-1.5 text-slate-400 hover:text-rose-400"
                      title="Delete appointment"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block glass-panel rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-white/[0.02] text-xs uppercase text-slate-500 dark:text-slate-400">
                  <tr>
                    <th className="px-5 py-3.5 font-medium">Client</th>
                    <th className="px-5 py-3.5 font-medium">Service</th>
                    <th className="px-5 py-3.5 font-medium">Specialist</th>
                    <th className="px-5 py-3.5 font-medium">Date &amp; Window</th>
                    <th className="px-5 py-3.5 font-medium">Status</th>
                    <th className="px-5 py-3.5 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-white/[0.06]">
                  {appointments.map((appt) => (
                    <tr key={appt._id} className="hover:bg-slate-50/70 dark:hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-medium text-slate-900 dark:text-white">
                          {appt.client?.fullName || 'Removed Client'}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {appt.client?.phone || appt.client?.email || ''}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-slate-800 dark:text-slate-200">{appt.service?.name || 'Removed Service'}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {appt.service?.durationMinutes || 0}m · ${appt.service?.price ?? 0}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-slate-700 dark:text-slate-300">{appt.staffName}</td>
                      <td className="px-5 py-4 font-mono text-xs text-slate-600 dark:text-slate-300">
                        <div>{new Date(appt.appointmentDate).toLocaleDateString()}</div>
                        <div>
                          {new Date(appt.appointmentDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} –{' '}
                          {new Date(appt.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={appt.status} />
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditModal(appt)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200/70 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white"
                            title="Edit appointment"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(appt)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-500/15 hover:text-rose-400"
                            title="Delete appointment"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Create / Edit Appointment Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingAppt ? 'Edit Appointment' : 'Schedule Appointment'}
        subtitle="End time is calculated automatically from the selected service duration."
      >
        <form onSubmit={handleSave} className="space-y-4">
          {conflictMsg && (
            <div className="flex items-start gap-2.5 rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-500 dark:text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{conflictMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Client</label>
            <select
              required
              value={formState.client}
              onChange={(e) => setFormState((s) => ({ ...s, client: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] px-3.5 py-2.5 text-sm outline-none focus:border-amber-400"
            >
              <option value="" disabled className="bg-slate-900 text-white">Select client</option>
              {clients.map((c) => (
                <option key={c._id} value={c._id} className="bg-slate-900 text-white">
                  {c.fullName} ({c.email})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Service</label>
              <select
                required
                value={formState.service}
                onChange={(e) => setFormState((s) => ({ ...s, service: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] px-3.5 py-2.5 text-sm outline-none focus:border-amber-400"
              >
                <option value="" disabled className="bg-slate-900 text-white">Select service</option>
                {services.map((svc) => (
                  <option key={svc._id} value={svc._id} className="bg-slate-900 text-white">
                    {svc.name} ({svc.durationMinutes}m)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Specialist</label>
              <select
                value={formState.staffName}
                onChange={(e) => setFormState((s) => ({ ...s, staffName: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] px-3.5 py-2.5 text-sm outline-none focus:border-amber-400"
              >
                {STAFF_LIST.map((st) => (
                  <option key={st} value={st} className="bg-slate-900 text-white">{st}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                Start Date &amp; Time
              </label>
              <input
                type="datetime-local"
                required
                value={formState.appointmentDate}
                onChange={(e) => setFormState((s) => ({ ...s, appointmentDate: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] px-3.5 py-2.5 text-sm outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Status</label>
              <select
                value={formState.status}
                onChange={(e) => setFormState((s) => ({ ...s, status: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] px-3.5 py-2.5 text-sm outline-none focus:border-amber-400"
              >
                {STATUSES.map((st) => (
                  <option key={st} value={st} className="bg-slate-900 text-white">{st}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100/70 dark:bg-white/[0.03] px-3.5 py-2 text-xs text-slate-600 dark:text-slate-300">
            Computed End Time: <strong className="font-mono">{calculatedEndTime}</strong>
            {selectedService ? ` (${selectedService.durationMinutes} min · $${selectedService.price})` : ''}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Notes</label>
            <textarea
              rows={2}
              value={formState.notes}
              onChange={(e) => setFormState((s) => ({ ...s, notes: e.target.value }))}
              placeholder="Optional session details"
              className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] px-3.5 py-2 text-sm outline-none focus:border-amber-400"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="rounded-xl border border-slate-200 dark:border-white/10 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-amber-400 px-5 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-300 disabled:opacity-50"
            >
              {saving ? 'Saving...' : editingAppt ? 'Save Changes' : 'Schedule Session'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Appointment"
        message={`Remove the appointment for ${deleteTarget?.client?.fullName || 'this client'} on ${
          deleteTarget ? new Date(deleteTarget.appointmentDate).toLocaleString() : ''
        }?`}
      />
    </div>
  );
}
