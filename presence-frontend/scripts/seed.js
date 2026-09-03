import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { mongoose } from '../netlify/functions/server/config/db.js';
import { config } from '../netlify/functions/server/config/env.js';
import User from '../netlify/functions/server/models/User.js';
import Event from '../netlify/functions/server/models/Event.js';
import Registration from '../netlify/functions/server/models/Registration.js';
import Attendance from '../netlify/functions/server/models/Attendance.js';
import { generateReference, generateAttendanceToken } from '../netlify/functions/server/utils/tokens.js';

const addDays = (d) => { const dt = new Date(); dt.setDate(dt.getDate() + d); return dt; };

async function upsertUser(data) {
  return User.findOneAndUpdate({ email: data.email }, { $setOnInsert: data }, { upsert: true, new: true });
}

async function main() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(config.mongodbUri);

  console.log('Seeding database...');

  const usingDefaultAdminPassword = !config.adminPassword;
  if (usingDefaultAdminPassword) {
    console.warn(
      '\n[seed] WARNING: ADMIN_PASSWORD is not set in .env — falling back to the\n' +
      '       demo password "admin1234". Set ADMIN_NAME, ADMIN_EMAIL and\n' +
      '       ADMIN_PASSWORD in .env before deploying anywhere real, then\n' +
      '       re-run `npm run seed` (or `npm run admin:sync`) to apply it.\n'
    );
  }

  const passwordHash = await bcrypt.hash('demo1234', 12);
  const organizerHash = await bcrypt.hash('organizer1234', 12);
  const adminHash = await bcrypt.hash(config.adminPassword || 'admin1234', 12);

  // The admin account's credentials come from .env (ADMIN_NAME/ADMIN_EMAIL/
  // ADMIN_PASSWORD), not a hard-coded value. upsertUser only sets these on
  // first insert, so re-running seed after changing .env would silently
  // keep the old password — explicitly sync it below so editing .env and
  // re-seeding always "just works".
  const admin = await upsertUser({ name: config.adminName, email: config.adminEmail, passwordHash: adminHash, role: 'ADMIN' });
  admin.name = config.adminName;
  admin.passwordHash = adminHash;
  await admin.save();

  const organizer = await upsertUser({ name: 'Faculty of Engineering', email: 'organizer@presence.app', passwordHash: organizerHash, role: 'ORGANIZER' });

  const attendeeNames = ['Aisha Bello', 'Tanwie Divine', 'Grace Mbeki', 'Samuel Okafor', 'Linda Achu', 'Chidi Umeh', 'Fatima Njoya', 'Peter Achumbe'];
  const attendees = [];
  for (let i = 0; i < attendeeNames.length; i++) {
    const email = i === 0 ? 'demo@presence.app' : `${attendeeNames[i].toLowerCase().replace(/\s+/g, '.')}@example.com`;
    const user = await upsertUser({ name: attendeeNames[i], email, passwordHash, role: 'ATTENDEE' });
    attendees.push(user);
  }

  const eventDefs = [
    {
      title: 'University Technology & Innovation Conference 2026',
      description: 'A university-wide showcase of student research, startups, and emerging technology.',
      longDescription: 'The flagship technology event of the academic year, bringing together final-year project teams, faculty researchers, and industry partners for a day of demos, talks, and networking.',
      category: 'Technology', date: addDays(6), startTime: '09:00', endTime: '17:00',
      venue: 'Great Hall, Main Campus', capacity: 300, registrationDeadline: addDays(5),
      status: 'published', contact: 'events@university.edu',
    },
    {
      title: 'Hands-on Machine Learning Bootcamp',
      description: 'A full-day practical workshop covering data preprocessing, model training, and deployment.',
      longDescription: 'A practical, laptop-required workshop for students who already know basic Python.',
      category: 'Workshop', date: addDays(12), startTime: '10:00', endTime: '16:00',
      venue: 'Computer Science Lab 2', capacity: 60, registrationDeadline: addDays(10),
      status: 'published', contact: 'cs-dept@university.edu',
    },
    {
      title: 'Engineering Career & Internship Fair',
      description: 'Meet recruiters from telecom, fintech, and infrastructure companies hiring graduates.',
      longDescription: 'Over a dozen employers set up booths for a full afternoon of networking and CV reviews.',
      category: 'Career', date: addDays(20), startTime: '12:00', endTime: '18:00',
      venue: 'Engineering Atrium', capacity: 400, registrationDeadline: addDays(18),
      status: 'published', contact: 'careers@university.edu',
    },
  ];

  // Wipe and recreate events + registrations + attendance each run, so the
  // seed stays idempotent and predictable (users are upserted and kept).
  const existingEventIds = (await Event.find({ organizer: organizer.id }).select('_id')).map((e) => e._id);
  await Registration.deleteMany({ event: { $in: existingEventIds } });
  await Attendance.deleteMany({ event: { $in: existingEventIds } });
  await Event.deleteMany({ organizer: organizer.id });

  const events = [];
  for (const def of eventDefs) {
    const event = await Event.create({ ...def, organizer: organizer.id });
    events.push(event);
  }

  // Register most attendees for the flagship event, check some in.
  const flagship = events[0];
  for (let i = 0; i < attendees.length; i++) {
    const registration = await Registration.create({
      user: attendees[i].id,
      event: flagship.id,
      registrationReference: generateReference(),
      attendanceToken: generateAttendanceToken(),
      status: 'confirmed',
    });
    if (i % 2 === 0) {
      await Attendance.create({ registration: registration.id, event: flagship.id, checkedInBy: organizer.id });
    }
  }

  // A couple of registrations on the second event too.
  for (const user of attendees.slice(0, 3)) {
    await Registration.create({
      user: user.id,
      event: events[1].id,
      registrationReference: generateReference(),
      attendanceToken: generateAttendanceToken(),
      status: 'confirmed',
    });
  }

  console.log('Seed complete.');
  console.log(`  Admin:      ${config.adminEmail} / ${usingDefaultAdminPassword ? 'admin1234 (default — set ADMIN_PASSWORD in .env!)' : '(your ADMIN_PASSWORD)'}`);
  console.log('  Organizer:  organizer@presence.app / organizer1234');
  console.log('  Attendee:   demo@presence.app / demo1234');
}

main()
  .catch((e) => { console.error(e); process.exitCode = 1; })
  .finally(async () => { await mongoose.disconnect(); });
