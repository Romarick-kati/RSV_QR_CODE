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

const Events = lazy(() => import('./pages/public/Events'));
const Discover = lazy(() => import('./pages/public/Discover'));
const EventDetail = lazy(() => import('./pages/public/EventDetail'));
const About = lazy(() => import('./pages/public/About'));
const FAQ = lazy(() => import('./pages/public/FAQ'));
const AuthPage = lazy(() => import('./pages/public/AuthPage'));
const CheckinLanding = lazy(() => import('./pages/public/CheckinLanding'));

const Dashboard = lazy(() => import('./pages/attendee/Dashboard'));
const MyEvents = lazy(() => import('./pages/attendee/MyEvents'));
const Profile = lazy(() => import('./pages/attendee/Profile'));
const QrPass = lazy(() => import('./pages/attendee/QrPass'));
const Settings = lazy(() => import('./pages/shared/Settings'));

const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminEvents = lazy(() => import('./pages/admin/AdminEvents'));
const AdminEventCreate = lazy(() => import('./pages/admin/AdminEventCreate'));
const AdminEventDetail = lazy(() => import('./pages/admin/AdminEventDetail'));
const AdminEventAttendees = lazy(() => import('./pages/admin/AdminEventAttendees'));
const AdminScanner = lazy(() => import('./pages/admin/AdminScanner'));
const AdminEventAnalytics = lazy(() => import('./pages/admin/AdminEventAnalytics'));
const AdminReports = lazy(() => import('./pages/admin/AdminReports'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));

const NotFound = lazy(() => import('./pages/public/NotFound'));

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

            {/* Organizer / Admin (protected + role gated) */}
            <Route path="/admin" element={<ProtectedRoute roles={['ADMIN', 'ORGANIZER']}><Suspense fallback={<PresenceLoader />}><AdminDashboard /></Suspense></ProtectedRoute>} />
            <Route path="/admin/events" element={<ProtectedRoute roles={['ADMIN', 'ORGANIZER']}><Suspense fallback={<PresenceLoader />}><AdminEvents /></Suspense></ProtectedRoute>} />
            <Route path="/admin/events/create" element={<ProtectedRoute roles={['ADMIN', 'ORGANIZER']}><Suspense fallback={<PresenceLoader />}><AdminEventCreate /></Suspense></ProtectedRoute>} />
            <Route path="/admin/events/:id" element={<ProtectedRoute roles={['ADMIN', 'ORGANIZER']}><Suspense fallback={<PresenceLoader />}><AdminEventDetail /></Suspense></ProtectedRoute>} />
            <Route path="/admin/events/:id/attendees" element={<ProtectedRoute roles={['ADMIN', 'ORGANIZER']}><Suspense fallback={<PresenceLoader />}><AdminEventAttendees /></Suspense></ProtectedRoute>} />
            <Route path="/admin/events/:id/scanner" element={<ProtectedRoute roles={['ADMIN', 'ORGANIZER']}><Suspense fallback={<PresenceLoader />}><AdminScanner /></Suspense></ProtectedRoute>} />
            <Route path="/admin/events/:id/analytics" element={<ProtectedRoute roles={['ADMIN', 'ORGANIZER']}><Suspense fallback={<PresenceLoader />}><AdminEventAnalytics /></Suspense></ProtectedRoute>} />
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
  return (
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
  );
}
