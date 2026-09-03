import { useEffect, useState, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, UserPlus, TriangleAlert, ScanLine, Sparkles, Camera, Mail, Lock, User, Plus, ImagePlus, Eye, EyeOff } from 'lucide-react';
import BrandMark from '../../components/ui/BrandMark';
import GoogleSignInButton from '../../components/ui/GoogleSignInButton';
import PresenceLoader from '../../components/ui/PresenceLoader';
import { useAuth } from '../../lib/AuthContext';
import { useToast } from '../../lib/ToastContext';
import { useLanguage } from '../../lib/LanguageContext';
import { useSEO } from '../../lib/useSEO';
import { compressImageFile, ImageError } from '../../lib/imageUtils';

export default function AuthPage({ mode = 'login' }) {
  const isLoginRoute = mode === 'login';
  const [flipped, setFlipped] = useState(isLoginRoute);
  const navigate = useNavigate();
  const { login, register, loginWithGoogle, updateAvatar, user } = useAuth();
  const { push } = useToast();
  const { t } = useLanguage();
  useSEO(isLoginRoute ? 'Sign in' : 'Create account', isLoginRoute ? 'Sign in to Presence to view your events, digital QR passes, and registration history.' : 'Create a free Presence account to RSVP to events and get an instant digital QR pass.');

  const [googleBusy, setGoogleBusy] = useState(false);
  const [googleError, setGoogleError] = useState('');

  // Post-authentication loading — shown for a short, fixed window after a
  // successful login/register/Google sign-in so the transition into the
  // dashboard feels intentional rather than an instant, jarring jump.
  const [postAuth, setPostAuth] = useState(null); // { dest, messages }

  useEffect(() => {
    if (!postAuth) return;
    const timer = setTimeout(() => navigate(postAuth.dest, { replace: true }), 1500);
    return () => clearTimeout(timer);
  }, [postAuth]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleGoogleCredential(credential) {
    setGoogleError('');
    setGoogleBusy(true);
    try {
      const { user: u } = await loginWithGoogle({ credential });
      push(`Welcome, ${u.name.split(' ')[0]}.`, 'success');
      // Always land on the main dashboard/console first after signing in —
      // never drop the person straight back into whatever page they came
      // from, so they get their bearings before navigating further.
      const dest = u.role === 'ADMIN' || u.role === 'ORGANIZER' ? '/admin' : '/dashboard';
      setPostAuth({ dest, messages: ['Verifying with Google…', 'Setting up your dashboard…', 'Almost there…'] });
    } catch (err) {
      setGoogleError(err.message);
      setGoogleBusy(false);
    }
  }

  useEffect(() => setFlipped(isLoginRoute), [isLoginRoute]);
  // Only redirect on mount if the visitor is already signed in and lands on
  // /login or /register directly — deliberately not reactive to `user`
  // changing from this page's own login/register flow below, which manages
  // its own timed transition via `postAuth` instead.
  useEffect(() => {
    if (user) navigate(user.role === 'ADMIN' || user.role === 'ORGANIZER' ? '/admin' : '/dashboard', { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goLogin = () => navigate('/login');
  const goRegister = () => navigate('/register');

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const [regForm, setRegForm] = useState({ name: '', email: '', password: '' });
  const [regError, setRegError] = useState('');
  const [regLoading, setRegLoading] = useState(false);
  const [regAvatarDataUrl, setRegAvatarDataUrl] = useState(null);
  const [regAvatarError, setRegAvatarError] = useState('');
  const [regAvatarMenuOpen, setRegAvatarMenuOpen] = useState(false);
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  async function handleRegAvatarPick(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setRegAvatarError('');
    try {
      const dataUrl = await compressImageFile(file, { maxDim: 320, quality: 0.85, square: true });
      setRegAvatarDataUrl(dataUrl);
    } catch (err) {
      setRegAvatarError(err instanceof ImageError ? err.message : 'Could not process that image.');
    }
  }

  async function handleLogin(e) {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    try {
      const { user: u } = await login(loginForm);
      push(`Welcome back, ${u.name.split(' ')[0]}.`, 'success');
      // Same reasoning as the Google sign-in path above — main page first.
      const dest = u.role === 'ADMIN' || u.role === 'ORGANIZER' ? '/admin' : '/dashboard';
      setPostAuth({ dest, messages: ['Verifying your credentials…', 'Setting up your dashboard…', 'Almost there…'] });
    } catch (err) {
      setLoginError(err.message);
      setLoginLoading(false);
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    setRegError('');
    if (regForm.password.length < 6) {
      setRegError('Password must be at least 6 characters.');
      return;
    }
    setRegLoading(true);
    try {
      const { user: u } = await register(regForm);
      if (regAvatarDataUrl) {
        // Best-effort — a failed avatar upload shouldn't block account
        // creation, which already succeeded at this point.
        await updateAvatar(regAvatarDataUrl).catch(() => {});
      }
      push(`Account created. Welcome, ${u.name.split(' ')[0]}.`, 'success');
      setPostAuth({ dest: '/dashboard', messages: ['Creating your account…', 'Generating your digital profile…', 'Almost there…'] });
    } catch (err) {
      setRegError(err.message);
      setRegLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 relative overflow-hidden" style={{ background: 'var(--bg)' }}>
      {/* ambient background, echoes the brand's scan-target motif */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 grain opacity-20" />
        <div className="absolute w-[420px] h-[420px] rounded-full blur-[90px] opacity-[0.14] -top-24 -left-24" style={{ background: '#22D3A6' }} />
        <div className="absolute w-[380px] h-[380px] rounded-full blur-[90px] opacity-[0.12] -bottom-24 -right-16" style={{ background: '#8B7CF6' }} />
        <div className="absolute w-[260px] h-[260px] rounded-full blur-[90px] opacity-[0.08] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ background: '#F5A623' }} />
      </div>

      <Link to="/" className="fixed top-6 left-6 z-20 flex items-center gap-2.5 opacity-0 animate-fadeUp" style={{ animationDelay: '80ms' }}>
        <BrandMark size={36} />
        <span className="font-display font-bold text-white">Presence</span>
      </Link>

      <div
        className="w-full max-w-[560px] relative z-10 opacity-0 animate-fadeUp"
        style={{ perspective: '1600px', animationDelay: '120ms' }}
      >
        <div className="relative">
          <div
            className="relative w-full grid transition-transform duration-[750ms]"
            style={{ transformStyle: 'preserve-3d', transform: flipped ? 'rotateY(0deg)' : 'rotateY(180deg)' }}
          >
            {/* ---- LOGIN FACE ----
                Both faces sit in the same grid cell (gridArea '1 / 1') so
                this grid row's height auto-sizes to whichever face is
                taller — instead of the old approach, where the register
                face was `position: absolute` and got clamped to the login
                face's (shorter) height, clipping its bottom content. */}
            <div
              className="w-full rounded-[22px] border shadow-2xl overflow-hidden flex flex-col sm:flex-row"
              style={{ gridArea: '1 / 1', backfaceVisibility: 'hidden', borderColor: 'var(--line-10)' }}
            >
              <InfoPanel
                icon={<ScanLine size={26} />}
                heading={<>Welcome<br />back.</>}
                copy="Sign in to view your registered events, reopen your QR pass, and check your attendance history."
                gradient="linear-gradient(150deg, #22D3A6 0%, #8B7CF6 100%)"
                onClick={goRegister}
                order="order-1 sm:order-1"
              />
              <div className="sm:w-[54%] order-2 sm:order-2 p-6 sm:p-9 flex flex-col justify-center min-w-0" style={{ background: 'var(--panel)' }}>
                <div className="sm:hidden flex items-center gap-2.5 mb-5 -mt-2">
                  <span className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(150deg,#22D3A6,#8B7CF6)' }}><ScanLine size={17} color="#0B0F22" /></span>
                  <span className="text-sm text-[var(--text-dim)]">Welcome back, sign in to continue.</span>
                </div>
                <h3 className="font-display text-2xl font-semibold mb-1">{t('auth_sign_in')}</h3>
                <p className="text-sm text-[var(--text-dim)] mb-6">{t('auth_sign_in_sub')}</p>

                {loginError && <FormError message={loginError} />}

                {googleError && <FormError message={googleError} />}
                <div className="mb-1">
                  <GoogleSignInButton onCredential={handleGoogleCredential} onError={setGoogleError} />
                </div>
                {googleBusy && <p className="text-center text-xs text-[var(--text-dim)] mt-2">Signing you in…</p>}

                <Divider />

                <form onSubmit={handleLogin} className="flex flex-col gap-4" noValidate>
                  <Field label={t('auth_email')} type="email" autoComplete="email" placeholder="you@university.edu" icon={Mail}
                    value={loginForm.email} onChange={(v) => setLoginForm((f) => ({ ...f, email: v }))} />
                  <Field label={t('auth_password')} type="password" autoComplete="current-password" placeholder="Enter your password" icon={Lock}
                    value={loginForm.password} onChange={(v) => setLoginForm((f) => ({ ...f, password: v }))} />
                  <SubmitButton loading={loginLoading} icon={<LogIn size={16} />} label="Sign in" />
                </form>

                <p className="text-center text-sm text-[var(--text-dim)] mt-5">
                  {t('auth_new_here')}{' '}
                  <button type="button" onClick={goRegister} className="font-semibold" style={{ color: '#22D3A6' }}>
                    {t('auth_create_link')}
                  </button>
                </p>
              </div>
            </div>

            {/* ---- REGISTER FACE ---- */}
            <div
              className="w-full rounded-[22px] border shadow-2xl overflow-hidden flex flex-col sm:flex-row"
              style={{ gridArea: '1 / 1', backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', borderColor: 'var(--line-10)' }}
            >
              <div className="sm:w-[54%] order-2 sm:order-1 p-6 sm:p-9 flex flex-col justify-center min-w-0" style={{ background: 'var(--panel)' }}>
                <div className="sm:hidden flex items-center gap-2.5 mb-5 -mt-2">
                  <span className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(150deg,#F5A623,#FF5C77)' }}><Sparkles size={17} color="#0B0F22" /></span>
                  <span className="text-sm text-[var(--text-dim)]">Join Presence to RSVP and get your pass.</span>
                </div>
                <h3 className="font-display text-2xl font-semibold mb-6">{t('auth_create_account')}</h3>

                {regError && <FormError message={regError} />}

                {googleError && <FormError message={googleError} />}
                <div className="mb-1">
                  <GoogleSignInButton onCredential={handleGoogleCredential} onError={setGoogleError} />
                </div>
                {googleBusy && <p className="text-center text-xs text-[var(--text-dim)] mt-2">Setting up your account…</p>}

                <Divider />

                <div className="relative mb-4 w-fit max-w-full">
                  {/* Bigger, filled (not just a thin dashed outline) circle
                      with a small camera badge overlapping its corner — the
                      same "tap here to add a photo" pattern used by most
                      apps, so it reads as an upload control at a glance
                      instead of a plain dashed circle that's easy to miss. */}
                  <button
                    type="button"
                    onClick={() => setRegAvatarMenuOpen((v) => !v)}
                    className="flex items-center gap-3 cursor-pointer group"
                  >
                    <span
                      className="relative w-14 h-14 rounded-full flex items-center justify-center shrink-0 overflow-hidden border-2 transition-colors group-hover:border-[#22D3A6]"
                      style={{ borderColor: 'var(--line-14)', background: regAvatarDataUrl ? 'transparent' : 'rgba(34,211,166,0.10)' }}
                    >
                      {regAvatarDataUrl ? (
                        <img src={regAvatarDataUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Camera size={20} style={{ color: '#22D3A6' }} />
                      )}
                      <span
                        className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center border-2"
                        style={{ background: '#22D3A6', borderColor: 'var(--panel)' }}
                      >
                        <Plus size={11} strokeWidth={3} color="#04140f" />
                      </span>
                    </span>
                    <span className="text-xs text-[var(--text-dim)] min-w-0 text-left">
                      {regAvatarDataUrl ? 'Photo selected — tap to change' : <>Tap to add a<br />profile photo (optional)</>}
                    </span>
                  </button>

                  {regAvatarMenuOpen && (
                    <>
                      {/* Backdrop to close the menu on outside tap */}
                      <div className="fixed inset-0 z-10" onClick={() => setRegAvatarMenuOpen(false)} />
                      <div
                        className="absolute z-20 top-full left-0 mt-2 w-48 rounded-xl border overflow-hidden shadow-lg"
                        style={{ borderColor: 'var(--line-12)', background: 'var(--panel)' }}
                      >
                        <button
                          type="button"
                          onClick={() => { setRegAvatarMenuOpen(false); cameraInputRef.current?.click(); }}
                          className="w-full flex items-center gap-2.5 px-4 py-3 text-xs font-medium text-left hover:bg-white/5"
                        >
                          <Camera size={15} style={{ color: '#22D3A6' }} /> Take photo
                        </button>
                        <button
                          type="button"
                          onClick={() => { setRegAvatarMenuOpen(false); galleryInputRef.current?.click(); }}
                          className="w-full flex items-center gap-2.5 px-4 py-3 text-xs font-medium text-left hover:bg-white/5 border-t"
                          style={{ borderColor: 'var(--line-08)' }}
                        >
                          <ImagePlus size={15} style={{ color: '#22D3A6' }} /> Choose from gallery
                        </button>
                      </div>
                    </>
                  )}

                  {/* Two hidden inputs: one forces the camera directly via
                      the `capture` attribute (supported on mobile browsers),
                      the other opens the normal photo library / file picker. */}
                  <input ref={cameraInputRef} type="file" accept="image/*" capture="user" className="hidden" onChange={handleRegAvatarPick} />
                  <input ref={galleryInputRef} type="file" accept="image/*" className="hidden" onChange={handleRegAvatarPick} />
                </div>
                {regAvatarError && <p className="text-xs mb-3" style={{ color: 'var(--danger-text)' }}>{regAvatarError}</p>}

                <form onSubmit={handleRegister} className="flex flex-col gap-4" noValidate>
                  <Field label={t('auth_full_name')} type="text" autoComplete="name" placeholder="Your name" icon={User}
                    value={regForm.name} onChange={(v) => setRegForm((f) => ({ ...f, name: v }))} />
                  <Field label={t('auth_email')} type="email" autoComplete="email" placeholder="you@university.edu" icon={Mail}
                    value={regForm.email} onChange={(v) => setRegForm((f) => ({ ...f, email: v }))} />
                  <Field label={t('auth_password')} type="password" autoComplete="new-password" placeholder="At least 6 characters" icon={Lock}
                    value={regForm.password} onChange={(v) => setRegForm((f) => ({ ...f, password: v }))} />
                  <SubmitButton loading={regLoading} icon={<UserPlus size={16} />} label="Create account" />
                </form>

                <p className="text-center text-sm text-[var(--text-dim)] mt-5">
                  {t('auth_have_account')}{' '}
                  <button type="button" onClick={goLogin} className="font-semibold" style={{ color: '#22D3A6' }}>
                    {t('auth_sign_in_link')}
                  </button>
                </p>
              </div>
              <InfoPanel
                icon={<Sparkles size={26} />}
                heading={<>Join<br />Presence</>}
                copy="Create an account to RSVP to events, generate your digital pass, and check in in seconds at the door."
                gradient="linear-gradient(150deg, #F5A623 0%, #FF5C77 100%)"
                onClick={goLogin}
                order="order-1 sm:order-2"
              />
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {postAuth && <PresenceLoader messages={postAuth.messages} cycleMs={520} />}
      </AnimatePresence>
    </div>
  );
}

function InfoPanel({ icon, heading, copy, gradient, onClick, order }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`hidden sm:flex sm:w-[46%] ${order} relative flex-col justify-center text-left p-8 overflow-hidden transition-transform hover:brightness-110`}
      style={{ background: gradient }}
    >
      <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 30% 20%, rgba(255,255,255,0.28), transparent 55%)' }} />
      <div className="relative z-10 text-[#0B0F22]">
        <span className="inline-flex mb-3.5 opacity-85">{icon}</span>
        <h2 className="font-display text-[1.7rem] font-extrabold leading-[1.15] mb-3">{heading}</h2>
        <p className="text-sm leading-relaxed" style={{ color: 'rgba(11,15,34,0.82)' }}>{copy}</p>
      </div>
    </button>
  );
}

function Field({ label, type, value, onChange, placeholder, autoComplete, icon: Icon }) {
  const [reveal, setReveal] = useState(false);
  const isPassword = type === 'password';
  return (
    <label className="block">
      <span className="block text-[11px] font-semibold uppercase tracking-wide text-[var(--text-dim)] mb-1.5">{label}</span>
      <span className="flex items-center gap-2.5 border-0 border-b-2 py-2 transition-colors" style={{ borderColor: 'var(--line-12)' }}>
        {Icon && <Icon size={16} className="text-[var(--text-dim)] shrink-0" />}
        <input
          type={isPassword && reveal ? 'text' : type}
          required
          autoComplete={autoComplete}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent border-0 py-0 text-[15px] text-[var(--text)] outline-none placeholder:text-white/30"
          onFocus={(e) => (e.target.parentElement.style.borderColor = '#22D3A6')}
          onBlur={(e) => (e.target.parentElement.style.borderColor = 'var(--line-12)')}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setReveal((v) => !v)}
            tabIndex={-1}
            className="shrink-0 text-[var(--text-dim)] hover:text-[var(--text)] transition-colors"
            aria-label={reveal ? 'Hide password' : 'Show password'}
          >
            {reveal ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </span>
    </label>
  );
}

function SubmitButton({ loading, icon, label }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full mt-1.5 py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-70"
      style={{ background: 'linear-gradient(135deg,#22D3A6,#8B7CF6)', color: '#0B0F22', boxShadow: '0 10px 26px -8px rgba(34,211,166,0.45)' }}
    >
      {loading ? (
        <span className="w-4 h-4 rounded-full border-2 border-[#0B0F22]/30 border-t-[#0B0F22] animate-spin" />
      ) : (
        <>{icon}{label}</>
      )}
    </button>
  );
}

function Divider() {
  const { t } = useLanguage();
  return (
    <div className="flex items-center gap-3 my-4">
      <span className="h-px flex-1" style={{ background: 'var(--line-10)' }} />
      <span className="text-[11px] uppercase tracking-wide text-[var(--text-dim)]">{t('auth_or')}</span>
      <span className="h-px flex-1" style={{ background: 'var(--line-10)' }} />
    </div>
  );
}

function FormError({ message }) {
  return (
    <div className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-[13px] mb-4" style={{ background: 'rgba(255,92,119,0.12)', border: '1px solid rgba(255,92,119,0.3)', color: 'var(--danger-text)' }}>
      <TriangleAlert size={15} className="shrink-0" /> {message}
    </div>
  );
}
