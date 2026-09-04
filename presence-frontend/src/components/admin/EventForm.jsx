import { useEffect, useRef, useState } from 'react';
import { ImageIcon, Sparkles, Upload, X, Grid3x3 } from 'lucide-react';
import { CATEGORIES } from '../../lib/constants';
import { toDateInputValue } from '../../lib/utils';
import { getSmartEventPhoto, suggestEventPhoto } from '../../lib/eventPhoto';
import { TIMEZONE_OPTIONS } from '../../lib/timezones';
import PhotoGalleryPicker from './PhotoGalleryPicker';
import ImageCropModal from '../ui/ImageCropModal';

const EMPTY = {
  title: '', description: '', longDescription: '', category: 'Technology', date: '', startTime: '09:00', endTime: '17:00',
  venue: '', capacity: 100, registrationDeadline: '', contact: '', status: 'draft', image: '',
  price: 0, momoNumber: '', timezone: 'Africa/Douala', registrationQuestions: [],
};

export default function EventForm({ initial, onSubmit, submitLabel = 'Save event' }) {
  const [form, setForm] = useState(() => ({
    ...EMPTY,
    ...initial,
    date: initial?.date ? toDateInputValue(initial.date) : '',
    registrationDeadline: initial?.registrationDeadline ? toDateInputValue(initial.registrationDeadline) : '',
    momoNumber: initial?.momoNumber || '',
    price: initial?.price ?? 0,
    registrationQuestions: initial?.registrationQuestions || [],
  }));
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Cover photo: 'manual' once the admin uploads their own image, so the
  // auto-suggest effect below stops overwriting it. Starts 'auto' for a new
  // event, or null for an existing one that already has a saved image.
  const [imageSource, setImageSource] = useState(initial?.image ? null : 'auto');
  const [suggesting, setSuggesting] = useState(false);
  const [imageError, setImageError] = useState('');
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [cropSrc, setCropSrc] = useState(null); // raw picked file, awaiting crop confirmation
  const fileInputRef = useRef(null);
  const suggestTimer = useRef(null);

  function set(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  // "Like an AI automatically doing it" — as the organizer types an event
  // name (and hasn't uploaded their own photo), quietly suggest a matching
  // cover photo in the background, debounced so it doesn't fire on every
  // keystroke.
  useEffect(() => {
    if (imageSource !== 'auto') return;
    if (!form.title.trim()) return;
    clearTimeout(suggestTimer.current);
    suggestTimer.current = setTimeout(() => {
      suggestEventPhoto(form.title, form.category).then((url) => {
        setForm((f) => (imageSourceIsStillAuto() ? { ...f, image: url } : f));
      }).catch(() => {});
    }, 700);
    return () => clearTimeout(suggestTimer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.title, form.category, imageSource]);

  // Guards against a slow suggestion landing after the admin has since
  // uploaded their own photo (closure-safe read of the latest state).
  function imageSourceIsStillAuto() {
    return imageSource === 'auto';
  }

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setImageError('');
    // Read the raw file into the crop step instead of compressing and
    // saving it immediately — lets the organizer reposition/zoom/rotate
    // before it becomes the actual cover image.
    const reader = new FileReader();
    reader.onerror = () => setImageError('Could not read that file.');
    reader.onload = () => setCropSrc(reader.result);
    reader.readAsDataURL(file);
  }

  function handleCropConfirm(dataUrl) {
    setForm((f) => ({ ...f, image: dataUrl }));
    setImageSource('manual');
    setCropSrc(null);
  }

  async function handleAutoSuggest() {
    setImageError('');
    setSuggesting(true);
    try {
      const url = await suggestEventPhoto(form.title, form.category);
      setForm((f) => ({ ...f, image: url }));
      setImageSource('auto');
    } catch {
      setImageError('Could not suggest a photo right now.');
    } finally {
      setSuggesting(false);
    }
  }

  function handleRemoveImage() {
    setForm((f) => ({ ...f, image: '' }));
    setImageSource(null);
  }

  function handleGallerySelect(url) {
    setForm((f) => ({ ...f, image: url }));
    setImageSource('manual'); // stop auto-suggest from overwriting a deliberate pick
    setGalleryOpen(false);
  }

  function validate() {
    const e = {};
    if (!form.title.trim()) e.title = 'Event name is required.';
    if (!form.description.trim()) e.description = 'A short description is required.';
    if (!form.date) e.date = 'Date is required.';
    if (!form.venue.trim()) e.venue = 'Venue is required.';
    if (!form.capacity || form.capacity < 1) e.capacity = 'Capacity must be at least 1.';
    if (!form.registrationDeadline) e.registrationDeadline = 'Registration deadline is required.';
    if (form.registrationDeadline && form.date && form.registrationDeadline > form.date) {
      e.registrationDeadline = 'Deadline must be on or before the event date.';
    }
    if (form.startTime >= form.endTime) e.endTime = 'End time must be after start time.';
    if (Number(form.price) > 0 && !form.momoNumber.trim()) e.momoNumber = 'A Mobile Money number is required for a paid event.';
    return e;
  }

  async function handleSubmit(ev) {
    ev.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setSaving(true);
    await new Promise((r) => setTimeout(r, 450));
    onSubmit({ ...form, capacity: Number(form.capacity), price: Number(form.price) || 0, longDescription: form.longDescription || form.description });
    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} className="grid lg:grid-cols-[1fr_320px] gap-6">
      <div className="rounded-2xl border p-6 flex flex-col gap-5" style={{ borderColor: 'var(--line-08)', background: 'var(--panel)' }}>
        <Field label="Event name" error={errors.title}>
          <input value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. University Technology & Innovation Conference" className="input" />
        </Field>
        <Field label="Short description" error={errors.description}>
          <textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={2} placeholder="One or two sentences shown on event cards." className="input resize-none" />
        </Field>
        <Field label="Full description">
          <textarea value={form.longDescription} onChange={(e) => set('longDescription', e.target.value)} rows={4} placeholder="Full details shown on the event page." className="input resize-none" />
        </Field>

        <Field label="Cover photo">
          <div className="flex gap-4 items-start">
            <div className="w-28 h-20 rounded-lg overflow-hidden shrink-0 border relative" style={{ borderColor: 'var(--line-10)', background: 'var(--bg)' }}>
              <img
                src={getSmartEventPhoto(form)}
                alt=""
                className="w-full h-full object-cover"
                onError={(e) => {
                  const fallback = getSmartEventPhoto({ ...form, image: null });
                  if (e.currentTarget.src !== fallback) e.currentTarget.src = fallback;
                }}
              />
              {suggesting && (
                <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.45)' }}>
                  <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap gap-2">
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                <button type="button" onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border hover:bg-white/5" style={{ borderColor: 'var(--line-12)' }}>
                  <Upload size={13} /> Upload photo
                </button>
                <button type="button" onClick={handleAutoSuggest} disabled={suggesting} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg disabled:opacity-60" style={{ background: 'rgba(139,124,246,0.14)', color: '#8B7CF6' }}>
                  <Sparkles size={13} /> {suggesting ? 'Suggesting…' : 'Auto-suggest from name'}
                </button>
                <button type="button" onClick={() => setGalleryOpen(true)} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border hover:bg-white/5" style={{ borderColor: 'var(--line-12)' }}>
                  <Grid3x3 size={13} /> Browse photos
                </button>
                {form.image && (
                  <button type="button" onClick={handleRemoveImage} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border hover:bg-white/5 text-[var(--text-dim)]" style={{ borderColor: 'var(--line-12)' }}>
                    <X size={13} /> Remove
                  </button>
                )}
              </div>
              <p className="text-xs text-[var(--text-dim)] mt-2 flex items-start gap-1.5">
                <ImageIcon size={13} className="shrink-0 mt-0.5" />
                {imageSource === 'auto' && form.image
                  ? "Auto-picked from the event name — upload your own to override it."
                  : 'Upload your own image, or let it auto-match a photo to the event name as you type.'}
              </p>
              {imageError && <p className="text-xs mt-1.5" style={{ color: 'var(--danger-text)' }}>{imageError}</p>}
            </div>
          </div>
        </Field>

        <div className="grid sm:grid-cols-2 gap-5">
          <Field label="Category">
            <select value={form.category} onChange={(e) => set('category', e.target.value)} className="input">
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Venue" error={errors.venue}>
            <input value={form.venue} onChange={(e) => set('venue', e.target.value)} placeholder="e.g. Great Hall, Main Campus" className="input" />
          </Field>
        </div>

        <div className="grid sm:grid-cols-3 gap-5">
          <Field label="Event date" error={errors.date}>
            <input type="date" value={form.date} onChange={(e) => set('date', e.target.value)} className="input" />
          </Field>
          <Field label="Start time">
            <input type="time" value={form.startTime} onChange={(e) => set('startTime', e.target.value)} className="input" />
          </Field>
          <Field label="End time" error={errors.endTime}>
            <input type="time" value={form.endTime} onChange={(e) => set('endTime', e.target.value)} className="input" />
          </Field>
        </div>

        <Field label="Timezone" hint="What clock the times above are on — shown to every attendee regardless of where they're browsing from.">
          <select value={form.timezone} onChange={(e) => set('timezone', e.target.value)} className="input">
            {TIMEZONE_OPTIONS.map((group) => (
              <optgroup key={group.group} label={group.group}>
                {group.zones.map((z) => <option key={z.value} value={z.value}>{z.label}</option>)}
              </optgroup>
            ))}
          </select>
        </Field>

        <div className="grid sm:grid-cols-2 gap-5">
          <Field label="Capacity" error={errors.capacity}>
            <input type="number" min={1} value={form.capacity} onChange={(e) => set('capacity', e.target.value)} className="input" />
          </Field>
          <Field label="Registration deadline" error={errors.registrationDeadline}>
            <input type="date" value={form.registrationDeadline} onChange={(e) => set('registrationDeadline', e.target.value)} className="input" />
          </Field>
        </div>

        <Field label="Contact email">
          <input type="email" value={form.contact} onChange={(e) => set('contact', e.target.value)} placeholder="events@university.edu" className="input" />
        </Field>

        <div className="grid sm:grid-cols-2 gap-5">
          <Field label="Ticket price (0 = free)">
            <input type="number" min={0} value={form.price} onChange={(e) => set('price', e.target.value)} placeholder="0" className="input" />
          </Field>
          <Field label="Mobile Money number (if paid)" error={errors.momoNumber}>
            <input value={form.momoNumber} onChange={(e) => set('momoNumber', e.target.value)} placeholder="e.g. 6XX XXX XXX" disabled={!Number(form.price)} className="input disabled:opacity-50" />
          </Field>
        </div>
        {Number(form.price) > 0 && (
          <p className="text-xs -mt-2 text-[var(--text-dim)] leading-relaxed">
            At checkout, attendees enter their Mobile Money phone number and approve a real payment prompt via CamPay.
            Their pass unlocks automatically the moment CamPay confirms the transaction — no manual confirmation needed.
          </p>
        )}

        <div className="pt-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-dim)]">
              Registration questions (optional)
            </span>
            <button
              type="button"
              onClick={() => set('registrationQuestions', [...form.registrationQuestions, { label: '', required: false }])}
              className="text-xs font-semibold px-2.5 py-1 rounded-lg"
              style={{ background: 'rgba(var(--accent-rgb),0.14)', color: 'var(--accent)' }}
            >
              + Add question
            </button>
          </div>
          <p className="text-xs text-[var(--text-dim)] leading-relaxed mb-3">
            Anything you want to ask each attendee at RSVP — e.g. "What's your major?" or "Dietary restrictions?".
            Answers show up in the attendee list and CSV export.
          </p>
          {form.registrationQuestions.length > 0 && (
            <div className="flex flex-col gap-2">
              {form.registrationQuestions.map((q, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    value={q.label}
                    onChange={(e) => {
                      const next = [...form.registrationQuestions];
                      next[i] = { ...next[i], label: e.target.value };
                      set('registrationQuestions', next);
                    }}
                    placeholder="Question text"
                    className="input flex-1"
                  />
                  <label className="flex items-center gap-1.5 text-xs text-[var(--text-dim)] shrink-0 select-none">
                    <input
                      type="checkbox"
                      checked={q.required}
                      onChange={(e) => {
                        const next = [...form.registrationQuestions];
                        next[i] = { ...next[i], required: e.target.checked };
                        set('registrationQuestions', next);
                      }}
                    />
                    Required
                  </label>
                  <button
                    type="button"
                    onClick={() => set('registrationQuestions', form.registrationQuestions.filter((_, idx) => idx !== i))}
                    className="shrink-0 text-[var(--text-dim)] hover:text-[#FF5C77]"
                  >
                    <X size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border p-6 h-fit flex flex-col gap-4" style={{ borderColor: 'var(--line-08)', background: 'var(--panel)' }}>
        <Field label="Status">
          <select value={form.status} onChange={(e) => set('status', e.target.value)} className="input">
            <option value="draft">Draft (hidden from attendees)</option>
            <option value="published">Published (visible &amp; open for RSVP)</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </Field>
        <p className="text-xs text-[var(--text-dim)] leading-relaxed">
          Draft events are only visible in this dashboard. Publishing makes the event immediately visible on the
          public site and opens it for registration.
        </p>
        <button disabled={saving} className="btn-pop w-full py-3 rounded-xl text-sm font-semibold disabled:opacity-70" style={{ background: 'linear-gradient(135deg,var(--accent),var(--accent-2))', color: 'var(--accent-ink)' }}>
          {saving ? 'Saving…' : submitLabel}
        </button>
      </div>

      <PhotoGalleryPicker
        open={galleryOpen}
        onClose={() => setGalleryOpen(false)}
        onSelect={handleGallerySelect}
        initialTheme={{ Technology: 'tech', Academic: 'academic', Corporate: 'corporate', Workshop: 'workshop', Seminar: 'seminar', Career: 'career', Cultural: 'cultural' }[form.category]}
      />

      <ImageCropModal
        open={!!cropSrc}
        imageSrc={cropSrc}
        aspect={16 / 9}
        onCancel={() => setCropSrc(null)}
        onConfirm={handleCropConfirm}
      />

      <style>{`.input{width:100%;background:var(--bg);border:1px solid var(--line-10);border-radius:10px;padding:10px 12px;font-size:14px;color:var(--text);outline:none;} .input:focus{border-color:var(--accent);}`}</style>
    </form>
  );
}

function Field({ label, error, hint, children }) {
  return (
    <label className="block">
      <span className="block text-[11px] font-semibold uppercase tracking-wide text-[var(--text-dim)] mb-1.5">{label}</span>
      {children}
      {hint && !error && <span className="block text-[11px] text-[var(--text-dim)] mt-1.5 normal-case font-normal tracking-normal">{hint}</span>}
      {error && <span className="block text-[12px] text-[var(--danger-text)] mt-1.5">{error}</span>}
    </label>
  );
}
