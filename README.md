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
  `POST /api/attendance/check-in` endpoint, per-event analytics, a
  cross-event attendance report with CSV export, and (admin-only) a **Users**
  page to add, edit, or remove accounts and their role.
- A notification bell in the admin header — surfaces every new sign-up in
  real time (polling), with an optional email alert too — see "User
  management & notifications" in `../presence-backend/README.md`.
- Light theme by default, switching to dark automatically only if the
  visitor's OS is set to dark mode — both fully designed, toggleable anytime
  from the preferences control in the nav.
- Loading skeletons, empty states, toasts, confirmation modals, role-based
  route protection, and a responsive layout down to mobile.

## Running locally

The backend now runs as a Netlify Function (`netlify/functions/api.js`)
right alongside the frontend — there's no separate server to start.

```bash
cp .env.example .env      # fill in MONGODB_URI, JWT_SECRET, ADMIN_*, etc.
npm install
npx netlify dev            # http://localhost:8888 — frontend + API function together
```

You need a MongoDB connection for anything that touches data — see
"MongoDB Atlas" in the deploy steps below; the same connection string works
for local dev and production. First time only, seed some demo data and
create your admin account:

```bash
npm run seed          # creates demo events + your admin account from .env
npm run admin:sync    # or just this, later, to change the admin password
```

`npm run dev` (plain Vite, no functions) still works for pure frontend
work, but any page that calls the API will show a network error since
there's no function running to answer it — use `netlify dev` whenever you
need the backend too.

## Deploying — frontend and backend together, on Netlify

Everything deploys as **one Netlify site**: the React app as static files,
and the Express + MongoDB backend as a Netlify Function
(`netlify/functions/api.js`) that runs right alongside it. No Render,
Railway, or separate backend host needed, and no card required anywhere in
this path.

1. **Database — MongoDB Atlas (free, no card):** create a cluster at
   [mongodb.com/atlas](https://www.mongodb.com/atlas), add a database user,
   and under Network Access allow `0.0.0.0/0` (Netlify Functions don't have
   a fixed IP to allow-list instead). Copy the connection string from
   Atlas → Connect → Drivers.
2. **Push this repo to GitHub**, then in Netlify: **Add new site → Import an
   existing project** and pick it. `netlify.toml` already sets the build
   command, publish folder, and function directory for you — you shouldn't
   need to change anything in Netlify's build settings screen.
3. Before the first deploy, go to **Site configuration → Environment
   variables** and add every variable from `.env.example` *except* leave
   `VITE_API_URL` as `/api`:
   ```
   VITE_API_URL      = /api
   MONGODB_URI       = (your Atlas connection string from step 1)
   JWT_SECRET        = (a long random string)
   ADMIN_NAME        = (your name)
   ADMIN_EMAIL       = (your real email)
   ADMIN_PASSWORD    = (a real password, 8+ characters)
   ```
   Netlify shows a scope selector per variable — make sure each one is
   available to both **Builds** and **Functions** (some UIs default new
   variables to both already; double-check `MONGODB_URI`, `JWT_SECRET`, and
   the `ADMIN_*` ones specifically, since only the Function needs them).
4. Deploy. Once it's live, run `npm run seed` **locally** with your `.env`
   pointed at the same `MONGODB_URI` — this creates the demo events and
   your real admin account in the same database the live site reads from.
5. **"Could not reach the server"** after deploying almost always means one
   of two things: an environment variable from step 3 is missing or
   misspelled (check the function's logs — Netlify dashboard → Functions →
   `api` → look for `[config] Missing required environment variable`), or
   the deploy happened before the variables were saved (trigger a fresh
   **Deploys → Trigger deploy → Clear cache and deploy site** — env var
   changes only take effect on the next build/deploy, not automatically).
6. The Function needs a moment to open its first database connection on a
   cold start (a few seconds), then stays fast for subsequent requests
   until Netlify recycles the container. This is normal and not an error.

Prefer running the backend as a regular standalone server instead (on
Render, Railway, your own VPS, etc.) rather than as a Netlify Function? The
original version of it still lives in `../presence-backend` and works
exactly as documented there — `netlify/functions/server` is a copy made
specifically for the Function, kept separate on purpose so both options
keep working.

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

