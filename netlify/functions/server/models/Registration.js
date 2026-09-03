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
    // written to by new RSVPs now that CamPay verifies payments for real.
    paymentReference: { type: String, default: null },
    // The transaction reference CamPay itself returns from /collect/. This
    // is the value actually used to verify payment status with CamPay's
    // API — paymentReference above is never trusted for that.
    paymentGatewayReference: { type: String, default: null },
    paymentPhone: { type: String, default: null },
    // Snapshot of the attendee's answers to the event's registrationQuestions
    // at the moment they RSVP'd. Storing the label (not just questionId)
    // means it still displays correctly on the attendee list/CSV export even
    // if the organizer edits or removes that question from the event later.
    answers: {
      type: [
        {
          questionId: { type: String, required: true },
          label: { type: String, required: true },
          value: { type: String, default: '' },
        },
      ],
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
