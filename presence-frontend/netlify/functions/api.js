// Wraps the Express + Mongoose backend (copied into ./server, kept in sync
// with the standalone presence-backend project) so it runs as a Netlify
// Function instead of a long-running server. This is what lets the whole
// app — frontend and backend — deploy from a single Netlify site, with no
// separate host (Render/Railway/etc.) needed.
import serverless from 'serverless-http';
import { createApp } from './server/app.js';
import { connectDB } from './server/config/db.js';
import { assertRequiredEnv } from './server/config/env.js';

const app = createApp();
const serverlessHandler = serverless(app);

export const handler = async (event, context) => {
  // Let the function return as soon as the response is sent, instead of
  // waiting for the (kept-open, cached) MongoDB connection to close.
  context.callbackWaitsForEmptyEventLoop = false;

  // Checked first and explicitly, so a missing env var on Netlify produces
  // a clear, actionable message instead of a mysterious generic error —
  // see the comment on assertRequiredEnv() for why this can't just live in
  // config/env.js's module scope for a serverless function.
  try {
    assertRequiredEnv();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[netlify-function]', err.message);
    return { statusCode: 500, body: JSON.stringify({ message: err.message }) };
  }

  try {
    await connectDB();
  } catch {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Database connection failed. Check MONGODB_URI in Netlify environment variables and the function logs for details.' }),
    };
  }

  // The redirect in netlify.toml sends "/api/*" here as
  // "/.netlify/functions/api/*". The Express app's routes are mounted at
  // "/api" (see server/app.js), so swap that Netlify-specific prefix back
  // for the "/api" prefix Express is expecting.
  const path = event.path.replace(/^\/\.netlify\/functions\/api/, '/api') || '/api';

  return serverlessHandler({ ...event, path }, context);
};
