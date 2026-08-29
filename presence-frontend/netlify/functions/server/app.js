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
  // Raised from the original 1mb so a compressed profile photo or event
  // cover image (sent as a base64 data URL in JSON) fits comfortably.
  // Images are compressed client-side before upload, so this ceiling is
  // just a safety margin, not the expected payload size.
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
