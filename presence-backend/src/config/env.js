import 'dotenv/config';

const required = ['MONGODB_URI', 'JWT_SECRET'];

for (const key of required) {
  if (!process.env[key]) {
    // Fail loudly at boot rather than mysteriously later — a missing JWT
    // secret or DB URL should never silently fall back to a default.
    // eslint-disable-next-line no-console
    console.error(`[config] Missing required environment variable: ${key}. Copy .env.example to .env and fill it in.`);
    process.exit(1);
  }
}

export const config = {
  port: Number(process.env.PORT) || 4000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongodbUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  // Optional — "Sign in with Google" is disabled gracefully (frontend hides
  // the button, backend rejects the route with a clear message) if unset,
  // rather than crashing the whole server over an optional feature.
  googleClientId: process.env.GOOGLE_CLIENT_ID || null,
};
