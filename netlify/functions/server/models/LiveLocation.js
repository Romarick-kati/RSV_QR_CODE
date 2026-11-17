import mongoose from 'mongoose';
import { idTransformPlugin } from './plugin.js';

const { Schema } = mongoose;

// One row per (event, person) who has explicitly chosen to share their
// position for that event. Consent is the existence of the row: the person
// starts sharing from their own pass page, and can delete the row at any time.
const liveLocationSchema = new Schema({
  event: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  latitude: { type: Number, required: true, min: -90, max: 90 },
  longitude: { type: Number, required: true, min: -180, max: 180 },
  accuracy: { type: Number, default: null },
  updatedAt: { type: Date, default: Date.now },
});

liveLocationSchema.index({ event: 1, user: 1 }, { unique: true });
// Positions are never kept: MongoDB deletes a row 12 hours after its last update.
liveLocationSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 12 * 60 * 60 });
liveLocationSchema.plugin(idTransformPlugin);

export default mongoose.model('LiveLocation', liveLocationSchema);
