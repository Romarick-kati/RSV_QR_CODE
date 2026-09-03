import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, UserPlus, Pencil, Trash2, X, Users as UsersIcon, Briefcase, Check, Eye, EyeOff } from 'lucide-react';
import AdminShell from '../../components/layout/AdminShell';
import EmptyState from '../../components/ui/EmptyState';
import ConfirmModal from '../../components/ui/ConfirmModal';
import { useSEO } from '../../lib/useSEO';
import { adminApi } from '../../lib/api';
import { useToast } from '../../lib/ToastContext';
import { useAuth } from '../../lib/AuthContext';
import { formatDate } from '../../lib/utils';

const ROLE_STYLES = {
  ADMIN: { bg: 'rgba(255,92,119,0.14)', fg: '#FF5C77' },
  ORGANIZER: { bg: 'rgba(139,124,246,0.14)', fg: '#8B7CF6' },
  ATTENDEE: { bg: 'var(--line-08)', fg: 'var(--text-dim)' },
};

function RoleBadge({ role }) {
  const s = ROLE_STYLES[role] || ROLE_STYLES.ATTENDEE;
  return (
    <span className="inline-flex items-center text-[11px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full" style={{ background: s.bg, color: s.fg }}>
      {role}
    </span>
  );
}

const EMPTY_FORM = { name: '', email: '', password: '', role: 'ATTENDEE' };

