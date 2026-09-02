import { useId } from 'react';

// The logo: a single circular gradient badge with a soft glossy highlight,
// a thin inner ring, and a bold checkmark — "scanned and confirmed", the
// app's core action. Fully self-contained in the SVG (background included,
// not a separate div behind it) so the exact same markup can be reused
// as-is for the favicon and rasterized for the home-screen/social-share
// icons, guaranteeing they all match.
export default function BrandMark({ size = 34, animated = false }) {
  // Two instances of this component often render on the same page (nav +
  // footer). SVG <defs> ids are global to the document, so two hard-coded
  // ids would collide silently and one instance's gradient could bleed
  // into the other's. useId() keeps each instance's gradients unique.
  const uid = useId();
  const gradId = `pbrand-${uid}`;
  const glossId = `pgloss-${uid}`;

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full shrink-0 ${animated ? 'reticle-pulse' : ''}`}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
        <defs>
          <linearGradient id={gradId} x1="4" y1="4" x2="36" y2="36" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="var(--accent)" />
            <stop offset="1" stopColor="var(--accent-2)" />
          </linearGradient>
          <radialGradient id={glossId} cx="34%" cy="26%" r="55%">
            <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.55" />
            <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="20" cy="20" r="19" fill={`url(#${gradId})`} />
        <circle cx="20" cy="20" r="19" fill={`url(#${glossId})`} />
        <circle cx="20" cy="20" r="14.5" stroke="#FFFFFF" strokeOpacity="0.32" strokeWidth="1" fill="none" />
        <path d="M13 20.5L17.5 25L28 12.5" stroke="#04140F" strokeWidth="4.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    </span>
  );
}
