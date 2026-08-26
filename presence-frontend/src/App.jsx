import { useEffect, useRef, useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AuthProvider } from './lib/AuthContext';
import { ToastProvider } from './lib/ToastContext';
import { ThemeProvider } from './lib/ThemeContext';
import { LanguageProvider } from './lib/LanguageContext';
import ProtectedRoute from './routes/ProtectedRoute';
import PresenceLoader from './components/ui/PresenceLoader';

import Landing from './pages/public/Landing';
import Events from './pages/public/Events';
import EventDetail from './pages/public/EventDetail';
import About from './pages/public/About';
import FAQ from './pages/public/FAQ';
import AuthPage from './pages/public/AuthPage';

import Dashboard from './pages/attendee/Dashboard';
import MyEvents from './pages/attendee/MyEvents';
import Profile from './pages/attendee/Profile';
import QrPass from './pages/attendee/QrPass';

import AdminDashboard from './pages/admin/AdminDashboard';
import AdminEvents from './pages/admin/AdminEvents';
import AdminEventCreate from './pages/admin/AdminEventCreate';
import AdminEventDetail from './pages/admin/AdminEventDetail';
import AdminEventAttendees from './pages/admin/AdminEventAttendees';
import AdminScanner from './pages/admin/AdminScanner';
import AdminEventAnalytics from './pages/admin/AdminEventAnalytics';
import AdminReports from './pages/admin/AdminReports';

import NotFound from './pages/public/NotFound';

const pageVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
};

// Contextual messages for the brief route-transition overlay — small touch,
// but "Preparing your pass…" reads a lot more intentional than a bare spinner.
function transitionMessages(pathname) {
  if (pathname.startsWith('/admin/events/') && pathname.endsWith('/scanner')) return ['Waking up the scanner…'];
  if (pathname.startsWith('/admin/events/') && pathname.endsWith('/analytics')) return ['Crunching the numbers…'];
  if (pathname.startsWith('/admin')) return ['Loading organizer console…', 'Syncing latest data…'];
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
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="overflow-x-hidden"
        >
          <Routes location={location}>
            {/* Public */}
            <Route path="/" element={<Landing />} />
            <Route path="/events" element={<Events />} />
            <Route path="/events/:id" element={<EventDetail />} />
            <Route path="/about" element={<About />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/login" element={<AuthPage mode="login" />} />
            <Route path="/register" element={<AuthPage mode="register" />} />

            {/* Attendee (protected) */}
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/my-events" element={<ProtectedRoute><MyEvents /></ProtectedRoute>} />
            <Route path="/my-events/:id" element={<ProtectedRoute><MyEvents /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/qr-pass/:id" element={<ProtectedRoute><QrPass /></ProtectedRoute>} />

            {/* Organizer / Admin (protected + role gated) */}
            <Route path="/admin" element={<ProtectedRoute roles={['ADMIN', 'ORGANIZER']}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/events" element={<ProtectedRoute roles={['ADMIN', 'ORGANIZER']}><AdminEvents /></ProtectedRoute>} />
            <Route path="/admin/events/create" element={<ProtectedRoute roles={['ADMIN', 'ORGANIZER']}><AdminEventCreate /></ProtectedRoute>} />
            <Route path="/admin/events/:id" element={<ProtectedRoute roles={['ADMIN', 'ORGANIZER']}><AdminEventDetail /></ProtectedRoute>} />
            <Route path="/admin/events/:id/attendees" element={<ProtectedRoute roles={['ADMIN', 'ORGANIZER']}><AdminEventAttendees /></ProtectedRoute>} />
            <Route path="/admin/events/:id/scanner" element={<ProtectedRoute roles={['ADMIN', 'ORGANIZER']}><AdminScanner /></ProtectedRoute>} />
            <Route path="/admin/events/:id/analytics" element={<ProtectedRoute roles={['ADMIN', 'ORGANIZER']}><AdminEventAnalytics /></ProtectedRoute>} />
            <Route path="/admin/reports" element={<ProtectedRoute roles={['ADMIN', 'ORGANIZER']}><AdminReports /></ProtectedRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </motion.div>
      </AnimatePresence>
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <ToastProvider>
            <BrowserRouter>
              <AnimatedRoutes />
            </BrowserRouter>
          </ToastProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
