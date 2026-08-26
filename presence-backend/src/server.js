import { createApp } from './app.js';
import { config } from './config/env.js';
import { connectDB } from './config/db.js';
import serverless from 'serverless-http';

const app = createApp();

// This middleware ensures you connect to MongoDB on every serverless invocation
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    next(error);
  }
});

// Export the serverless handler for Netlify
export const handler = serverless(app);
