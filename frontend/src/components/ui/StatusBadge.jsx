import React from 'react';

const STATUS_STYLES = {
  Scheduled: 'bg-sky-500/12 text-sky-600 dark:text-sky-300 border-sky-500/25',
  Completed: 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 border-emerald-500/25',
  Cancelled: 'bg-rose-500/12 text-rose-700 dark:text-rose-300 border-rose-500/25',
  'No-Show': 'bg-amber-500/12 text-amber-700 dark:text-amber-300 border-amber-500/25'
};

export function StatusBadge({ status }) {
  const cls = STATUS_STYLES[status] || 'bg-slate-500/10 text-slate-400 border-slate-500/20';
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${cls}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}
