import { useState } from 'react';
import { CATEGORIES } from '../../lib/constants';
import { toDateInputValue } from '../../lib/utils';

const EMPTY = {
  title: '', description: '', longDescription: '', category: 'Technology', date: '', startTime: '09:00', endTime: '17:00',
  venue: '', capacity: 100, organizer: '', registrationDeadline: '', contact: '', status: 'draft',
};

export default function EventForm({ initial, onSubmit, submitLabel = 'Save event' }) {
  const [form, setForm] = useState(() => ({
    ...EMPTY,
    ...initial,
    date: initial?.date ? toDateInputValue(initial.date) : '',
    registrationDeadline: initial?.registrationDeadline ? toDateInputValue(initial.registrationDeadline) : '',
  }));
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  function set(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
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
    return e;
  }

  async function handleSubmit(ev) {
    ev.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setSaving(true);
    await new Promise((r) => setTimeout(r, 450));
    onSubmit({ ...form, capacity: Number(form.capacity), longDescription: form.longDescription || form.description });
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
        <button disabled={saving} className="w-full py-3 rounded-xl text-sm font-semibold disabled:opacity-70" style={{ background: 'linear-gradient(135deg,#22D3A6,#8B7CF6)', color: '#04140f' }}>
          {saving ? 'Saving…' : submitLabel}
        </button>
      </div>

      <style>{`.input{width:100%;background:var(--bg);border:1px solid var(--line-10);border-radius:10px;padding:10px 12px;font-size:14px;color:var(--text);outline:none;} .input:focus{border-color:#22D3A6;}`}</style>
    </form>
  );
}

function Field({ label, error, children }) {
  return (
    <label className="block">
      <span className="block text-[11px] font-semibold uppercase tracking-wide text-[var(--text-dim)] mb-1.5">{label}</span>
      {children}
      {error && <span className="block text-[12px] text-[var(--danger-text)] mt-1.5">{error}</span>}
    </label>
  );
}
