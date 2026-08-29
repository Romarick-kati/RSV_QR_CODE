# This is a copy

This folder is a copy of `presence-backend/src`, kept here so the Express
API can run as a Netlify Function (`netlify/functions/api.js`) alongside
the frontend on the same site — see the "Deploying" section in this
project's top-level `README.md`.

It's a deliberate copy, not a symlink or shared package, so that:

- This project can deploy standalone on Netlify with nothing outside its
  own folder.
- The standalone `presence-backend` project (for anyone who'd rather run
  the API as its own always-on server on Render/Railway/a VPS) keeps
  working completely independently.

**If you change backend logic** (a new route, a validation rule, a model
field), make the same change in both `presence-backend/src` and
`presence-frontend/netlify/functions/server` — they're expected to be kept
in sync by hand, not automatically.
