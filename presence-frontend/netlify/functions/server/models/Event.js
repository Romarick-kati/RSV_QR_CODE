import mongoose from 'mongoose';
import { idTransformPlugin } from './plugin.js';

const { Schema } = mongoose;

const eventSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    longDescription: { type: String, default: null },
    image: { type: String, default: null },
    category: { type: String, required: true },
    date: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    venue: { type: String, required: true },
    capacity: { type: Number, required: true },
    registrationDeadline: { type: Date, required: true },
    status: { type: String, enum: ['draft', 'published', 'cancelled', 'completed'], default: 'draft' },
    contact: { type: String, default: null },
    organizer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    // 0 (or unset) = free event, no payment step at RSVP. > 0 = a paid
    // event using the manual Mobile Money confirmation flow below — there's
    // no live MTN/Orange Money API integration yet (that needs a merchant
    // account this template can't provision for you), so the attendee pays
    // out-of-band and submits a transaction reference, which the organizer
    // confirms from the attendee list before the pass will scan.
    price: { type: Number, default: 0, min: 0 },
    momoNumber: { type: String, default: null },
    // IANA zone the event's own start/end times are in (e.g.
    // "Africa/Douala", "Europe/London"). Previously the whole app assumed
    // every event was in WAT (Cameroon), so an event hosted anywhere else
    // showed/enforced the wrong clock time. Defaults to WAT so existing
    // events keep behaving exactly as before.
    timezone: { type: String, default: 'Africa/Douala' },
  },
  { timestamps: true }
);

eventSchema.index({ status: 1 });
eventSchema.index({ date: 1 });
eventSchema.index({ organizer: 1 });
eventSchema.plugin(idTransformPlugin);

export default mongoose.model('Event', eventSchema);
