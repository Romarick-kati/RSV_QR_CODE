import mongoose from 'mongoose';
import { idTransformPlugin } from './plugin.js';

const { Schema } = mongoose;

const registrationSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    event: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
    registrationReference: { type: String, required: true, unique: true },
    status: { type: String, enum: ['confirmed', 'cancelled'], default: 'confirmed' },
    // The only thing the QR code carries. High-entropy, unique — see
    // utils/tokens.js for how it's generated.
    attendanceToken: { type: String, required: true, unique: true },
    // Only meaningful when the event has a price > 0. 'not_required' for
    // free events, so a simple !== 'confirmed' check can't accidentally
    // block check-in on every free registration ever made before this field
    // existed.
    paymentStatus: { type: String, enum: ['not_required', 'pending', 'confirmed'], default: 'not_required' },
    paymentReference: { type: String, default: null },
  },
  { timestamps: true }
);

// A user may only hold one registration record per event — re-registering
// after a cancellation reactivates that same record (see rsvp.controller)
// rather than inserting a second one, which this index would reject anyway.
registrationSchema.index({ user: 1, event: 1 }, { unique: true });
registrationSchema.index({ event: 1 });
registrationSchema.index({ attendanceToken: 1 });

// Mirrors the Prisma schema's one-to-one back-relation: `registration.attendance`
// resolves without attendance ever being stored on this document.
registrationSchema.virtual('attendance', {
  ref: 'Attendance',
  localField: '_id',
  foreignField: 'registration',
  justOne: true,
});

registrationSchema.plugin(idTransformPlugin);

export default mongoose.model('Registration', registrationSchema);
