import mongoose from 'mongoose';
import { config } from './env.js';

mongoose.set('strictQuery', true);

export async function connectDB() {
  try {
    await mongoose.connect(config.mongodbUri);
    // eslint-disable-next-line no-console
    console.log(`[db] Connected to MongoDB (${mongoose.connection.name})`);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[db] Failed to connect to MongoDB:', err.message);
    process.exit(1);
  }
}

export { mongoose };