export default function AdminUsers() {
  useSEO('Users', undefined, { noindex: true });
  const { push } = useToast();
  const { user: me } = useAuth();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [requests, setRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [requestBusyId, setRequestBusyId] = useState(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null); // null = creating, else the user object being edited
  const [form, setForm] = useState(EMPTY_FORM);
  const [pwReveal, setPwReveal] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { load(); loadRequests(); }, []);
  function load() {
    setLoading(true);
    adminApi.users().then(({ users: list }) => setUsers(list)).finally(() => setLoading(false));
  }
  function loadRequests() {
    setRequestsLoading(true);
    adminApi.organizerRequests().then(({ requests: list }) => setRequests(list)).finally(() => setRequestsLoading(false));
  }

  async function handleApproveRequest(id) {
    setRequestBusyId(id);
    try {
      await adminApi.approveOrganizerRequest(id);
      push('Organizer access granted.', 'success');
      loadRequests();
      load();
    } catch (err) {
      push(err.message, 'error');
    } finally {
      setRequestBusyId(null);
    }
  }
  async function handleRejectRequest(id) {
    setRequestBusyId(id);
    try {
      await adminApi.rejectOrganizerRequest(id);
      push('Request rejected.', 'info');
      loadRequests();
    } catch (err) {
      push(err.message, 'error');
    } finally {
      setRequestBusyId(null);
    }
  }

  const filtered = useMemo(() => {
    if (!q.trim()) return users;
    const needle = q.toLowerCase();
    return users.filter((u) => u.name.toLowerCase().includes(needle) || u.email.toLowerCase().includes(needle));
  }, [users, q]);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormErrors({});
    setFormOpen(true);
  }
  function openEdit(u) {
    setEditing(u);
    setForm({ name: u.name, email: u.email, password: '', role: u.role });
    setFormErrors({});
    setFormOpen(true);
  }

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email address.';
    if (!editing && form.password.length < 6) e.password = 'Password must be at least 6 characters.';
    if (editing && form.password && form.password.length < 6) e.password = 'Password must be at least 6 characters.';
    return e;
  }

  async function handleSubmit(ev) {
    ev.preventDefault();
    const errs = validate();
    setFormErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setSaving(true);
    try {
      if (editing) {
        const payload = { name: form.name, email: form.email, role: form.role };
        if (form.password) payload.password = form.password;
        await adminApi.updateUser(editing.id, payload);
        push('User updated.', 'success');
      } else {
        await adminApi.createUser(form);
        push('User created.', 'success');
      }
      setFormOpen(false);
      load();
    } catch (err) {
      if (err.details) setFormErrors(err.details);
      else push(err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await adminApi.deleteUser(deleteTarget.id);
      push('User deleted.', 'info');
      setDeleteTarget(null);
      load();
    } catch (err) {
      push(err.message, 'error');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AdminShell
      title="Users"
      subtitle="Add, edit, or remove accounts and their access level."
      actions={
        <button onClick={openCreate} className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-lg whitespace-nowrap" style={{ background: '#22D3A6', color: '#04140f' }}>
          <UserPlus size={14} /> Add user
        </button>
      }
    >
      {!requestsLoading && requests.length > 0 && (
        <div className="rounded-2xl border p-5 mb-6" style={{ borderColor: 'rgba(139,124,246,0.3)', background: 'rgba(139,124,246,0.06)' }}>
          <h3 className="text-sm font-semibold flex items-center gap-2 mb-3" style={{ color: '#8B7CF6' }}>
            <Briefcase size={15} /> Pending organizer requests ({requests.length})
          </h3>
          <div className="flex flex-col gap-2.5">
            {requests.map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-3 rounded-xl border px-4 py-3" style={{ borderColor: 'var(--line-08)', background: 'var(--panel)' }}>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[var(--text)] truncate">{r.organizerRequest?.organizationName} <span className="text-[var(--text-dim)] font-normal">— {r.name} ({r.email})</span></p>
                  {r.organizerRequest?.reason && <p className="text-xs text-[var(--text-dim)] mt-0.5 truncate">{r.organizerRequest.reason}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button disabled={requestBusyId === r.id} onClick={() => handleApproveRequest(r.id)} className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg disabled:opacity-50" style={{ background: '#22D3A6', color: '#04140f' }}>
                    <Check size={12} /> Approve
                  </button>
                  <button disabled={requestBusyId === r.id} onClick={() => handleRejectRequest(r.id)} className="text-xs font-semibold px-3 py-1.5 rounded-lg border disabled:opacity-50 text-[#FF5C77]" style={{ borderColor: 'var(--line-12)' }}>
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="relative mb-6 max-w-sm">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-dim)]" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name or email…"
          className="w-full rounded-xl border pl-10 pr-4 py-2.5 text-sm text-[var(--text)] outline-none"
          style={{ borderColor: 'var(--line-10)', background: 'var(--panel)' }}
        />
      </div>

      {loading ? (
        <div className="grid gap-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-14 rounded-xl skeleton" />)}</div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={UsersIcon} title="No users found" description={q ? 'No accounts match your search.' : 'No accounts yet.'} />
      ) : (
        <div className="rounded-2xl border overflow-x-auto" style={{ borderColor: 'var(--line-08)', background: 'var(--panel)' }}>
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-[var(--text-dim)]" style={{ background: 'var(--line-03)' }}>
                <th className="px-5 py-3 font-semibold">Name</th>
                <th className="px-5 py-3 font-semibold">Role</th>
                <th className="px-5 py-3 font-semibold">Joined</th>
                <th className="px-5 py-3 font-semibold"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="border-t" style={{ borderColor: 'var(--line-06)' }}>
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-[var(--text)]">{u.name}{u.id === me.id && <span className="text-[var(--text-dim)] font-normal"> (you)</span>}</p>
                    <p className="text-xs text-[var(--text-dim)]">{u.email}</p>
                  </td>
                  <td className="px-5 py-3.5"><RoleBadge role={u.role} /></td>
                  <td className="px-5 py-3.5 text-[var(--text-dim)]">{formatDate(u.createdAt)}</td>
                  <td className="px-5 py-3.5 text-right whitespace-nowrap">
                    <button onClick={() => openEdit(u)} className="text-[var(--text-dim)] hover:text-[var(--text)] inline-flex items-center gap-1 text-xs font-semibold mr-4"><Pencil size={13} /> Edit</button>
                    <button
                      onClick={() => setDeleteTarget(u)}
                      disabled={u.id === me.id}
                      className="text-[#FF5C77] inline-flex items-center gap-1 text-xs font-semibold disabled:opacity-30 disabled:cursor-not-allowed"
                      title={u.id === me.id ? "You can't delete your own account while signed in as it." : undefined}
                    >
                      <Trash2 size={13} /> Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AnimatePresence>
        {formOpen && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-6"
            style={{ background: 'rgba(0,0,0,0.6)' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}
            onClick={() => !saving && setFormOpen(false)}
          >
            <motion.form
              onSubmit={handleSubmit}
              onClick={(e) => e.stopPropagation()}
              className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl border p-6 max-h-[90vh] overflow-y-auto"
              style={{ borderColor: 'var(--line-10)', background: 'var(--panel)' }}
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-display text-lg font-semibold text-[var(--text)]">{editing ? 'Edit user' : 'Add user'}</h3>
                <button type="button" onClick={() => setFormOpen(false)} className="text-[var(--text-dim)] hover:text-[var(--text)]"><X size={18} /></button>
              </div>

              <div className="flex flex-col gap-4">
                <Field label="Full name" error={formErrors.name}>
                  <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="w-full rounded-lg border px-3.5 py-2.5 text-sm text-[var(--text)] outline-none focus:border-[#22D3A6]" style={{ borderColor: 'var(--line-10)', background: 'var(--bg)' }} />
                </Field>
                <Field label="Email" error={formErrors.email}>
                  <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className="w-full rounded-lg border px-3.5 py-2.5 text-sm text-[var(--text)] outline-none focus:border-[#22D3A6]" style={{ borderColor: 'var(--line-10)', background: 'var(--bg)' }} />
                </Field>
                <Field label="Role" error={formErrors.role}>
                  <select
                    value={form.role}
                    onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                    disabled={editing && editing.id === me.id}
                    className="w-full rounded-lg border px-3.5 py-2.5 text-sm text-[var(--text)] outline-none focus:border-[#22D3A6]"
                    style={{ borderColor: 'var(--line-10)', background: 'var(--bg)' }}
                  >
                    <option value="ATTENDEE">Attendee</option>
                    <option value="ORGANIZER">Organizer</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                  {editing && editing.id === me.id && (
                    <p className="text-[11px] text-[var(--text-dim)] mt-1">You can't change your own role while signed in as this account.</p>
                  )}
                </Field>
                <Field label={editing ? 'New password (leave blank to keep current)' : 'Password'} error={formErrors.password}>
                  <span className="flex items-center gap-2 rounded-lg border px-3.5 py-0" style={{ borderColor: 'var(--line-10)', background: 'var(--bg)' }}>
                    <input
                      type={pwReveal ? 'text' : 'password'}
                      value={form.password}
                      onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                      placeholder={editing ? '••••••••' : undefined}
                      className="w-full border-0 bg-transparent py-2.5 text-sm text-[var(--text)] outline-none"
                    />
                    <button type="button" tabIndex={-1} onClick={() => setPwReveal((v) => !v)} className="shrink-0 text-[var(--text-dim)] hover:text-[var(--text)]">
                      {pwReveal ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </span>
                </Field>
              </div>

              <div className="flex gap-2 mt-6">
                <button type="button" onClick={() => setFormOpen(false)} disabled={saving} className="flex-1 py-2.5 rounded-lg text-sm font-semibold border disabled:opacity-60 text-[var(--text)]" style={{ borderColor: 'var(--line-14)' }}>
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-60" style={{ background: '#22D3A6', color: '#04140f' }}>
                  {saving ? '…' : editing ? 'Save changes' : 'Create user'}
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmModal
        open={!!deleteTarget}
        title={`Delete ${deleteTarget?.name}?`}
        description="This removes their account and any event registrations they've made. This can't be undone."
        confirmLabel="Delete user"
        busy={deleting}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </AdminShell>
  );
}

function Field({ label, error, children }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-[var(--text-dim)] uppercase tracking-wide mb-1.5">{label}</span>
      {children}
      {error && <span className="block text-xs mt-1" style={{ color: '#FF5C77' }}>{error}</span>}
    </label>
  );
}
