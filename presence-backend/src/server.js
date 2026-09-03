import { createApp } from './app.js';
import { config, assertRequiredEnv } from './config/env.js';
import { connectDB, mongoose } from './config/db.js';

try {
  assertRequiredEnv();
} catch (err) {
  // eslint-disable-next-line no-console
  console.error(`[config] ${err.message}`);
  process.exit(1);
}

const app = createApp();

async function start() {
  await connectDB();

  const server = app.listen(config.port, () => {
    // eslint-disable-next-line no-console
    console.log(`Presence API listening on http://localhost:${config.port} (${config.nodeEnv})`);
  });

  async function shutdown(signal) {
    // eslint-disable-next-line no-console
    console.log(`${signal} received, shutting down...`);
    server.close(async () => {
      await mongoose.disconnect();
      process.exit(0);
    });
  }

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

start();
