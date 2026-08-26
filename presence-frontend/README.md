# Presence — Event Registration & QR Attendance

Final-year Computer Engineering project: a dual-application event
registration and QR-based attendance tracking platform. This is the
**frontend**, now fully wired to the real backend (see `../presence-backend`)
— Phases 1 and 4 from the project brief.

## What's built

- **Public site** — landing page, event discovery (search/filter/sort), event
  detail pages with live capacity, About, FAQ.
- **Auth** — the 3D flip login/register card, backed by the real API
  (JWT + bcrypt), plus an optional **"Continue with Google"** button (Google
  Identity Services) that's fully functional once you add a Client ID — see
  `../presence-backend/README.md`.
- **Attendee app** — dashboard, "My events", profile (editable, saved to the
  server), and a digital QR pass page rendering a *real, scannable* QR code
  containing the server-issued secure token.
- **Organizer/admin console** — dashboard with live charts pulled from the
  API, full event CRUD, attendee management (manual check-in, cancel), a
  **working camera-based QR scanner** that calls the real
  `POST /api/attendance/check-in` endpoint, per-event analytics, and a
  cross-event attendance report with CSV export.
- Loading skeletons, empty states, toasts, confirmation modals, role-based
  route protection, and a responsive layout down to mobile.

## Running locally

You need the backend running first (see `../presence-backend/README.md`).

```bash
cp .env.example .env      # point VITE_API_URL at your backend
npm install
npm run dev                # http://localhost:5173
npm run build               # production build to dist/
```

## Demo accounts

Same three accounts as the backend seed — see `../presence-backend/README.md`.

## About the QR token

The QR code on a digital pass encodes only `tok_...` — a random, secure
token — never the attendee's name, email, or any personal data. This is
intentional and matches the brief's security requirement: the server is
always the source of truth, resolving that token back to a registration only
inside `POST /api/attendance/check-in`. Scanning the code with any generic
QR reader will show that raw token string, which is correct.

## Credit

Built by **Ndi Romarick Kati** — [LinkedIn](https://www.linkedin.com/in/ndi-romarick-kati-0421a1320/) ·
[GitHub](https://github.com/Romarick-Kati) · [Portfolio](https://kati-guidotti.netlify.app) ·
[Skyline (weather app)](https://kati-skyline.netlify.app)

## Stack

React 18 · Vite · React Router · Tailwind CSS v4 · Framer Motion · Recharts ·
`qrcode.react` (QR generation) · `jsqr` (camera-based QR decoding) ·
Google Identity Services · Lucide icons.

