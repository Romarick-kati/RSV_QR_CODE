import mongoose from 'mongoose';
import { idTransformPlugin } from './plugin.js';

const { Schema } = mongoose;

// In-app notifications for admins/organizers — currently only "a new user
// signed up", but the `type` field leaves room to grow (e.g. "event at
// capacity", "low check-in turnout") without a schema change.
const notificationSchema = new Schema(
  {
    type: { type: String, required: true },
    message: { type: String, required: true },
    meta: { type: Schema.Types.Mixed, default: {} },
    // Tracks who has seen it rather than a single boolean, since there can
    // be more than one admin/organizer account.
    readBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

notificationSchema.index({ createdAt: -1 });
notificationSchema.plugin(idTransformPlugin);

export default mongoose.model('Notification', notificationSchema);
