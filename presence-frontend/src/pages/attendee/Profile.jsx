import { useEffect, useState } from 'react';
import { User, Mail, Shield } from 'lucide-react';
import AttendeeShell from '../../components/layout/AttendeeShell';
import { useAuth } from '../../lib/AuthContext';
import { useToast } from '../../lib/ToastContext';
import { useLanguage } from '../../lib/LanguageContext';
import { meApi } from '../../lib/api';

export default function Profile() {
  const { user, updateProfile } = useAuth();
  const { push } = useToast();
  const { t } = useLanguage();
  const [name, setName] = useState(user.name);
  const [saving, setSaving] = useState(false);
  const [regCount, setRegCount] = useState(null);
  const [attendedCount, setAttendedCount] = useState(null);

  useEffect(() => {
    meApi.myEvents().then(({ registrations }) => {
      setRegCount(registrations.length);
      setAttendedCount(registrations.filter((r) => r.attendance).length);
    }).catch(() => {});
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile(name);
      push('Profile updated.', 'success');
    } catch (err) {
      push(err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <AttendeeShell title={t('profile_title')} subtitle={t('profile_subtitle')}>
      <div className="grid lg:grid-cols-[1fr_320px] gap-6 max-w-3xl">
        <form onSubmit={handleSave} className="rounded-2xl border p-6" style={{ borderColor: 'var(--line-08)', background: 'var(--panel)' }}>
          <h2 className="font-display text-lg font-semibold mb-5">{t('profile_account_details')}</h2>
          <label className="block mb-4">
            <span className="block text-[11px] font-semibold uppercase tracking-wide text-[var(--text-dim)] mb-1.5">{t('profile_full_name')}</span>
            <div className="flex items-center gap-2 rounded-lg border px-3 py-2.5" style={{ borderColor: 'var(--line-10)' }}>
              <User size={15} className="text-[var(--text-dim)]" />
              <input value={name} onChange={(e) => setName(e.target.value)} className="flex-1 bg-transparent outline-none text-sm text-[var(--text)]" />
            </div>
          </label>
          <label className="block mb-6">
            <span className="block text-[11px] font-semibold uppercase tracking-wide text-[var(--text-dim)] mb-1.5">{t('profile_email')}</span>
            <div className="flex items-center gap-2 rounded-lg border px-3 py-2.5 opacity-60" style={{ borderColor: 'var(--line-10)' }}>
              <Mail size={15} className="text-[var(--text-dim)]" />
              <input value={user.email} disabled className="flex-1 bg-transparent outline-none text-sm text-[var(--text)]" />
            </div>
          </label>
          <button disabled={saving} className="px-5 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-70" style={{ background: '#22D3A6', color: '#04140f' }}>
            {saving ? t('profile_saving') : t('profile_save')}
          </button>
        </form>

        <div className="rounded-2xl border p-6 h-fit" style={{ borderColor: 'var(--line-08)', background: 'var(--panel)' }}>
          <h3 className="font-display text-base font-semibold mb-4 flex items-center gap-2"><Shield size={16} style={{ color: '#22D3A6' }} /> {t('profile_summary')}</h3>
          <SummaryRow label={t('profile_role')} value={user.role} />
          <SummaryRow label={t('profile_total_registrations')} value={regCount ?? '—'} />
          <SummaryRow label={t('profile_events_attended')} value={attendedCount ?? '—'} />
        </div>
      </div>
    </AttendeeShell>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b last:border-0" style={{ borderColor: 'var(--line-06)' }}>
      <span className="text-sm text-[var(--text-dim)]">{label}</span>
      <span className="text-sm font-medium text-[var(--text)] capitalize">{value}</span>
    </div>
  );
}
