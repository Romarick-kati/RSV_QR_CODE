import { useEffect, useRef, useState } from 'react';
import { Navigate, useParams, Link } from 'react-router-dom';
import jsQR from 'jsqr';
import { Camera, CameraOff, ArrowLeft, CheckCircle2, XCircle, AlertTriangle, KeyRound, WifiOff, RefreshCw } from 'lucide-react';
import AdminShell from '../../components/layout/AdminShell';
import { useSEO } from '../../lib/useSEO';
import { eventsApi, attendanceApi } from '../../lib/api';
import { formatDateTime } from '../../lib/utils';
import { extractCheckinToken } from '../../lib/checkinUrl';
import { playScanSound } from '../../lib/scanSound';
import { enqueueScan, listQueuedScans, removeQueuedScan } from '../../lib/offlineScanQueue';
import { useToast } from '../../lib/ToastContext';

export default function AdminScanner() {
  useSEO('QR Scanner', undefined, { noindex: true });
  const { id } = useParams();
  const { push } = useToast();
  const videoRef = useRef(null);
  const canvasRef = useRef(document.createElement('canvas'));
  const streamRef = useRef(null);
  const rafRef = useRef(null);
  const lockRef = useRef(false);

  const [event, setEvent] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [stats, setStats] = useState(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [result, setResult] = useState(null);
  const [manualToken, setManualToken] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [queuedCount, setQueuedCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [flash, setFlash] = useState(null); // 'success' | 'duplicate' | 'invalid' | null — brief full-frame color flash

  useEffect(() => {
    eventsApi.get(id).then(({ event }) => setEvent(event)).catch(() => setNotFound(true));
    refreshStats();
    refreshQueueCount();
    window.addEventListener('online', syncQueue);
    // Poll so the live count here stays correct even when a second device
    // is checking people in at the same door — not just this one's scans.
    const interval = setInterval(refreshStats, 3000);
    return () => { stopCamera(); window.removeEventListener('online', syncQueue); clearInterval(interval); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function refreshQueueCount() {
    setQueuedCount(listQueuedScans(id).length);
  }

  // Replays every locally-queued scan for this event against the real
  // check-in endpoint. Runs automatically when the browser regains a
  // connection, and can also be triggered manually via the banner button.
  async function syncQueue() {
    const queued = listQueuedScans(id);
    if (queued.length === 0) return;
    setSyncing(true);
    let synced = 0;
    for (const item of queued) {
      try {
        await attendanceApi.checkIn(item.token);
        removeQueuedScan(item.id);
        synced += 1;
      } catch (err) {
        if (err.status === 0) break; // still offline — stop and try again later
        removeQueuedScan(item.id); // a real rejection (already used, invalid, etc.) — drop it, retrying won't help
      }
    }
    setSyncing(false);
    refreshQueueCount();
    refreshStats();
    if (synced > 0) push(`${synced} offline scan${synced === 1 ? '' : 's'} synced.`, 'success');
  }

  function refreshStats() {
    eventsApi.statistics(id).then(setStats).catch(() => {});
  }

  if (notFound) return <Navigate to="/admin/events" replace />;

  async function startCamera() {
    setCameraError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraOn(true);
      rafRef.current = requestAnimationFrame(tick);
    } catch {
      setCameraError('Could not access the camera. Check browser permissions, or use manual entry below.');
    }
  }

  function stopCamera() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraOn(false);
  }

  function tick() {
    const video = videoRef.current;
    if (video && video.readyState === video.HAVE_ENOUGH_DATA) {
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);
      if (code && code.data && !lockRef.current) {
        handleScan(code.data);
      }
    }
    rafRef.current = requestAnimationFrame(tick);
  }

  // `raw` is whatever the camera or manual-entry field picked up — either a
  // full https://…/checkin/<token> URL (a real Presence pass) or a bare
  // token (manual entry, or an older pass). Normalize before sending.
  async function handleScan(raw) {
    const token = extractCheckinToken(raw);
    lockRef.current = true;
    setVerifying(true);
    try {
      const outcome = await attendanceApi.checkIn(token);
      setResult(outcome);
      playScanSound(outcome.result);
      triggerFlash(outcome.result);
      if (outcome.result === 'success') refreshStats();
    } catch (err) {
      if (err.status === 0) {
        // No connection right now — queue it instead of turning away a
        // legitimate attendee. It'll be verified for real once synced.
        enqueueScan({ eventId: id, token });
        refreshQueueCount();
        setResult({ result: 'queued', message: 'No connection — scan saved and will be verified once you\'re back online.' });
        playScanSound('duplicate');
        triggerFlash('duplicate');
      } else {
        setResult({ result: 'invalid', message: err.message || 'Invalid or expired QR code.' });
        playScanSound('invalid');
        triggerFlash('invalid');
      }
    } finally {
      setVerifying(false);
      setTimeout(() => { lockRef.current = false; }, 2500);
    }
  }

  function triggerFlash(kind) {
    setFlash(kind);
    setTimeout(() => setFlash(null), 550);
  }

  function handleManualSubmit(e) {
    e.preventDefault();
    if (!manualToken.trim()) return;
    handleScan(manualToken.trim());
    setManualToken('');
  }

  const flashColor = { success: '#22D3A6', duplicate: '#F5A623', invalid: '#FF5C77' }[flash];

  return (
    <AdminShell
      title="QR scanner"
      subtitle={event?.title || 'Loading…'}
      actions={<Link to={`/admin/events/${id}`} className="flex items-center gap-1.5 text-sm font-medium text-[var(--text-dim)] hover:text-[var(--text)]"><ArrowLeft size={15} /> Event</Link>}
    >
      {flash && (
        <div
          className="fixed inset-0 z-[100] pointer-events-none transition-opacity duration-500"
          style={{ background: flashColor, opacity: 0.28, animation: 'scanFlashFade 0.55s ease-out' }}
        />
      )}
      <div className="grid lg:grid-cols-[1fr_340px] gap-6">
        <div>
          {queuedCount > 0 && (
            <div className="flex items-center justify-between gap-3 rounded-xl border px-4 py-3 mb-4" style={{ borderColor: 'rgba(139,124,246,0.35)', background: 'rgba(139,124,246,0.08)' }}>
              <p className="text-xs font-medium flex items-center gap-2" style={{ color: '#8B7CF6' }}>
                <WifiOff size={14} /> {queuedCount} scan{queuedCount === 1 ? '' : 's'} saved offline — not yet verified.
              </p>
              <button onClick={syncQueue} disabled={syncing} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg disabled:opacity-60" style={{ background: 'rgba(139,124,246,0.16)', color: '#8B7CF6' }}>
                <RefreshCw size={12} className={syncing ? 'animate-spin' : ''} /> {syncing ? 'Syncing…' : 'Try syncing now'}
              </button>
            </div>
          )}
          <div className="relative rounded-2xl overflow-hidden border aspect-[4/3] sm:aspect-video flex items-center justify-center" style={{ borderColor: 'var(--line-10)', background: '#05070d' }}>
            <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" muted playsInline style={{ display: cameraOn ? 'block' : 'none' }} />
            {!cameraOn && (
              <div className="flex flex-col items-center gap-4 text-center px-6">
                <span className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: 'var(--line-06)' }}>
                  <Camera size={24} className="text-[var(--text-dim)]" />
                </span>
                <p className="text-sm text-[var(--text-dim)] max-w-xs">Start the camera to scan attendee QR codes at the door.</p>
                <button onClick={startCamera} className="flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-xl" style={{ background: 'linear-gradient(135deg,#22D3A6,#8B7CF6)', color: '#04140f' }}>
                  <Camera size={16} /> Start scanner
                </button>
                {cameraError && <p className="text-xs text-[var(--danger-text)] max-w-xs">{cameraError}</p>}
              </div>
            )}
            {cameraOn && (
              <>
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-56 h-56 sm:w-64 sm:h-64 rounded-2xl border-2 reticle-pulse" style={{ borderColor: '#22D3A6' }} />
                </div>
                <button onClick={stopCamera} className="absolute top-4 right-4 flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg" style={{ background: 'rgba(0,0,0,0.5)', color: '#fff' }}>
                  <CameraOff size={14} /> Stop
                </button>
              </>
            )}
          </div>

          <div className="mt-5 min-h-[132px]">
            {verifying && !result ? (
              <div className="rounded-2xl border p-6 text-center text-sm text-[var(--text-dim)] flex items-center justify-center gap-2" style={{ borderColor: 'var(--line-08)', background: 'var(--panel)' }}>
                <span className="w-4 h-4 rounded-full border-2 border-white/10 border-t-[#22D3A6] animate-spin" /> Verifying…
              </div>
            ) : result ? (
              <ResultCard outcome={result} />
            ) : (
              <div className="rounded-2xl border p-6 text-center text-sm text-[var(--text-dim)]" style={{ borderColor: 'var(--line-08)', background: 'var(--panel)' }}>
                Scan results will appear here.
              </div>
            )}
          </div>

          <form onSubmit={handleManualSubmit} className="mt-5 rounded-2xl border p-5" style={{ borderColor: 'var(--line-08)', background: 'var(--panel)' }}>
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-dim)] mb-3 flex items-center gap-1.5"><KeyRound size={13} /> Manual token entry (backup, if a camera isn't available)</p>
            <div className="flex gap-2">
              <input value={manualToken} onChange={(e) => setManualToken(e.target.value)} placeholder="Paste attendance token…" className="flex-1 rounded-lg border px-3 py-2.5 text-sm text-[var(--text)] outline-none font-mono" style={{ borderColor: 'var(--line-10)', background: 'var(--bg)' }} />
              <button className="px-4 py-2.5 rounded-lg text-sm font-semibold" style={{ background: 'rgba(34,211,166,0.14)', color: '#22D3A6' }}>Verify</button>
            </div>
          </form>
        </div>

        <div className="rounded-2xl border p-6 h-fit" style={{ borderColor: 'var(--line-08)', background: 'var(--panel)' }}>
          <h3 className="font-display text-base font-semibold mb-4">Live count</h3>
          {stats ? (
            <>
              <div className="flex items-end gap-2 mb-1">
                <span className="font-display text-4xl font-semibold">{stats.checkedIn}</span>
                <span className="text-sm text-[var(--text-dim)] mb-1.5">/ {stats.registered} registered</span>
              </div>
              <div className="h-1.5 rounded-full mt-3 mb-6" style={{ background: 'var(--line-08)' }}>
                <div className="h-full rounded-full" style={{ width: `${stats.registered ? (stats.checkedIn / stats.registered) * 100 : 0}%`, background: '#22D3A6' }} />
              </div>
            </>
          ) : (
            <div className="h-16 rounded-xl skeleton mb-6" />
          )}
          <h4 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-dim)] mb-2">How it works</h4>
          <ol className="text-sm text-[var(--text-dim)] leading-relaxed list-decimal list-inside flex flex-col gap-1.5">
            <li>Camera detects the QR code on the attendee's pass.</li>
            <li>The token is checked against this event's registrations — and that it's within the check-in window.</li>
            <li>A valid, unused token records the check-in instantly and shows their photo — compare it to the person in front of you.</li>
            <li>A reused token is flagged as already checked in.</li>
          </ol>
        </div>
      </div>
    </AdminShell>
  );
}

