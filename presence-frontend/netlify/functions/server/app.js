import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { config } from './config/env.js';
import apiRoutes from './routes/index.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';
import { apiLimiter } from './middleware/rateLimiter.js';

export function createApp() {
  const app = express();

  app.use(cors({
    // Reflects the request origin back only if it's in the allow-list
    // (config.corsOrigins, from the comma-separated CORS_ORIGIN env var).
    // Requests with no Origin header (health checks, curl, native apps)
    // are allowed through since there's no browser same-origin policy to
    // enforce for them.
    origin(origin, callback) {
      if (!origin || config.corsOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`Origin ${origin} is not allowed by CORS_ORIGIN`));
    },
    credentials: true,
  }));

  // serverless-http (the wrapper that runs this Express app as a Netlify
  // Function — see netlify/functions/api.js) pre-populates req.body with
  // the raw request body as a Buffer, for callers who want to read it
  // without a body-parser. Express 4's body-parser used to skip parsing
  // by checking an internal req._body flag, which serverless-http never
  // set — so express.json() always ran normally. Express 5 changed that
  // check to "is req.body already truthy?", which now matches
  // serverless-http's pre-populated Buffer and makes it skip parsing
  // entirely, silently leaving req.body as a raw Buffer instead of the
  // parsed object every controller expects (email/password come back as
  // undefined, "Validation failed", even though the request was sent
  // correctly). This has no effect locally with `npm run dev` (server.js
  // talks HTTP directly, no serverless-http involved) — it only shows up
  // once deployed as a Netlify Function, which is why it's easy to miss.
  // Fix: if req.body already arrived as a raw Buffer, parse it ourselves
  // before express.json() gets a chance to (silently) skip it. Resetting
  // req.body to undefined and letting express.json() re-read the request
  // stream does NOT work here — serverless-http already drained the
  // stream when it set req.body, so there's nothing left to re-read.
  app.use((req, res, next) => {
    if (Buffer.isBuffer(req.body)) {
      const raw = req.body.toString('utf8');
      const contentType = req.headers['content-type'] || '';
      if (!raw) {
        req.body = {};
      } else if (contentType.includes('application/json')) {
        try {
          req.body = JSON.parse(raw);
        } catch {
          return res.status(400).json({ message: 'Malformed JSON body.' });
        }
      } else {
        req.body = raw;
      }
    }
    next();
  });

  // Raised from the original 1mb so a compressed profile photo or event
  // cover image (sent as a base64 data URL in JSON) fits comfortably.
  // Images are compressed client-side before upload, so this ceiling is
  // just a safety margin, not the expected payload size. Still needed
  // even with the fix above — this handles the normal (non-Netlify-
  // Function) case, e.g. `npm run dev` and the standalone Render deploy.
  app.use(express.json({ limit: '8mb' }));
  app.use(cookieParser());
  if (config.nodeEnv !== 'test') app.use(morgan(config.nodeEnv === 'development' ? 'dev' : 'combined'));
  app.use('/api', apiLimiter);

  app.get('/health', (req, res) => res.json({ status: 'ok', uptime: process.uptime() }));
  app.use('/api', apiRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
