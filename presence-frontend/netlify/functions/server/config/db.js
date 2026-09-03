import mongoose from 'mongoose';
import { config } from './env.js';

mongoose.set('strictQuery', true);

// In a normal long-running server, connect() runs once at boot. In a
// serverless function, this module can be re-evaluated on every cold
// start — so without caching, each invocation would open a fresh MongoDB
// connection and never close it, quickly exhausting Atlas's free-tier
// connection limit (500). Caching the connection promise on `global` lets
// invocations that hit a warm container reuse the existing connection
// instead of opening a new one.
let cachedConnection = global._presenceMongooseConnection;
if (!cachedConnection) {
  cachedConnection = global._presenceMongooseConnection = { conn: null, promise: null };
}

export async function connectDB() {
  if (cachedConnection.conn) return cachedConnection.conn;

  if (!cachedConnection.promise) {
    cachedConnection.promise = mongoose
      .connect(config.mongodbUri, {
        // Keep the connection pool small — serverless functions run many
        // short-lived containers, each with its own pool; a large default
        // pool per-container adds up fast against Atlas's connection cap.
        maxPoolSize: 5,
        serverSelectionTimeoutMS: 8000,
      })
      .then((m) => {
        // eslint-disable-next-line no-console
        console.log(`[db] Connected to MongoDB (${m.connection.name})`);
        return m;
      })
      .catch((err) => {
        cachedConnection.promise = null; // allow retry on the next invocation
        // eslint-disable-next-line no-console
        console.error('[db] Failed to connect to MongoDB:', err.message);
        throw err;
      });
  }

  cachedConnection.conn = await cachedConnection.promise;
  return cachedConnection.conn;
}

export { mongoose };
