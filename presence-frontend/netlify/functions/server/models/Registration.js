import mongoose from 'mongoose';
import { idTransformPlugin } from './plugin.js';

const { Schema } = mongoose;

const registrationSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    event: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
    registrationReference: { type: String, required: true, unique: true },
    status: { type: String, enum: ['confirmed', 'waitlisted', 'cancelled'], default: 'confirmed' },
    // The only thing the QR code carries. High-entropy, unique — see
    // utils/tokens.js for how it's generated.
    attendanceToken: { type: String, required: true, unique: true },
    // Only meaningful when the event has a price > 0. 'not_required' for
    // free events, so a simple !== 'confirmed' check can't accidentally
    // block check-in on every free registration ever made before this field
    // existed.
    paymentStatus: { type: String, enum: ['not_required', 'pending', 'confirmed', 'failed'], default: 'not_required' },
    // Legacy free-text field from the honor-system flow (kept so old
    // registrations still display something meaningful) — no longer
    // written to by new RSVPs now that a real payment gateway verifies
    // payments (see utils/fapshi.js).
    paymentReference: { type: String, default: null },
    // The transaction id the active payment gateway (Fapshi) returns when
    // a payment is initiated. This is the value actually used to verify
    // payment status against the gateway's API — paymentReference above
    // is never trusted for that.
    paymentGatewayReference: { type: String, default: null },
    // Always null under Fapshi (it collects the phone on its own hosted
    // checkout page, never sends it back to us) — kept only because CamPay
    // did provide this, so switching providers back doesn't need a schema
    // migration.
    paymentPhone: { type: String, default: null },
    // Answers to the event's registrationQuestions (if any), captured at
    // RSVP time. Stored as a plain array of { label, answer } snapshots —
    // NOT a reference back to Event.registrationQuestions by index/id —
    // deliberately, so that if an organizer edits or removes a question
    // later, every guest's already-submitted answers stay exactly as they
    // were originally asked and answered (Luma does the same: "Registration
    // changes only affect guests who register after you make them").
    answers: {
      type: [{ label: String, answer: String }],
      default: [],
    },
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
