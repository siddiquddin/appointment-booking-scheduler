import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Briefcase,
  CalendarDays,
  Clock,
  LayoutDashboard,
  Moon,
  Sparkles,
  Sun,
  Users
} from 'lucide-react';
import { ToastProvider } from './context/ToastContext.jsx';
import { ThemeProvider, useTheme } from './context/ThemeContext.jsx';
import { api } from './api/client.js';
import { PublicBookingView } from './components/booking/PublicBookingView.jsx';
import { DashboardOverview } from './components/admin/DashboardOverview.jsx';
import { AppointmentsManager } from './components/admin/AppointmentsManager.jsx';
import { ClientsDirectory } from './components/admin/ClientsDirectory.jsx';
import { ServicesCatalog } from './components/admin/ServicesCatalog.jsx';

const ADMIN_TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'appointments', label: 'Appointments', icon: CalendarDays },
  { id: 'clients', label: 'Clients', icon: Users },
  { id: 'services', label: 'Services', icon: Briefcase }
];

function SchedulerShell() {
  const { isDark, toggleTheme } = useTheme();
  const [mode, setMode] = useState('booking'); // 'booking' | 'admin'
  const [adminTab, setAdminTab] = useState('overview');
  const [apiConnected, setApiConnected] = useState(null);

  useEffect(() => {
    let active = true;
    api
      .getHealth()
      .then((res) => {
        if (active) setApiConnected(Boolean(res?.database?.connected));
      })
      .catch(() => {
        if (active) setApiConnected(false);
      });
    return () => {
      active = false;
    };
  }, [mode]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Persistent Top Navigation */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 dark:border-white/[0.08] bg-white/80 dark:bg-[#090b10]/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => setMode('booking')}
            className="flex items-center gap-2.5 text-left"
          >
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-amber-400 to-sky-400 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-amber-500/15">
              <Clock className="h-4 w-4" />
            </div>
            <div>
              <div className="font-display text-sm font-bold tracking-tight text-slate-900 dark:text-white">
                Chronos Atelier
              </div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Booking Suite
              </div>
            </div>
          </button>

          {/* Primary Surface Switcher */}
          <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/[0.03] p-1">
            <button
              type="button"
              onClick={() => setMode('booking')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                mode === 'booking'
                  ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              <span>3D Booking</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('admin')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                mode === 'admin'
                  ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <LayoutDashboard className="h-3.5 w-3.5 text-sky-400" />
              <span>Admin Bento</span>
            </button>
          </div>

          <div className="flex items-center gap-2.5">
            <div
              className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-slate-200 dark:border-white/10 px-2.5 py-1 text-[11px] font-mono text-slate-600 dark:text-slate-300"
              title="MongoDB Atlas Health Status"
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  apiConnected === true
                    ? 'bg-emerald-400'
                    : apiConnected === false
                    ? 'bg-rose-400'
                    : 'bg-amber-400 animate-pulse'
                }`}
              />
              <span>{apiConnected === true ? 'ATLAS LIVE' : apiConnected === false ? 'API OFFLINE' : 'CHECKING'}</span>
            </div>

            <button
              type="button"
              onClick={toggleTheme}
              className="rounded-xl border border-slate-200 dark:border-white/10 p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
              aria-label="Toggle dark or light surface theme"
            >
              {isDark ? <Sun className="h-4 w-4 text-amber-300" /> : <Moon className="h-4 w-4 text-slate-700" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      {mode === 'booking' ? (
        <main className="flex-1">
          <PublicBookingView onOpenAdmin={() => setMode('admin')} />
        </main>
      ) : (
        <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 py-8 space-y-8">
          {/* Zero-Lag Admin Workspace Tab Bar with Animated Indicator */}
          <nav
            aria-label="Admin Workspace Sections"
            className="flex items-center gap-2 overflow-x-auto border-b border-slate-200 dark:border-white/10 pb-3"
          >
            {ADMIN_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = adminTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setAdminTab(tab.id)}
                  className={`relative inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                    isActive
                      ? 'text-slate-900 dark:text-white'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="adminActiveTab"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                      className="absolute inset-0 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-white/[0.07] shadow-sm -z-10"
                    />
                  )}
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {adminTab === 'overview' && <DashboardOverview />}
          {adminTab === 'appointments' && <AppointmentsManager />}
          {adminTab === 'clients' && <ClientsDirectory />}
          {adminTab === 'services' && <ServicesCatalog />}
        </main>
      )}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <SchedulerShell />
      </ToastProvider>
    </ThemeProvider>
  );
}
