export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6 rounded-2xl border border-dashed" style={{ borderColor: 'var(--line-12)' }}>
      {Icon && (
        <span className="w-12 h-12 rounded-full flex items-center justify-center mb-4" style={{ background: 'var(--line-05)' }}>
          <Icon size={22} className="text-[var(--text-dim)]" />
        </span>
      )}
      <h3 className="font-display text-lg font-semibold text-[var(--text)] mb-1.5">{title}</h3>
      {description && <p className="text-sm text-[var(--text-dim)] max-w-sm mb-5">{description}</p>}
      {action}
    </div>
  );
}
