# Presence API (Phase 2 & 3: Backend + Database)

Express + Mongoose + MongoDB backend for the Presence event registration and
QR attendance platform. Implements the full API surface the Phase 1 frontend
was built against (`presence-app/src/lib/mockData.js` is the contract this
backend fulfills for real).

## Stack

Node.js · Express 5 · MongoDB · Mongoose ODM · JWT auth · bcrypt password
hashing · express-rate-limit · CORS.

## Project structure

```
src/
  config/       env loading, MongoDB connection
  models/       Mongoose schemas (User, Event, Registration, Attendance)
  controllers/  request handlers, one file per resource
  middleware/   auth (JWT), error handling, rate limiting
  routes/       route definitions, grouped by resource
  services/     token signing, small cross-cutting helpers
  utils/        ApiError, asyncHandler, secure token/reference generation
  validators/   request-body validation (no framework — plain functions)
  app.js        Express app + middleware pipeline
  server.js     boots the server, handles graceful shutdown
scripts/
  seed.js       realistic demo data — same accounts as the frontend
tests/
  validators.test.js   pure-logic unit tests (Node's built-in test runner)
```

## Setup

You'll need Node 18+ and a MongoDB instance — any of these work:

- **Docker (easiest)** — the bundled `docker-compose.yml` starts one for you.
- **Local install** — [MongoDB Community Server](https://www.mongodb.com/try/download/community).
- **Hosted** — [MongoDB Atlas](https://www.mongodb.com/atlas) free tier.

```bash
cp .env.example .env
# edit .env — at minimum set JWT_SECRET to a random string, and MONGODB_URI
# if you're not using the bundled docker-compose setup

# start MongoDB locally (optional, if you don't already have one running)
docker compose up -d

npm install
npm run seed   # loads demo events/users into MongoDB
npm run dev    # http://localhost:4000
```

There's no separate migration step — Mongoose creates collections and
indexes automatically the first time each model is used (unique indexes on
email, the attendance token, etc. are declared in `src/models/*.js` and
created on connect).

## Google sign-in (optional)

The login page shows a real "Continue with Google" button when both
`GOOGLE_CLIENT_ID` (backend) and `VITE_GOOGLE_CLIENT_ID` (frontend) are set to
the same OAuth 2.0 Web Client ID. Create one at
https://console.cloud.google.com/apis/credentials, add your frontend's origin
(e.g. `http://localhost:5173`) as an authorized JavaScript origin, and drop
the client ID into both `.env` files. Leave both blank and the button simply
doesn't render — nothing else breaks.

## Demo accounts (after seeding)

| Role      | Email                    | Password        |
|-----------|---------------------------|-----------------|
| Attendee  | demo@presence.app         | demo1234        |
| Organizer | organizer@presence.app    | organizer1234   |
| Admin     | admin@presence.app        | admin1234       |

Same accounts as the frontend's mock data, so Phase 4 (wiring the two
together) is a drop-in swap.

## API overview

All routes are prefixed with `/api`. Protected routes expect
`Authorization: Bearer <token>`.

```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/google           — Google Sign-In (see below), optional
POST   /api/auth/logout            (auth)
GET    /api/auth/me                (auth)
PATCH  /api/auth/me                (auth)

GET    /api/events                 (public, ?category=&q=)
GET    /api/events/:id             (public)
POST   /api/events                 (organizer/admin)
PUT    /api/events/:id             (organizer/admin)
DELETE /api/events/:id             (organizer/admin)
GET    /api/events/:id/statistics  (organizer/admin)
GET    /api/events/:id/attendees   (organizer/admin)
GET    /api/events/:id/attendance  (organizer/admin)
POST   /api/events/:id/rsvp        (auth)

GET    /api/users/me/events                        (auth)
GET    /api/users/me/registrations/:registrationId  (auth)
DELETE /api/users/me/registrations/:registrationId  (auth)

POST   /api/attendance/check-in            (organizer/admin) — the scanner endpoint
POST   /api/attendance/manual/:registrationId (organizer/admin)

GET    /api/admin/dashboard        (organizer/admin)
GET    /api/admin/users            (admin only)
GET    /api/admin/events           (organizer/admin)
GET    /api/admin/registrations    (organizer/admin) — cross-event report, backs the Reports page
```

## How check-in security works

The QR code on an attendee's pass only ever encodes `attendanceToken` — a
32-byte random string, never the attendee's identity. `POST
/api/attendance/check-in` is the only place that token is resolved:

1. Look up the registration by token. Unknown token → `invalid`.
2. Confirm the registration and event are still active.
3. Try to insert an `Attendance` document for that registration. A unique
   index on `Attendance.registration` (see `src/models/Attendance.js`) means
   a second insert for the same registration collides instead of succeeding.
   A collision (`E11000`) → `duplicate`, nothing new is written. Otherwise →
   the insert itself is the check-in record.

Relying on the unique index (rather than a read-then-write check) is what
prevents two near-simultaneous scans of the same code from both succeeding —
the exact race condition the project brief calls out — and it works against
a plain standalone MongoDB instance, with no replica set required.

## Testing

```bash
npm test
```

Runs `tests/validators.test.js` — unit tests for the validation and token
utilities that don't require a database connection. Once `MONGODB_URI` is
configured you can extend this with integration tests against a real (or
disposable) MongoDB instance using the same Mongoose models.

## Environment variables

See `.env.example` — `MONGODB_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `PORT`,
`NODE_ENV`, `CORS_ORIGIN`. Nothing sensitive is hard-coded anywhere in `src/`.

## What's next (per the phased brief)

Phase 4: point the Phase 1 frontend's `lib/mockData.js` calls at these
endpoints (the shapes already match). Phase 5: harden QR attendance further
(rate limits are in place; consider short-lived signed tokens if passes need
to expire). Phase 6: add Socket.IO so the admin dashboard's check-in count
updates via push instead of the current polling-friendly REST shape.