function ResultCard({ outcome }) {
  const map = {
    success: { icon: CheckCircle2, color: '#22D3A6', bg: 'rgba(34,211,166,0.1)', title: 'Attendance confirmed' },
    duplicate: { icon: AlertTriangle, color: '#F5A623', bg: 'rgba(245,166,35,0.1)', title: 'Already checked in' },
    invalid: { icon: XCircle, color: '#FF5C77', bg: 'rgba(255,92,119,0.1)', title: 'Invalid QR code' },
    queued: { icon: WifiOff, color: '#8B7CF6', bg: 'rgba(139,124,246,0.1)', title: 'Saved offline' },
  };
  const cfg = map[outcome.result] || map.invalid;
  const Icon = cfg.icon;
  const initials = outcome.attendee?.name?.split(' ').map((n) => n[0]).slice(0, 2).join('') || '';
  return (
    <div className="rounded-2xl border p-6 flex items-start gap-4" style={{ borderColor: `${cfg.color}44`, background: cfg.bg }}>
      {outcome.attendee ? (
        <span className="w-14 h-14 rounded-full flex items-center justify-center text-base font-bold overflow-hidden shrink-0" style={{ background: 'linear-gradient(135deg,#22D3A6,#8B7CF6)', color: '#04140f' }}>
          {outcome.attendee.avatarUrl ? (
            <img src={outcome.attendee.avatarUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          ) : initials}
        </span>
      ) : (
        <Icon size={28} style={{ color: cfg.color }} className="shrink-0 mt-0.5" />
      )}
      <div>
        <div className="flex items-center gap-1.5 mb-1">
          <Icon size={15} style={{ color: cfg.color }} />
          <h3 className="font-display text-base font-semibold" style={{ color: cfg.color }}>{cfg.title}</h3>
        </div>
        {outcome.attendee ? (
          <>
            <p className="text-sm text-[var(--text)] font-medium">{outcome.attendee.name}</p>
            <p className="text-xs text-[var(--text-dim)] mt-0.5">{outcome.event?.title}</p>
            {outcome.attendance?.checkedInAt && (
              <p className="text-xs text-[var(--text-dim)] mt-0.5">
                {outcome.result === 'duplicate' ? 'Originally checked in ' : 'Checked in '}{formatDateTime(outcome.attendance.checkedInAt)}
              </p>
            )}
            {!outcome.attendee.avatarUrl && (
              <p className="text-[11px] mt-1.5" style={{ color: cfg.color }}>No photo on file — verify ID manually.</p>
            )}
          </>
        ) : (
          <p className="text-sm text-[var(--text-dim)]">{outcome.message}</p>
        )}
      </div>
    </div>
  );
}
