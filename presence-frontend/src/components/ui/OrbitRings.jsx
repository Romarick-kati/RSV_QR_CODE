// Thin rings that slowly circle whatever is inside, each carrying a small
// glowing dot, like the arcs orbiting the phone on other landing pages.
export default function OrbitRings({ children, className = '' }) {
  const rings = [
    { inset: '-7%', speed: '30s', rev: false, dot: 'var(--accent)' },
    { inset: '-17%', speed: '46s', rev: true, dot: 'var(--accent-2)' },
    { inset: '-28%', speed: '64s', rev: false, dot: 'var(--accent)' },
  ];
  return (
    <div className={`relative ${className}`}>
      {rings.map((r, i) => (
        <div key={i} className="absolute pointer-events-none" style={{ inset: r.inset }} aria-hidden="true">
          <div className={`orbit-ring border ${r.rev ? 'rev' : ''}`} style={{ '--orbit-speed': r.speed, borderColor: 'var(--line-10)' }}>
            <span className="absolute left-1/2 -top-1 w-2 h-2 rounded-full -translate-x-1/2" style={{ background: r.dot, boxShadow: `0 0 12px 2px ${r.dot}` }} />
          </div>
        </div>
      ))}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
