import React, { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  CalendarCheck2,
  CalendarClock,
  Check,
  Clock,
  DollarSign,
  Users,
  X,
  XCircle
} from 'lucide-react';
import { api } from '../../api/client.js';
import { useToast } from '../../context/ToastContext.jsx';
import { StatusBadge } from '../ui/StatusBadge.jsx';
import { SkeletonCards, SkeletonRow } from '../ui/Skeleton.jsx';

export function DashboardOverview() {
  const toast = useToast();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getDashboardStats();
      setStats(res.data);
    } catch (err) {
      toast.error(err.message || 'Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  async function handleQuickStatus(id, status) {
    setBusyId(id);
    try {
      await api.updateAppointmentStatus(id, status);
      toast.success(`Appointment marked as ${status}`);
      await loadStats();
    } catch (err) {
      toast.error(err.message || 'Could not update status');
    } finally {
      setBusyId(null);
    }
  }

  const kpis = stats
    ? [
        { label: "Today's Appointments", value: stats.todaysAppointments, icon: CalendarClock, accent: 'text-sky-400' },
        { label: 'Scheduled Active', value: stats.scheduled, icon: Clock, accent: 'text-amber-400' },
        { label: 'Completed Sessions', value: stats.completed, icon: CalendarCheck2, accent: 'text-emerald-400' },
        { label: 'Cancelled', value: stats.cancelled, icon: XCircle, accent: 'text-rose-400' },
        { label: 'Total Clients', value: stats.totalClients, icon: Users, accent: 'text-indigo-400' },
        {
          label: 'Estimated Revenue',
          value: `$${Number(stats.estimatedRevenue || 0).toLocaleString()}`,
          icon: DollarSign,
          accent: 'text-emerald-400'
        }
      ]
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Studio Overview</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Live metrics and today&apos;s operational schedule
          </p>
        </div>
        <button
          type="button"
          onClick={loadStats}
          className="rounded-xl border border-slate-200 dark:border-white/10 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
        >
          Refresh Telemetry
        </button>
      </div>

      {loading ? (
        <>
          <SkeletonCards count={6} />
          <SkeletonRow count={4} />
        </>
      ) : (
        <>
          {/* Bento KPI Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {kpis.map((card, idx) => {
              const Icon = card.icon;
              return (
                <motion.div
                  key={card.label}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.04 }}
                  className="glass-panel rounded-2xl p-5 flex items-center justify-between"
                >
                  <div>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{card.label}</p>
                    <p className="font-display text-2xl font-bold text-slate-900 dark:text-white mt-1">
                      {card.value}
                    </p>
                  </div>
                  <div className={`rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/[0.04] p-3 ${card.accent}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Today's Schedule Timeline */}
          <div className="glass-panel rounded-2xl p-6">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-4 mb-5">
              <div>
                <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white">
                  Today&apos;s Schedule Timeline (UTC)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  One-click completion and cancellation toggles
                </p>
              </div>
              <span className="rounded-full border border-slate-200 dark:border-white/10 px-2.5 py-0.5 text-xs font-mono text-slate-500 dark:text-slate-300">
                {stats?.todaysSchedule?.length || 0} sessions
              </span>
            </div>

            {!stats?.todaysSchedule?.length ? (
              <div className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">
                No appointments scheduled for today. Use the Appointments Manager or Seed Script to populate today&apos;s calendar.
              </div>
            ) : (
              <div className="space-y-3">
                {stats.todaysSchedule.map((appt) => {
                  const startStr = new Date(appt.appointmentDate).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  });
                  const endStr = new Date(appt.endTime).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  });
                  const isBusy = busyId === appt._id;

                  return (
                    <div
                      key={appt._id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-white/60 dark:bg-white/[0.02] px-4 py-3.5"
                    >
                      <div className="flex items-start sm:items-center gap-4">
                        <div className="rounded-lg border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/[0.04] px-3 py-1.5 text-xs font-mono text-slate-700 dark:text-slate-200 shrink-0">
                          {startStr} – {endStr}
                        </div>
                        <div>
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <span className="font-medium text-sm text-slate-900 dark:text-white">
                              {appt.client?.fullName || 'Unknown Client'}
                            </span>
                            <StatusBadge status={appt.status} />
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {appt.service?.name || 'Service'} · Specialist: {appt.staffName} · ${appt.service?.price ?? 0}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {appt.status !== 'Completed' && (
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => handleQuickStatus(appt._id, 'Completed')}
                            className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-300 hover:bg-emerald-500/20 disabled:opacity-50"
                          >
                            <Check className="h-3.5 w-3.5" />
                            Complete
                          </button>
                        )}
                        {appt.status !== 'Cancelled' && (
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => handleQuickStatus(appt._id, 'Cancelled')}
                            className="inline-flex items-center gap-1 rounded-lg border border-rose-500/30 bg-rose-500/10 px-2.5 py-1.5 text-xs font-medium text-rose-600 dark:text-rose-300 hover:bg-rose-500/20 disabled:opacity-50"
                          >
                            <X className="h-3.5 w-3.5" />
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
