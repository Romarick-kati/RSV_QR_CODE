export default function StatCard({ label, value, icon: Icon, accent = '#22D3A6', suffix = '' }) {
  return (
    <div className="rounded-2xl border p-5 flex flex-col gap-3" style={{ borderColor: 'var(--line-08)', background: 'var(--panel)' }}>
      <div className="flex items-center justify-between">
        <span className="text-[12px] uppercase tracking-wide text-[var(--text-dim)] font-semibold">{label}</span>
        {Icon && (
          <span className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${accent}1F` }}>
            <Icon size={16} style={{ color: accent }} />
          </span>
        )}
      </div>
      <span className="font-display text-3xl font-semibold text-[var(--text)]">
        {value}
        {suffix && <span className="text-lg text-[var(--text-dim)] ml-0.5">{suffix}</span>}
      </span>
    </div>
  );
}
