import { useEffect, useRef, useState } from 'react';
import { ImageIcon, Sparkles, Upload, X, Grid3x3, Plus, Trash2 } from 'lucide-react';
import { CATEGORIES } from '../../lib/constants';
import { toDateInputValue } from '../../lib/utils';
import { getSmartEventPhoto, suggestEventPhoto } from '../../lib/eventPhoto';
import { TIMEZONE_OPTIONS } from '../../lib/timezones';
import PhotoGalleryPicker from './PhotoGalleryPicker';
import ImageCropModal from '../ui/ImageCropModal';

const EMPTY = {
  title: '', description: '', longDescription: '', category: 'Technology', date: '', startTime: '09:00', endTime: '17:00',
  venue: '', capacity: 100, organizer: '', registrationDeadline: '', contact: '', status: 'draft', image: '',
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

  function addQuestion() {
    const id = `q_${Date.now().toString(36)}`;
    setForm((f) => ({ ...f, registrationQuestions: [...f.registrationQuestions, { id, label: '', type: 'text', options: [], required: false }] }));
  }
  function updateQuestion(id, patch) {
    setForm((f) => ({ ...f, registrationQuestions: f.registrationQuestions.map((q) => (q.id === id ? { ...q, ...patch } : q)) }));
  }
  function removeQuestion(id) {
    setForm((f) => ({ ...f, registrationQuestions: f.registrationQuestions.filter((q) => q.id !== id) }));
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
    form.registrationQuestions.forEach((q, i) => {
      if (!q.label.trim()) e[`q_${i}`] = 'Question text is required.';
      else if (q.type === 'select' && (q.options || []).filter((o) => o.trim()).length < 2) {
        e[`q_${i}`] = 'Add at least 2 options for a dropdown question.';
      }
    });
    return e;
  }

  async function handleSubmit(ev) {
    ev.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setSaving(true);
    await new Promise((r) => setTimeout(r, 450));
    onSubmit({
      ...form,
      capacity: Number(form.capacity),
      price: Number(form.price) || 0,
      longDescription: form.longDescription || form.description,
      registrationQuestions: form.registrationQuestions
        .filter((q) => q.label.trim())
        .map((q) => ({ ...q, label: q.label.trim(), options: q.type === 'select' ? (q.options || []).map((o) => o.trim()).filter(Boolean) : undefined })),
    });
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

        <div className="grid sm:grid-cols-2 gap-5">
          <Field label="Organizer">
            <input value={form.organizer} onChange={(e) => set('organizer', e.target.value)} placeholder="e.g. Faculty of Engineering" className="input" />
          </Field>
          <Field label="Contact email">
            <input type="email" value={form.contact} onChange={(e) => set('contact', e.target.value)} placeholder="events@university.edu" className="input" />
          </Field>
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          <Field label="Ticket price (0 = free)">
            <input type="number" min={0} step="50" value={form.price} onChange={(e) => set('price', e.target.value)} placeholder="0" className="input" />
          </Field>
          <Field label="Mobile Money number (if paid)" error={errors.momoNumber}>
            <input value={form.momoNumber} onChange={(e) => set('momoNumber', e.target.value)} placeholder="e.g. 6XX XXX XXX" disabled={!Number(form.price)} className="input disabled:opacity-50" />
          </Field>
        </div>
        {Number(form.price) > 0 && (
          <p className="text-xs -mt-2 text-[var(--text-dim)] leading-relaxed">
            Attendees will be asked to send this amount to that Mobile Money number and submit the transaction reference at RSVP.
            Their pass won't scan at the door until you confirm that payment from the attendee list.
          </p>
        )}

        <div className="pt-1 border-t" style={{ borderColor: 'var(--line-08)' }}>
          <div className="flex items-center justify-between mt-5 mb-1">
            <span className="block text-[11px] font-semibold uppercase tracking-wide text-[var(--text-dim)]">Registration questions</span>
            <button type="button" onClick={addQuestion} className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border hover:bg-white/5" style={{ borderColor: 'var(--line-12)' }}>
              <Plus size={13} /> Add question
            </button>
          </div>
          <p className="text-xs text-[var(--text-dim)] mb-3">
            Optional — ask attendees anything at RSVP (e.g. "What's your major?"). Answers show up on the attendee list and CSV export.
          </p>
          {form.registrationQuestions.length === 0 ? (
            <p className="text-xs text-[var(--text-dim)] italic">No custom questions yet.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {form.registrationQuestions.map((q, i) => (
                <div key={q.id} className="rounded-xl border p-3.5" style={{ borderColor: 'var(--line-10)', background: 'var(--bg)' }}>
                  <div className="flex gap-2 items-start">
                    <input
                      value={q.label}
                      onChange={(e) => updateQuestion(q.id, { label: e.target.value })}
                      placeholder="e.g. Dietary restrictions?"
                      className="input flex-1"
                    />
                    <select
                      value={q.type}
                      onChange={(e) => updateQuestion(q.id, { type: e.target.value, options: e.target.value === 'select' ? (q.options?.length ? q.options : ['', '']) : q.options })}
                      className="input w-32 shrink-0"
                    >
                      <option value="text">Free text</option>
                      <option value="select">Dropdown</option>
                    </select>
                    <button type="button" onClick={() => removeQuestion(q.id)} className="p-2.5 rounded-lg border shrink-0 hover:bg-white/5 text-[var(--danger-text)]" style={{ borderColor: 'var(--line-12)' }} aria-label="Remove question">
                      <Trash2 size={14} />
                    </button>
                  </div>
                  {q.type === 'select' && (
                    <div className="flex flex-col gap-1.5 mt-2.5 ml-1">
                      {(q.options || []).map((opt, oi) => (
                        <div key={oi} className="flex gap-2 items-center">
                          <input
                            value={opt}
                            onChange={(e) => {
                              const options = [...(q.options || [])];
                              options[oi] = e.target.value;
                              updateQuestion(q.id, { options });
                            }}
                            placeholder={`Option ${oi + 1}`}
                            className="input text-sm py-1.5"
                          />
                          <button
                            type="button"
                            onClick={() => updateQuestion(q.id, { options: (q.options || []).filter((_, x) => x !== oi) })}
                            className="text-xs text-[var(--text-dim)] hover:text-[var(--danger-text)] shrink-0"
                            aria-label="Remove option"
                          >
                            <X size={13} />
                          </button>
                        </div>
                      ))}
                      <button type="button" onClick={() => updateQuestion(q.id, { options: [...(q.options || []), ''] })} className="text-xs font-semibold text-left" style={{ color: 'var(--accent)' }}>
                        + Add option
                      </button>
                    </div>
                  )}
                  <label className="flex items-center gap-2 mt-2.5 ml-1 text-xs text-[var(--text-dim)] cursor-pointer select-none">
                    <input type="checkbox" checked={q.required} onChange={(e) => updateQuestion(q.id, { required: e.target.checked })} />
                    Required to RSVP
                  </label>
                  {errors[`q_${i}`] && <span className="block text-[12px] mt-1.5 ml-1" style={{ color: 'var(--danger-text)' }}>{errors[`q_${i}`]}</span>}
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
