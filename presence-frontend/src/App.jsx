import { useEffect, useRef, useState, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AuthProvider } from './lib/AuthContext';
import { ToastProvider } from './lib/ToastContext';
import { ThemeProvider } from './lib/ThemeContext';
import { AccentProvider } from './lib/AccentContext';
import { LanguageProvider } from './lib/LanguageContext';
import ProtectedRoute from './routes/ProtectedRoute';
import PresenceLoader from './components/ui/PresenceLoader';
import WhatsAppFloat from './components/ui/WhatsAppFloat';
import ErrorBoundary from './components/ui/ErrorBoundary';

// Wraps React.lazy() so a failed chunk fetch — the classic "click a link,
// page goes blank" bug that shows up right after a new deploy, when the
// browser still has an old page open and tries to fetch a JS chunk
// filename that no longer exists on the server — recovers with a single
// automatic reload instead of crashing to a blank screen. sessionStorage
// guards against a reload loop if the failure isn't actually a stale
// chunk (e.g. a real network outage).
function lazyWithRetry(importer) {
  return lazy(async () => {
    try {
      return await importer();
    } catch (err) {
      const key = 'presence_reloaded_for_chunk_error';
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, '1');
        window.location.reload();
        // Never resolves — the reload above takes over before this matters.
        return new Promise(() => {});
      }
      throw err;
    }
  });
}

// Landing is the one page kept as a normal, eager import — it's what a
// first-time visitor's browser has to download and render before anything
// else, so it belongs in the initial bundle rather than behind a lazy
// Suspense flash. Every other route is lazy-loaded below: each becomes its
// own chunk that only downloads when that route is actually visited,
// instead of every visitor paying for the whole app up front (this was the
// single biggest reason the Lighthouse Performance score was low — admin
// pages alone pull in recharts and jsQR, neither of which a public visitor
// browsing events needs to download at all).
import Landing from './pages/public/Landing';

const Events = lazyWithRetry(() => import('./pages/public/Events'));
const Discover = lazyWithRetry(() => import('./pages/public/Discover'));
const EventDetail = lazyWithRetry(() => import('./pages/public/EventDetail'));
const About = lazyWithRetry(() => import('./pages/public/About'));
const FAQ = lazyWithRetry(() => import('./pages/public/FAQ'));
const AuthPage = lazyWithRetry(() => import('./pages/public/AuthPage'));
const CheckinLanding = lazyWithRetry(() => import('./pages/public/CheckinLanding'));

const Dashboard = lazyWithRetry(() => import('./pages/attendee/Dashboard'));
const MyEvents = lazyWithRetry(() => import('./pages/attendee/MyEvents'));
const Profile = lazyWithRetry(() => import('./pages/attendee/Profile'));
const QrPass = lazyWithRetry(() => import('./pages/attendee/QrPass'));
const Settings = lazyWithRetry(() => import('./pages/shared/Settings'));

const AdminDashboard = lazyWithRetry(() => import('./pages/admin/AdminDashboard'));
const AdminEvents = lazyWithRetry(() => import('./pages/admin/AdminEvents'));
const AdminEventCreate = lazyWithRetry(() => import('./pages/admin/AdminEventCreate'));
const AdminEventDetail = lazyWithRetry(() => import('./pages/admin/AdminEventDetail'));
const AdminEventAttendees = lazyWithRetry(() => import('./pages/admin/AdminEventAttendees'));
const AdminScanner = lazyWithRetry(() => import('./pages/admin/AdminScanner'));
const AdminEventAnalytics = lazyWithRetry(() => import('./pages/admin/AdminEventAnalytics'));
const AdminReports = lazyWithRetry(() => import('./pages/admin/AdminReports'));
const AdminUsers = lazyWithRetry(() => import('./pages/admin/AdminUsers'));

const NotFound = lazyWithRetry(() => import('./pages/public/NotFound'));

const pageVariants = {
  initial: { opacity: 0, y: 18, scale: 0.99 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -12, scale: 0.99 },
};

// Contextual messages for the brief route-transition overlay — small touch,
// but "Preparing your pass…" reads a lot more intentional than a bare spinner.
function transitionMessages(pathname) {
  if (pathname.startsWith('/admin/events/') && pathname.endsWith('/scanner')) return ['Waking up the scanner…'];
  if (pathname.startsWith('/admin/events/') && pathname.endsWith('/analytics')) return ['Crunching the numbers…'];
  if (pathname.startsWith('/admin/users')) return ['Loading users…'];
  if (pathname.startsWith('/admin')) return ['Loading organizer console…', 'Syncing latest data…'];
  if (pathname.startsWith('/checkin/')) return ['Loading check-in code…'];
  if (pathname.startsWith('/qr-pass')) return ['Preparing your pass…', 'Generating your QR code…'];
  if (pathname.startsWith('/events/')) return ['Loading event details…'];
  if (pathname.startsWith('/events')) return ['Finding events…'];
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/my-events')) return ['Loading your events…'];
  if (pathname.startsWith('/profile')) return ['Loading your profile…'];
  return ['Just a moment…'];
}

