import mongoose from 'mongoose';
import { idTransformPlugin } from './plugin.js';

const { Schema } = mongoose;

const attendanceSchema = new Schema({
  // Unique index is the actual duplicate-check-in guard: two near-simultaneous
  // scans of the same QR code race to insert here, the second one collides
  // on this index (E11000) and the controller turns that into the
  // "already checked in" response instead of a second attendance record.
  registration: { type: Schema.Types.ObjectId, ref: 'Registration', required: true, unique: true },
  event: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
  checkedInAt: { type: Date, default: Date.now },
  checkedInBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
});

attendanceSchema.index({ event: 1 });
attendanceSchema.plugin(idTransformPlugin);

export default mongoose.model('Attendance', attendanceSchema);
