import React, { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  LayoutDashboard,
  ShieldCheck,
  Sparkles,
  UserCheck,
  X
} from 'lucide-react';
import { api } from '../../api/client.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';
import { SkeletonCards } from '../ui/Skeleton.jsx';

const BookingHero3D = lazy(() =>
  import('./BookingHero3D.jsx').then((m) => ({ default: m.BookingHero3D }))
);

const STAFF_OPTIONS = ['Dr. Aria Chen', 'Soren Lindqvist', 'Marcus Cole', 'General Staff'];

function toLocalDateTimeInput(dateObj) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${dateObj.getFullYear()}-${pad(dateObj.getMonth() + 1)}-${pad(dateObj.getDate())}T${pad(
    dateObj.getHours()
  )}:${pad(dateObj.getMinutes())}`;
}

export function PublicBookingView({ onOpenAdmin }) {
  const toast = useToast();
  const { isDark } = useTheme();
  const scrollProgressRef = useRef(0);
  const containerRef = useRef(null);

  const [services, setServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Self-booking form state
  const defaultStart = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(10, 0, 0, 0);
    return toLocalDateTimeInput(d);
  }, []);

  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [staffName, setStaffName] = useState(STAFF_OPTIONS[0]);
  const [appointmentDate, setAppointmentDate] = useState(defaultStart);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [conflictError, setConflictError] = useState('');
  const [confirmedBooking, setConfirmedBooking] = useState(null);

  useEffect(() => {
    let active = true;
    async function loadServices() {
      setLoadingServices(true);
      try {
        const res = await api.getServices({ activeOnly: true });
        if (!active) return;
        const list = res.data || [];
        setServices(list);
        if (list.length > 0) setSelectedServiceId(list[0]._id);
      } catch (err) {
        toast.error(err.message || 'Could not load active services');
      } finally {
        if (active) setLoadingServices(false);
      }
    }
    loadServices();
    return () => {
      active = false;
    };
  }, [toast]);

  // Track window scroll progress smoothly for <BookingHero3D />
  useEffect(() => {
    const onScroll = () => {
      const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      scrollProgressRef.current = Math.min(1, Math.max(0, window.scrollY / maxScroll));
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const selectedService = useMemo(
    () => services.find((s) => s._id === selectedServiceId) || null,
    [services, selectedServiceId]
  );

  const computedEndTimeLabel = useMemo(() => {
    if (!selectedService || !appointmentDate) return '—';
    const start = new Date(appointmentDate);
    if (Number.isNaN(start.getTime())) return '—';
    const end = new Date(start.getTime() + selectedService.durationMinutes * 60000);
    return end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }, [selectedService, appointmentDate]);

  function openBookingWithService(serviceId) {
    if (serviceId) setSelectedServiceId(serviceId);
    setConflictError('');
    setConfirmedBooking(null);
    setDrawerOpen(true);
  }

  async function handleBookingSubmit(e) {
    e.preventDefault();
    setConflictError('');
    if (!selectedServiceId) {
      toast.error('Please select a service first');
      return;
    }

    setSubmitting(true);
    try {
      const isoDate = new Date(appointmentDate).toISOString();
      const res = await api.createAppointment({
        service: selectedServiceId,
        staffName,
        appointmentDate: isoDate,
        notes,
        clientInfo: {
          fullName: fullName.trim(),
          email: email.trim(),
          phone: phone.trim()
        }
      });

      setConfirmedBooking(res.data);
      toast.success('Appointment confirmed and added to studio schedule!');
      setNotes('');
    } catch (err) {
      if (err.status === 409) {
        setConflictError(err.message);
      }
      toast.error(err.message || 'Unable to complete booking');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div ref={containerRef} className="relative min-h-screen overflow-x-hidden">
      {/* Scroll-Driven 3D Frosted Clockwork Centerpiece */}
      <Suspense fallback={null}>
        <BookingHero3D scrollProgressRef={scrollProgressRef} isDark={isDark} />
      </Suspense>

      {/* Section 1: Hero Showcase */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 pt-28 pb-24 lg:pt-36 lg:pb-32">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="max-w-2xl"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/25 bg-amber-400/10 px-3.5 py-1.5 text-xs font-medium text-amber-600 dark:text-amber-300 backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5" />
            <span>PRECISION SCHEDULING FOR CLINICS, SALONS &amp; STUDIOS</span>
          </div>

          <h1 className="font-display mt-6 text-4xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-6xl leading-[1.06]">
            Time architecture for{' '}
            <span className="bg-gradient-to-r from-amber-500 via-amber-300 to-sky-400 bg-clip-text text-transparent">
              effortless bookings.
            </span>
          </h1>

          <p className="mt-5 text-base sm:text-lg leading-relaxed text-slate-600 dark:text-slate-300 max-w-xl">
            Reserve specialist consultations, botanical rituals, and studio sessions in seconds with real-time double-booking protection and seamless calendar orchestration.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3.5">
            <button
              type="button"
              onClick={() => openBookingWithService(services[0]?._id)}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-6 py-3.5 text-sm font-semibold text-slate-950 shadow-lg shadow-amber-500/20 hover:bg-amber-300 transition-colors"
            >
              <span>Book an Appointment</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={onOpenAdmin}
              className="inline-flex items-center gap-2 rounded-xl glass-panel px-5 py-3.5 text-sm font-medium text-slate-800 dark:text-slate-200 hover:border-amber-400/40 transition-colors"
            >
              <LayoutDashboard className="h-4 w-4 text-sky-400" />
              <span>Admin Bento Workspace</span>
            </button>
          </div>

          <div className="mt-12 grid grid-cols-3 gap-4 max-w-lg border-t border-slate-200 dark:border-white/10 pt-6">
            <div>
              <div className="font-display text-2xl font-bold text-slate-900 dark:text-white">0 ms</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Overlap Detection</div>
            </div>
            <div>
              <div className="font-display text-2xl font-bold text-slate-900 dark:text-white">24/7</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Client Self-Booking</div>
            </div>
            <div>
              <div className="font-display text-2xl font-bold text-slate-900 dark:text-white">100%</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Atlas Cloud Sync</div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Section 2: Featured Services */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 py-20">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-amber-500">Curated Menu</p>
            <h2 className="font-display text-3xl font-bold text-slate-900 dark:text-white mt-1.5">
              Featured Treatments &amp; Sessions
            </h2>
          </div>
          <a
            href="#quick-booking"
            className="text-sm font-medium text-sky-500 hover:text-sky-400 inline-flex items-center gap-1.5"
          >
            Jump to Quick Booking <ArrowRight className="h-4 w-4" />
          </a>
        </div>

        {loadingServices ? (
          <SkeletonCards count={6} />
        ) : services.length === 0 ? (
          <div className="glass-panel rounded-2xl p-10 text-center text-sm text-slate-500 dark:text-slate-400">
            No active services available yet. Open the Admin Workspace to create or seed services.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {services.map((svc, idx) => (
              <motion.article
                key={svc._id}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
                className="glass-panel rounded-2xl p-6 flex flex-col justify-between hover:border-amber-400/35 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="rounded-full border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 px-2.5 py-0.5 text-[11px] font-medium text-slate-600 dark:text-slate-300">
                      {svc.category}
                    </span>
                    <span className="font-display text-lg font-bold text-amber-500 dark:text-amber-300">
                      ${svc.price}
                    </span>
                  </div>
                  <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
                    {svc.name}
                  </h3>
                  <div className="mt-2 inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{svc.durationMinutes} minutes</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => openBookingWithService(svc._id)}
                  className="mt-6 w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-amber-400 hover:text-slate-950 hover:border-amber-400 transition-colors"
                >
                  Reserve This Session
                </button>
              </motion.article>
            ))}
          </div>
        )}
      </section>

      {/* Section 3: How It Works */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 py-20">
        <div className="glass-panel rounded-3xl p-8 sm:p-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-sky-400">Seamless Workflow</p>
          <h2 className="font-display text-3xl font-bold text-slate-900 dark:text-white mt-1.5 mb-10">
            How Client Scheduling Works
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                step: '01',
                icon: Calendar,
                title: 'Choose Service & Specialist',
                desc: 'Pick from active treatments with transparent pricing and auto-computed session durations.'
              },
              {
                step: '02',
                icon: ShieldCheck,
                title: 'Zero-Conflict Verification',
                desc: 'Our Express + MongoDB overlap engine prevents double-bookings across every specialist calendar.'
              },
              {
                step: '03',
                icon: UserCheck,
                title: 'Instant Schedule Sync',
                desc: 'Confirmed bookings appear immediately inside the Bento Admin Timeline for seamless check-in.'
              }
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.step}
                  className="rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white/60 dark:bg-white/[0.02] p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-mono text-amber-500">{item.step}</span>
                    <Icon className="h-5 w-5 text-sky-400" />
                  </div>
                  <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white mb-2">
                    {item.title}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Section 4: Quick Client Self-Booking Callout */}
      <section id="quick-booking" className="relative z-10 mx-auto max-w-7xl px-6 pt-12 pb-28">
        <div className="glass-panel rounded-3xl p-8 sm:p-12 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
          <div className="max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-widest text-amber-500">Quick Self-Booking</p>
            <h2 className="font-display text-3xl font-bold text-slate-900 dark:text-white mt-2">
              Ready to reserve your preferred time window?
            </h2>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
              Open the interactive booking drawer to pick a specialist, verify real-time slot availability, and receive immediate confirmation.
            </p>
          </div>
          <button
            type="button"
            onClick={() => openBookingWithService(selectedServiceId || services[0]?._id)}
            className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-amber-400 px-7 py-4 text-sm font-semibold text-slate-950 hover:bg-amber-300 shadow-xl shadow-amber-500/20 transition-colors"
          >
            <span>Open Self-Booking Drawer</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </section>

      {/* Slide-Over Self-Service Booking Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            onClick={() => setDrawerOpen(false)}
            className="fixed inset-0 bg-black/65 backdrop-blur-sm"
          />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="relative z-10 h-full w-full max-w-md overflow-y-auto border-l border-slate-200 dark:border-white/10 bg-white dark:bg-[#0d1017] p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-4 mb-6">
              <div>
                <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                  Client Self-Booking
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Real-time slot verification enabled
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10"
                aria-label="Close booking drawer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {confirmedBooking ? (
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center space-y-3">
                <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto" />
                <h4 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                  Reservation Confirmed
                </h4>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  {confirmedBooking.client?.fullName} — {confirmedBooking.service?.name} with{' '}
                  <strong>{confirmedBooking.staffName}</strong>
                </p>
                <div className="text-xs font-mono text-emerald-600 dark:text-emerald-300">
                  {new Date(confirmedBooking.appointmentDate).toLocaleString()} →{' '}
                  {new Date(confirmedBooking.endTime).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
                <div className="pt-3 flex gap-2 justify-center">
                  <button
                    type="button"
                    onClick={() => setConfirmedBooking(null)}
                    className="rounded-xl border border-slate-300 dark:border-white/15 px-4 py-2 text-xs font-semibold"
                  >
                    Book Another
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDrawerOpen(false);
                      onOpenAdmin();
                    }}
                    className="rounded-xl bg-amber-400 px-4 py-2 text-xs font-semibold text-slate-950"
                  >
                    View in Admin
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleBookingSubmit} className="space-y-4">
                {conflictError && (
                  <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-600 dark:text-rose-300">
                    {conflictError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                    Service Treatment
                  </label>
                  <select
                    value={selectedServiceId}
                    onChange={(e) => setSelectedServiceId(e.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] px-3.5 py-2.5 text-sm outline-none focus:border-amber-400"
                  >
                    {services.map((s) => (
                      <option key={s._id} value={s._id} className="bg-slate-900 text-white">
                        {s.name} ({s.durationMinutes}m · ${s.price})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                    Specialist
                  </label>
                  <select
                    value={staffName}
                    onChange={(e) => setStaffName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] px-3.5 py-2.5 text-sm outline-none focus:border-amber-400"
                  >
                    {STAFF_OPTIONS.map((staff) => (
                      <option key={staff} value={staff} className="bg-slate-900 text-white">
                        {staff}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                    Preferred Date &amp; Start Time
                  </label>
                  <input
                    type="datetime-local"
                    value={appointmentDate}
                    onChange={(e) => setAppointmentDate(e.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] px-3.5 py-2.5 text-sm outline-none focus:border-amber-400"
                  />
                  {selectedService && (
                    <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                      Estimated end time: <strong>{computedEndTimeLabel}</strong> ({selectedService.durationMinutes} min · ${selectedService.price})
                    </p>
                  )}
                </div>

                <div className="border-t border-slate-200 dark:border-white/10 pt-4 space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Elena Rostova"
                      className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] px-3.5 py-2.5 text-sm outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="elena@example.com"
                      className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] px-3.5 py-2.5 text-sm outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (415) 555-0142"
                      className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] px-3.5 py-2.5 text-sm outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                      Notes (Optional)
                    </label>
                    <textarea
                      rows={2}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Allergies, preferred suite, or session notes"
                      className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] px-3.5 py-2 text-sm outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting || services.length === 0}
                  className="w-full rounded-xl bg-amber-400 py-3 text-sm font-semibold text-slate-950 hover:bg-amber-300 disabled:opacity-50 transition-colors"
                >
                  {submitting ? 'Verifying Slot & Confirming...' : 'Confirm Appointment'}
                </button>
              </form>
            )}
          </motion.aside>
        </div>
      )}
    </div>
  );
}
