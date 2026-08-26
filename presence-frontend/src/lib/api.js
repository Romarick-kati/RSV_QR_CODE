// Thin fetch wrapper around the Presence backend (see ../../presence-backend).
// Every page that used to import from lib/mockData.js now imports from here
// instead — the function names below intentionally mirror that old module
// so the diff, page by page, is small and easy to review.

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
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
    throw new ApiError('Could not reach the server. Is the API running?', 0);
  }

  let data = null;
  try { data = await res.json(); } catch { /* e.g. 204 No Content */ }

  if (!res.ok) {
    throw new ApiError(data?.message || 'Something went wrong. Please try again.', res.status, data?.details);
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
  updateMe: (name) => client.patch('/auth/me', { name }),
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
  rsvp: (id) => client.post(`/events/${id}/rsvp`),
};

// ---------- My registrations (attendee) ----------
export const meApi = {
  myEvents: () => client.get('/users/me/events'),
  registration: (registrationId) => client.get(`/users/me/registrations/${registrationId}`),
  cancelRegistration: (registrationId) => client.del(`/users/me/registrations/${registrationId}`),
};

// ---------- Attendance / scanning ----------
export const attendanceApi = {
  checkIn: (token) => client.post('/attendance/check-in', { token }),
  manualCheckIn: (registrationId) => client.post(`/attendance/manual/${registrationId}`),
};

// ---------- Admin ----------
export const adminApi = {
  dashboard: () => client.get('/admin/dashboard'),
  users: () => client.get('/admin/users'),
  registrations: (eventId) => client.get(`/admin/registrations${eventId ? `?eventId=${eventId}` : ''}`),
};

export default client;
