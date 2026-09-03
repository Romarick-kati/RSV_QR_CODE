import { useEffect, useRef, useState } from 'react';
import { User, Mail, Phone, Shield, Camera, Trash2, Briefcase, Clock, ImagePlus } from 'lucide-react';
import AttendeeShell from '../../components/layout/AttendeeShell';
import { useAuth } from '../../lib/AuthContext';
import { useToast } from '../../lib/ToastContext';
import { useLanguage } from '../../lib/LanguageContext';
import { meApi } from '../../lib/api';
import { useSEO } from '../../lib/useSEO';
import { compressImageFile, ImageError } from '../../lib/imageUtils';

export default function Profile() {
  useSEO('Profile', undefined, { noindex: true });
  const { user, updateProfile, updateAvatar, applyForOrganizer } = useAuth();
  const { push } = useToast();
  const { t } = useLanguage();
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone || '');
  const [saving, setSaving] = useState(false);
  const [regCount, setRegCount] = useState(null);
  const [attendedCount, setAttendedCount] = useState(null);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  useEffect(() => {
    meApi.myEvents().then(({ registrations }) => {
      setRegCount(registrations.length);
      setAttendedCount(registrations.filter((r) => r.attendance).length);
    }).catch(() => {});
  }, []);

  async function handleAvatarChange(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setAvatarBusy(true);
    try {
      const dataUrl = await compressImageFile(file, { maxDim: 320, quality: 0.85, square: true });
      await updateAvatar(dataUrl);
      push('Profile photo updated.', 'success');
    } catch (err) {
      push(err instanceof ImageError ? err.message : (err.message || 'Could not update photo.'), 'error');
    } finally {
      setAvatarBusy(false);
    }
  }

  async function handleRemoveAvatar() {
    setAvatarBusy(true);
    try {
      await updateAvatar(null);
      push('Profile photo removed.', 'success');
    } catch (err) {
      push(err.message, 'error');
    } finally {
      setAvatarBusy(false);
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile({ name, phone: phone.trim() || null });
      push('Profile updated.', 'success');
    } catch (err) {
      push(err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  const [orgName, setOrgName] = useState('');
  const [orgReason, setOrgReason] = useState('');
  const [orgSubmitting, setOrgSubmitting] = useState(false);
  const requestStatus = user.organizerRequest?.status || 'none';

  async function handleOrganizerRequest(e) {
    e.preventDefault();
    setOrgSubmitting(true);
    try {
      await applyForOrganizer({ organizationName: orgName, reason: orgReason });
      push('Request submitted — an admin will review it.', 'success');
    } catch (err) {
      push(err.message, 'error');
    } finally {
      setOrgSubmitting(false);
    }
  }

  return (
    <AttendeeShell title={t('profile_title')} subtitle={t('profile_subtitle')}>
      <div className="grid lg:grid-cols-[1fr_320px] gap-6 max-w-3xl">
        <form onSubmit={handleSave} className="rounded-2xl border p-6" style={{ borderColor: 'var(--line-08)', background: 'var(--panel)' }}>
          <h2 className="font-display text-lg font-semibold mb-5">{t('profile_account_details')}</h2>

          <div className="flex items-center gap-4 mb-6">
            <div className="relative w-16 h-16 shrink-0">
              <span className="w-16 h-16 rounded-full flex items-center justify-center text-lg font-bold overflow-hidden" style={{ background: 'linear-gradient(135deg,#22D3A6,#8B7CF6)', color: '#04140f' }}>
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  user.name.split(' ').map((n) => n[0]).slice(0, 2).join('')
                )}
              </span>
              {avatarBusy && (
                <div className="absolute inset-0 rounded-full flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.45)' }}>
                  <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                </div>
              )}
              <button
                type="button"
                onClick={() => setAvatarMenuOpen((v) => !v)}
                disabled={avatarBusy}
                title="Change profile photo"
                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center border-2"
                style={{ background: '#22D3A6', color: '#04140f', borderColor: 'var(--panel)' }}
              >
                <Camera size={12} />
              </button>
              {avatarMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setAvatarMenuOpen(false)} />
                  <div
                    className="absolute z-20 top-full left-0 mt-2 w-44 rounded-xl border overflow-hidden shadow-lg"
                    style={{ borderColor: 'var(--line-12)', background: 'var(--panel)' }}
                  >
                    <button
                      type="button"
                      onClick={() => { setAvatarMenuOpen(false); cameraInputRef.current?.click(); }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-medium text-left hover:bg-white/5"
                    >
                      <Camera size={14} style={{ color: '#22D3A6' }} /> Take photo
                    </button>
                    <button
                      type="button"
                      onClick={() => { setAvatarMenuOpen(false); fileInputRef.current?.click(); }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-medium text-left hover:bg-white/5 border-t"
                      style={{ borderColor: 'var(--line-08)' }}
                    >
                      <ImagePlus size={14} style={{ color: '#22D3A6' }} /> Choose from gallery
                    </button>
                  </div>
                </>
              )}
              <input ref={cameraInputRef} type="file" accept="image/*" capture="user" className="hidden" onChange={handleAvatarChange} />
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--text)]">{t('profile_photo')}</p>
              <p className="text-xs text-[var(--text-dim)] mb-1.5">{t('profile_photo_hint')}</p>
              {user.avatarUrl && (
                <button type="button" onClick={handleRemoveAvatar} disabled={avatarBusy} className="flex items-center gap-1 text-xs font-medium text-[#FF5C77] disabled:opacity-60">
                  <Trash2 size={11} /> {t('profile_photo_remove')}
                </button>
              )}
            </div>
          </div>

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
          <label className="block mb-6">
            <span className="block text-[11px] font-semibold uppercase tracking-wide text-[var(--text-dim)] mb-1.5">Phone (for SMS reminders, optional)</span>
            <div className="flex items-center gap-2 rounded-lg border px-3 py-2.5" style={{ borderColor: 'var(--line-10)' }}>
              <Phone size={15} className="text-[var(--text-dim)]" />
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+237 6XX XXX XXX" className="flex-1 bg-transparent outline-none text-sm text-[var(--text)]" />
            </div>
          </label>
          <button disabled={saving} className="px-5 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-70" style={{ background: '#22D3A6', color: '#04140f' }}>
            {saving ? t('profile_saving') : t('profile_save')}
          </button>
        </form>

        <div className="flex flex-col gap-6">
          <div className="rounded-2xl border p-6 h-fit" style={{ borderColor: 'var(--line-08)', background: 'var(--panel)' }}>
            <h3 className="font-display text-base font-semibold mb-4 flex items-center gap-2"><Shield size={16} style={{ color: '#22D3A6' }} /> {t('profile_summary')}</h3>
            <SummaryRow label={t('profile_role')} value={user.role} />
            <SummaryRow label={t('profile_total_registrations')} value={regCount ?? '—'} />
            <SummaryRow label={t('profile_events_attended')} value={attendedCount ?? '—'} />
          </div>

          {user.role === 'ATTENDEE' && (
            <div className="rounded-2xl border p-6 h-fit" style={{ borderColor: 'var(--line-08)', background: 'var(--panel)' }}>
              <h3 className="font-display text-base font-semibold mb-2 flex items-center gap-2"><Briefcase size={16} style={{ color: '#8B7CF6' }} /> Become an organizer</h3>
              {requestStatus === 'pending' ? (
                <p className="text-sm text-[var(--text-dim)] flex items-center gap-2"><Clock size={14} /> Request pending review.</p>
              ) : (
                <>
                  <p className="text-xs text-[var(--text-dim)] mb-3 leading-relaxed">
                    Run events yourself? Apply for an organizer account to create and manage your own events on Presence.
                    {requestStatus === 'rejected' && ' Your previous request wasn\'t approved — you can apply again.'}
                  </p>
                  <form onSubmit={handleOrganizerRequest} className="flex flex-col gap-2.5">
                    <input required value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder="Organization / business name" className="input text-sm" />
                    <textarea value={orgReason} onChange={(e) => setOrgReason(e.target.value)} placeholder="What kind of events will you run? (optional)" rows={2} className="input text-sm resize-none" />
                    <button disabled={orgSubmitting} className="px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-70" style={{ background: 'rgba(139,124,246,0.14)', color: '#8B7CF6' }}>
                      {orgSubmitting ? 'Submitting…' : 'Submit request'}
                    </button>
                  </form>
                </>
              )}
            </div>
          )}
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