function AnimatedRoutes() {
  const location = useLocation();
  const [transitioning, setTransitioning] = useState(false);
  const firstRender = useRef(true);

  useEffect(() => {
    // Skip the overlay on the very first page load — it's only meant to
    // decorate navigation *within* the app, not the initial visit.
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    setTransitioning(true);
    const timer = setTimeout(() => setTransitioning(false), 550);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  return (
    <>
      <AnimatePresence>
        {transitioning && <PresenceLoader compact messages={transitionMessages(location.pathname)} cycleMs={320} />}
      </AnimatePresence>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={location.pathname}
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          className="overflow-x-hidden"
        >
          <Routes location={location}>
            {/* Public */}
            <Route path="/" element={<Landing />} />
            <Route path="/events" element={<Suspense fallback={<PresenceLoader />}><Events /></Suspense>} />
            <Route path="/discover" element={<Suspense fallback={<PresenceLoader />}><Discover /></Suspense>} />
            <Route path="/events/:id" element={<Suspense fallback={<PresenceLoader />}><EventDetail /></Suspense>} />
            <Route path="/about" element={<Suspense fallback={<PresenceLoader />}><About /></Suspense>} />
            <Route path="/faq" element={<Suspense fallback={<PresenceLoader />}><FAQ /></Suspense>} />
            <Route path="/login" element={<Suspense fallback={<PresenceLoader />}><AuthPage mode="login" /></Suspense>} />
            <Route path="/register" element={<Suspense fallback={<PresenceLoader />}><AuthPage mode="register" /></Suspense>} />
            <Route path="/checkin/:token" element={<Suspense fallback={<PresenceLoader />}><CheckinLanding /></Suspense>} />

            {/* Attendee (protected) */}
            <Route path="/dashboard" element={<ProtectedRoute><Suspense fallback={<PresenceLoader />}><Dashboard /></Suspense></ProtectedRoute>} />
            <Route path="/my-events" element={<ProtectedRoute><Suspense fallback={<PresenceLoader />}><MyEvents /></Suspense></ProtectedRoute>} />
            <Route path="/my-events/:id" element={<ProtectedRoute><Suspense fallback={<PresenceLoader />}><MyEvents /></Suspense></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Suspense fallback={<PresenceLoader />}><Profile /></Suspense></ProtectedRoute>} />
            <Route path="/qr-pass/:id" element={<ProtectedRoute><Suspense fallback={<PresenceLoader />}><QrPass /></Suspense></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Suspense fallback={<PresenceLoader />}><Settings /></Suspense></ProtectedRoute>} />

            {/* Organizer / Admin (protected + role gated). Event-scoped
                pages (create/manage/attendees/scanner/analytics) also
                allow ATTENDEE — any signed-in user can self-serve-create
                a free event, Luma-style; ownership checks on the backend
                (isEventOwner in utils/authz.js) keep them scoped to only
                their own event. The console-wide pages (dashboard, full
                event list, cross-event reports, user management) stay
                ADMIN/ORGANIZER-only. */}
            <Route path="/admin" element={<ProtectedRoute roles={['ADMIN', 'ORGANIZER']}><Suspense fallback={<PresenceLoader />}><AdminDashboard /></Suspense></ProtectedRoute>} />
            <Route path="/admin/events" element={<ProtectedRoute roles={['ADMIN', 'ORGANIZER']}><Suspense fallback={<PresenceLoader />}><AdminEvents /></Suspense></ProtectedRoute>} />
            <Route path="/admin/events/create" element={<ProtectedRoute roles={['ADMIN', 'ORGANIZER', 'ATTENDEE']}><Suspense fallback={<PresenceLoader />}><AdminEventCreate /></Suspense></ProtectedRoute>} />
            <Route path="/admin/events/:id" element={<ProtectedRoute roles={['ADMIN', 'ORGANIZER', 'ATTENDEE']}><Suspense fallback={<PresenceLoader />}><AdminEventDetail /></Suspense></ProtectedRoute>} />
            <Route path="/admin/events/:id/attendees" element={<ProtectedRoute roles={['ADMIN', 'ORGANIZER', 'ATTENDEE']}><Suspense fallback={<PresenceLoader />}><AdminEventAttendees /></Suspense></ProtectedRoute>} />
            <Route path="/admin/events/:id/scanner" element={<ProtectedRoute roles={['ADMIN', 'ORGANIZER', 'ATTENDEE']}><Suspense fallback={<PresenceLoader />}><AdminScanner /></Suspense></ProtectedRoute>} />
            <Route path="/admin/events/:id/analytics" element={<ProtectedRoute roles={['ADMIN', 'ORGANIZER', 'ATTENDEE']}><Suspense fallback={<PresenceLoader />}><AdminEventAnalytics /></Suspense></ProtectedRoute>} />
            <Route path="/admin/reports" element={<ProtectedRoute roles={['ADMIN', 'ORGANIZER']}><Suspense fallback={<PresenceLoader />}><AdminReports /></Suspense></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute roles={['ADMIN']}><Suspense fallback={<PresenceLoader />}><AdminUsers /></Suspense></ProtectedRoute>} />

            <Route path="*" element={<Suspense fallback={<PresenceLoader />}><NotFound /></Suspense>} />
          </Routes>
        </motion.div>
      </AnimatePresence>
    </>
  );
}

export default function App() {
  useEffect(() => {
    // A page that renders at all means the currently-loaded chunks are
    // good — clear the reload guard so a genuinely new stale-chunk error
    // later (after the *next* deploy) is still allowed one auto-reload.
    try { sessionStorage.removeItem('presence_reloaded_for_chunk_error'); } catch { /* ignore */ }
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AccentProvider>
        <LanguageProvider>
          <AuthProvider>
            <ToastProvider>
              <BrowserRouter>
                <AnimatedRoutes />
                <WhatsAppFloat />
              </BrowserRouter>
            </ToastProvider>
          </AuthProvider>
        </LanguageProvider>
        </AccentProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
