// Thin fetch wrapper around the Presence backend (see ../../presence-backend).
// Every page that used to import from lib/mockData.js now imports from here
// instead — the function names below intentionally mirror that old module
// so the diff, page by page, is small and easy to review.

// The backend now runs as a Netlify Function on this same site (see
// netlify/functions/api.js), so a relative "/api" always resolves
// correctly — no separate backend URL to configure, and no CORS to worry
// about, since it's the same origin as the frontend itself. VITE_API_URL
// is still supported as an override, for anyone running the backend as a
// separate standalone server instead (see presence-backend/README.md).
const API_BASE = import.meta.env.VITE_API_URL || '/api';
const STORAGE_KEY = 'presence_session';

export class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

function getToken() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw).token : null;
  } catch {
    return null;
  }
}

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = auth ? getToken() : null;
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError('Could not reach the server. Check your connection and try again.', 0);
  }

  let data = null;
  let rawText = null;
  try {
    // Read once as text, then parse — so on failure we still have the raw
    // body to build a useful error message from instead of losing it.
    rawText = await res.text();
    data = rawText ? JSON.parse(rawText) : null;
  } catch { /* not JSON — e.g. a 204, or the server/function returned HTML */ }

  if (!res.ok) {
    if (data?.message || data?.errorMessage) {
      throw new ApiError(data.message || data.errorMessage, res.status, data?.details);
    }
    // The server responded, but not with JSON — almost always means the
    // API route itself is unreachable or misconfigured (wrong redirect,
    // function not deployed, cold-start timeout, etc.), not a normal
    // validation error. Surface the status code so it's diagnosable
    // instead of a silent, meaningless "something went wrong".
    const hint = res.status === 404
      ? 'The API endpoint could not be found. Check that the backend is deployed and VITE_API_URL / Netlify redirects are set up correctly.'
      : res.status >= 500
        ? 'The server encountered an error. Check the backend/Netlify function logs for details.'
        : `Request failed (HTTP ${res.status}).`;
    throw new ApiError(hint, res.status);
  }
  return data;
}

const client = {
  get: (path, opts) => request(path, { ...opts, method: 'GET' }),
  post: (path, body, opts) => request(path, { ...opts, method: 'POST', body }),
  put: (path, body, opts) => request(path, { ...opts, method: 'PUT', body }),
  patch: (path, body, opts) => request(path, { ...opts, method: 'PATCH', body }),
  del: (path, opts) => request(path, { ...opts, method: 'DELETE' }),
};

// ---------- Auth ----------
export const authApi = {
  login: (email, password) => client.post('/auth/login', { email, password }, { auth: false }),
  register: (name, email, password) => client.post('/auth/register', { name, email, password }, { auth: false }),
  google: (credential) => client.post('/auth/google', { credential }, { auth: false }),
  me: () => client.get('/auth/me'),
  updateMe: (payload) => client.patch('/auth/me', payload),
  requestOrganizerAccess: (payload) => client.post('/auth/me/organizer-request', payload),
};

// ---------- Events ----------
export const eventsApi = {
  listPublic: (params = {}) => {
    const qs = new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([, v]) => v))).toString();
    return client.get(`/events${qs ? `?${qs}` : ''}`, { auth: false });
  },
  listAdmin: () => client.get('/admin/events'),
  get: (id) => client.get(`/events/${id}`, { auth: false }),
  create: (data) => client.post('/events', data),
  update: (id, data) => client.put(`/events/${id}`, data),
  remove: (id) => client.del(`/events/${id}`),
  statistics: (id) => client.get(`/events/${id}/statistics`),
  attendees: (id) => client.get(`/events/${id}/attendees`),
  attendance: (id) => client.get(`/events/${id}/attendance`),
  rsvp: (id, body) => client.post(`/events/${id}/rsvp`, body),
};

// ---------- My registrations (attendee) ----------
export const meApi = {
  myEvents: () => client.get('/users/me/events'),
  registration: (registrationId) => client.get(`/users/me/registrations/${registrationId}`),
  paymentStatus: (registrationId) => client.get(`/users/me/registrations/${registrationId}/payment-status`),
  cancelRegistration: (registrationId) => client.del(`/users/me/registrations/${registrationId}`),
};

// ---------- Attendance / scanning ----------
export const attendanceApi = {
  checkIn: (token) => client.post('/attendance/check-in', { token }),
  manualCheckIn: (registrationId) => client.post(`/attendance/manual/${registrationId}`),
  confirmPayment: (registrationId) => client.post(`/attendance/confirm-payment/${registrationId}`),
  promoteFromWaitlist: (registrationId) => client.post(`/attendance/promote-waitlist/${registrationId}`),
};

// ---------- Admin ----------
export const adminApi = {
  dashboard: () => client.get('/admin/dashboard'),
  users: (search) => client.get(`/admin/users${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  createUser: (data) => client.post('/admin/users', data),
  updateUser: (id, data) => client.patch(`/admin/users/${id}`, data),
  deleteUser: (id) => client.del(`/admin/users/${id}`),
  registrations: (eventId) => client.get(`/admin/registrations${eventId ? `?eventId=${eventId}` : ''}`),
  notifications: () => client.get('/admin/notifications'),
  markNotificationRead: (id) => client.patch(`/admin/notifications/${id}/read`),
  markAllNotificationsRead: () => client.patch('/admin/notifications/read-all'),
  organizerRequests: () => client.get('/admin/organizer-requests'),
  approveOrganizerRequest: (id) => client.post(`/admin/organizer-requests/${id}/approve`),
  rejectOrganizerRequest: (id) => client.post(`/admin/organizer-requests/${id}/reject`),
};

export default client;
