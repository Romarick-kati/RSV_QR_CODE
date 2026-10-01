import { getSmartEventPhoto } from '../../lib/eventPhoto';

// Single home for every place the Presence logo appears on event surfaces,
// so sizing/opacity live in one spot instead of being copied around.

// Small round logo tucked in the corner of an event photo.
export function LogoChip({ size = 24, className = 'bottom-2 left-2' }) {
  return (
    <img
      src="/icon-192.png"
      width={size}
      height={size}
      alt=""
      aria-hidden="true"
      className={`absolute rounded-full shadow-md pointer-events-none select-none ${className}`}
      style={{ width: size, height: size }}
    />
  );
}

// Large faint logo watermark with slowly turning rings, behind content
// (the QR pass and the live-location page). The parent must be `relative`.
export function LogoWatermark({ className = '' }) {
  return (
    <div className={`absolute inset-0 -z-10 flex items-center justify-center pointer-events-none overflow-hidden ${className}`} aria-hidden="true">
      <div className="relative w-[420px] h-[420px] shrink-0 max-w-full">
        <span className="orbit-ring border-2 border-dashed" style={{ borderColor: 'rgba(34,211,166,0.22)', '--orbit-speed': '40s' }} />
        <span className="orbit-ring rev border" style={{ inset: '44px', borderColor: 'rgba(139,124,246,0.28)', '--orbit-speed': '28s' }} />
        <span className="orbit-ring border-2 border-dotted" style={{ inset: '92px', borderColor: 'rgba(34,211,166,0.25)', '--orbit-speed': '18s' }} />
        <img src="/icon-512.png" alt="" className="absolute inset-[120px] w-[180px] h-[180px] opacity-[0.13]" />
      </div>
    </div>
  );
}

// Small square event photo with the logo on it, for list rows.
export function EventThumb({ event, size = 56 }) {
  return (
    <div className="relative shrink-0 rounded-xl overflow-hidden" style={{ width: size, height: size }}>
      <img src={getSmartEventPhoto(event, '200/200')} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover" />
      <LogoChip size={16} className="bottom-1 left-1" />
    </div>
  );
}
