import { useState } from 'react';

// Fixed, always-on-top WhatsApp contact bubble. Lives once at the App root
// (see App.jsx) so it follows the visitor across every public, attendee,
// and admin page — not re-mounted per route.
const CONTACT_PHONE = '+237683794633';
const DEFAULT_MESSAGE = "Hi! I'd like to know more about Presence.";

export default function WhatsAppFloat() {
  const [hovered, setHovered] = useState(false);
  const href = `https://wa.me/${CONTACT_PHONE.replace('+', '')}?text=${encodeURIComponent(DEFAULT_MESSAGE)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      aria-label="Chat with us on WhatsApp"
      className="fixed z-[60] bottom-5 right-5 sm:bottom-6 sm:right-6 flex items-center gap-2.5 rounded-full shadow-2xl transition-all duration-300"
      style={{
        background: '#25D366',
        padding: hovered ? '12px 18px 12px 14px' : '14px',
        boxShadow: '0 8px 24px -6px rgba(37,211,102,0.6)',
      }}
    >
      <span className="relative flex items-center justify-center shrink-0" style={{ width: 26, height: 26 }}>
        {/* continuous pulse ring */}
        <span
          className="absolute inset-0 rounded-full animate-ping"
          style={{ background: 'rgba(255,255,255,0.55)', animationDuration: '1.8s' }}
        />
        <WhatsAppIcon />
      </span>
      <span
        className="text-white text-sm font-semibold whitespace-nowrap overflow-hidden transition-all duration-300"
        style={{ maxWidth: hovered ? 160 : 0, opacity: hovered ? 1 : 0 }}
      >
        Chat with us
      </span>
    </a>
  );
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 32 32" width="24" height="24" fill="#fff" className="relative z-10">
      <path d="M16.004 3C9.377 3 4 8.373 4 15c0 2.31.657 4.47 1.797 6.31L4 29l7.86-1.76A11.93 11.93 0 0 0 16.004 27C22.63 27 28 21.627 28 15S22.63 3 16.004 3Zm0 21.7c-1.98 0-3.83-.55-5.41-1.5l-.39-.23-4.66 1.04 1.02-4.55-.25-.4A9.63 9.63 0 0 1 6.3 15c0-5.36 4.35-9.7 9.7-9.7 5.36 0 9.7 4.34 9.7 9.7 0 5.35-4.34 9.7-9.7 9.7Zm5.34-7.27c-.29-.15-1.72-.85-1.99-.95-.27-.1-.46-.15-.66.15-.2.29-.75.94-.92 1.14-.17.2-.34.22-.63.07-.29-.15-1.22-.45-2.32-1.44-.86-.76-1.44-1.71-1.61-2-.17-.29-.02-.45.13-.6.13-.13.29-.34.44-.51.15-.17.2-.29.29-.49.1-.2.05-.37-.02-.51-.07-.15-.66-1.6-.91-2.19-.24-.58-.48-.5-.66-.51h-.56c-.2 0-.51.07-.78.37-.27.29-1.02 1-1.02 2.44s1.05 2.83 1.19 3.03c.15.2 2.07 3.16 5.02 4.43.7.3 1.25.48 1.68.62.7.22 1.34.19 1.85.12.56-.08 1.72-.7 1.96-1.38.24-.68.24-1.26.17-1.38-.07-.12-.26-.2-.55-.34Z" />
    </svg>
  );
}
