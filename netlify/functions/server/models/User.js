import mongoose from 'mongoose';
import { idTransformPlugin } from './plugin.js';

const { Schema } = mongoose;

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    // select: false — never fetched unless a query explicitly asks for it
    // with .select('+passwordHash'), so a stray find() can't leak it.
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ['ADMIN', 'ORGANIZER', 'ATTENDEE'], default: 'ATTENDEE' },
    googleId: { type: String, unique: true, sparse: true },
    avatarUrl: { type: String, default: null },
    // Optional — only used for SMS reminders (utils/sms.js). Not required,
    // since not every attendee will want to share it.
    phone: { type: String, default: null },
    // Self-serve path to becoming a client/organizer account, reviewed by
    // an ADMIN rather than granted automatically — see admin.controller.js.
    organizerRequest: {
      status: { type: String, enum: ['none', 'pending', 'approved', 'rejected'], default: 'none' },
      organizationName: { type: String, default: null },
      reason: { type: String, default: null },
      requestedAt: { type: Date, default: null },
      decidedAt: { type: Date, default: null },
    },
  },
  { timestamps: true }
);

userSchema.index({ role: 1 });
userSchema.plugin(idTransformPlugin);

export default mongoose.model('User', userSchema);
