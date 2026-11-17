import mongoose from 'mongoose';
import { idTransformPlugin } from './plugin.js';

const { Schema } = mongoose;

// In-app notifications. `audience: 'admin'` (the original, default kind)
// covers admin/organizer-relevant events — "a new user signed up". Reused
// here for `audience: 'attendee'` — "a new event was published" — so the
// two feeds are queried separately and never mixed into each other, even
// though they share one collection and one readBy-tracking mechanism.
const notificationSchema = new Schema(
  {
    type: { type: String, required: true },
    audience: { type: String, enum: ['admin', 'attendee'], default: 'admin' },
    message: { type: String, required: true },
    meta: { type: Schema.Types.Mixed, default: {} },
    // Tracks who has seen it rather than a single boolean, since there can
    // be more than one admin/organizer account.
    readBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ audience: 1, createdAt: -1 });
notificationSchema.plugin(idTransformPlugin);

export default mongoose.model('Notification', notificationSchema);
