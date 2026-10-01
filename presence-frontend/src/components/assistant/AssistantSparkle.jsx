// A hand-drawn sparkle (not lucide's) so the gradient fill/stroke can be
// fully controlled: one large 4-point star plus two small accent marks,
// same silhouette family as most "AI" glyphs (Gemini, Copilot) but on
// Presence's own teal→violet accent pair instead of a generic rainbow.
//
// The shimmer is done by rotating the gradient itself (via SMIL
// animateTransform on gradientTransform), not the icon shape — so the star
// stays perfectly still and only the light sweeping across it moves. Speed
// doubles while `active` (the assistant is thinking), so the motion means
// something instead of just decorating. Respects prefers-reduced-motion
// globally (see index.css) by falling back to a static gradient.
import { useId } from 'react';

export default function AssistantSparkle({ size = 18, active = false, className = '' }) {
  // Gradient ids must be unique per instance (the nav button and the panel
  // header can both be mounted at once) or they'd fight over the same
  // <defs> — useId gives a stable, collision-free id without minting a new
  // one on every render. React's useId() includes colons (e.g. ":r0:"),
  // which are legal in an HTML id but unreliable inside a CSS url(#...)
  // reference in some browsers, so strip them.
  const gradientId = `asst-sparkle-${useId().replace(/:/g, '')}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradientId} gradientUnits="userSpaceOnUse" x1="2" y1="2" x2="22" y2="22">
          <stop offset="0%" stopColor="var(--accent)" />
          <stop offset="100%" stopColor="var(--accent-2)" />
          <animateTransform
            attributeName="gradientTransform"
            type="rotate"
            from="0 12 12"
            to="360 12 12"
            dur={active ? '1.6s' : '5s'}
            repeatCount="indefinite"
          />
        </linearGradient>
      </defs>
      <path
        d="M9.94 15.5a2 2 0 0 0-1.44-1.44l-6.13-1.58a.5.5 0 0 1 0-.96l6.13-1.58A2 2 0 0 0 9.94 8.5l1.58-6.13a.5.5 0 0 1 .96 0L14.06 8.5a2 2 0 0 0 1.44 1.44l6.13 1.58a.5.5 0 0 1 0 .96l-6.13 1.58a2 2 0 0 0-1.44 1.44l-1.58 6.13a.5.5 0 0 1-.96 0z"
        fill={`url(#${gradientId})`}
      />
      <path d="M19 3v3.5M20.75 4.75H17.25" stroke={`url(#${gradientId})`} strokeWidth="1.4" strokeLinecap="round" />
      <path d="M4.5 17v2.4M5.7 18.2H3.3" stroke={`url(#${gradientId})`} strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
