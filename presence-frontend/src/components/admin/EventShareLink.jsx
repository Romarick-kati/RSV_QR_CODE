import { useState } from 'react';
import { Link2, Copy, Check, ExternalLink } from 'lucide-react';

// Every event gets a public link the moment it's created — this just makes
// that link impossible to miss and one click to copy. Sharing it is fully
// optional: nothing on this card forces the organizer to distribute it, and
// an unpublished/unshared event simply never gets visited.
export default function EventShareLink({ eventId }) {
  const [copied, setCopied] = useState(false);
  const url = `${window.location.origin}/events/${eventId}`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Clipboard API unavailable (older browser / non-HTTPS) — fall back
      // to a manual select so the person can still copy it themselves.
      const input = document.getElementById(`event-link-${eventId}`);
      input?.select();
      document.execCommand?.('copy');
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div
      className="rounded-2xl border p-5 mb-6 flex flex-col sm:flex-row sm:items-center gap-3.5"
      style={{ borderColor: 'rgba(34,211,166,0.35)', background: 'rgba(34,211,166,0.06)' }}
    >
      <span className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(34,211,166,0.16)' }}>
        <Link2 size={18} style={{ color: '#22D3A6' }} />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[var(--text)] mb-1">Your event's shareable link</p>
        <p className="text-xs text-[var(--text-dim)] mb-2.5">Copy this and send it to attendees — WhatsApp, email, flyers, anywhere. Sharing is entirely up to you.</p>
        <div className="flex gap-2">
          <input
            id={`event-link-${eventId}`}
            readOnly
            value={url}
            onFocus={(e) => e.target.select()}
            className="flex-1 min-w-0 rounded-lg border px-3 py-2 text-xs font-mono text-[var(--text-dim)] outline-none truncate"
            style={{ borderColor: 'var(--line-10)', background: 'var(--bg)' }}
          />
          <button
            onClick={copyLink}
            className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-lg shrink-0 transition-colors"
            style={copied ? { background: 'rgba(34,211,166,0.2)', color: '#22D3A6' } : { background: '#22D3A6', color: '#04140f' }}
          >
            {copied ? <><Check size={13} /> Copied</> : <><Copy size={13} /> Copy link</>}
          </button>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center px-3 py-2 rounded-lg border shrink-0"
            style={{ borderColor: 'var(--line-12)', color: 'var(--text-dim)' }}
            title="Open public page"
          >
            <ExternalLink size={14} />
          </a>
        </div>
      </div>
    </div>
  );
}
