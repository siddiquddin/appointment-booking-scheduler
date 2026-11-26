import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal } from './Modal.jsx';

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Deletion',
  message = 'Are you sure you want to remove this record? This action cannot be undone.',
  confirmLabel = 'Delete Record',
  loading = false
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-md">
      <div className="flex items-start gap-3.5 text-sm text-slate-600 dark:text-slate-300">
        <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 p-2.5 text-rose-400 shrink-0">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <p className="leading-relaxed pt-0.5">{message}</p>
      </div>
      <div className="mt-6 flex justify-end gap-2.5">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="rounded-xl border border-slate-200 dark:border-white/10 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-500 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Removing...' : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
