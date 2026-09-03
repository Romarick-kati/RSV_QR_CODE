// Provisions (or updates) *only* the admin account from ADMIN_NAME /
// ADMIN_EMAIL / ADMIN_PASSWORD in .env. Unlike `npm run seed`, this never
// touches events or registrations, so it's the safe way to set or rotate
// the admin password on a real deployment that already has live data.
//
// Usage:
//   1. Edit .env — set ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD.
//   2. npm run admin:sync
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { mongoose } from '../src/config/db.js';
import { config } from '../src/config/env.js';
import User from '../src/models/User.js';

async function main() {
  if (!config.adminPassword) {
    console.error(
      '\n[admin:sync] ADMIN_PASSWORD is not set in .env — refusing to run.\n' +
      '             Set ADMIN_NAME, ADMIN_EMAIL and ADMIN_PASSWORD first.\n'
    );
    process.exitCode = 1;
    return;
  }
  if (config.adminPassword.length < 8) {
    console.error('\n[admin:sync] ADMIN_PASSWORD is too short — use at least 8 characters.\n');
    process.exitCode = 1;
    return;
  }

  console.log('Connecting to MongoDB...');
  await mongoose.connect(config.mongodbUri);

  const passwordHash = await bcrypt.hash(config.adminPassword, 12);
  const existing = await User.findOne({ email: config.adminEmail });

  if (existing) {
    existing.name = config.adminName;
    existing.role = 'ADMIN';
    existing.passwordHash = passwordHash;
    await existing.save();
    console.log(`Updated existing admin account: ${config.adminEmail}`);
  } else {
    await User.create({ name: config.adminName, email: config.adminEmail, passwordHash, role: 'ADMIN' });
    console.log(`Created new admin account: ${config.adminEmail}`);
  }

  console.log('Done. Sign in with the email and password from .env.');
}

main()
  .catch((e) => { console.error(e); process.exitCode = 1; })
  .finally(async () => { await mongoose.disconnect(); });
