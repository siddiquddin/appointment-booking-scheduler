import React, { createContext, useCallback, useContext, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (message, type = 'success', duration = 4200) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => removeToast(id), duration);
    },
    [removeToast]
  );

  const value = {
    success: (msg) => addToast(msg, 'success'),
    error: (msg) => addToast(msg, 'error', 5500),
    info: (msg) => addToast(msg, 'info')
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        <AnimatePresence>
          {toasts.map((toast) => {
            const Icon =
              toast.type === 'error' ? AlertCircle : toast.type === 'info' ? Info : CheckCircle2;
            const ringStyle =
              toast.type === 'error'
                ? 'border-rose-500/40 bg-rose-950/90 text-rose-100'
                : toast.type === 'info'
                ? 'border-sky-500/40 bg-slate-900/90 text-sky-100'
                : 'border-emerald-500/40 bg-emerald-950/90 text-emerald-100';

            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: 18, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.96 }}
                className={`pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-2xl backdrop-blur-xl ${ringStyle}`}
              >
                <Icon className="h-4 w-4 mt-0.5 shrink-0" />
                <span className="flex-1 leading-snug">{toast.message}</span>
                <button
                  type="button"
                  onClick={() => removeToast(toast.id)}
                  className="opacity-65 hover:opacity-100 transition-opacity"
                  aria-label="Dismiss notification"
                >
                  <X className="h-4 w-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
