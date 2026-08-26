export default function BrandMark({ size = 34, animated = false }) {
  return (
    <span
      className="inline-flex items-center justify-center rounded-xl shrink-0"
      style={{
        width: size,
        height: size,
        background: 'linear-gradient(135deg, rgba(245,166,35,0.16), rgba(34,211,166,0.16))',
        border: '1px solid var(--line-08)',
      }}
    >
      <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 40 40" fill="none">
        <circle cx="20" cy="20" r="16" stroke="#F5A623" strokeWidth="2" strokeDasharray="3 5" opacity="0.75" />
        <circle cx="20" cy="20" r="9" stroke="#22D3A6" strokeWidth="2" fill="none" />
        <circle cx="20" cy="20" r="3" fill="#22D3A6" className={animated ? 'reticle-pulse' : ''} />
      </svg>
    </span>
  );
}
