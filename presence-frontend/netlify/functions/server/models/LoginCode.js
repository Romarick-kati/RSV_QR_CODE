import mongoose from 'mongoose';

const { Schema } = mongoose;

// One short-lived sign-in code per email. Only a hash of the code is stored,
// the row is deleted on success, and MongoDB removes it after it expires.
const loginCodeSchema = new Schema({
  email: { type: String, required: true, lowercase: true, trim: true, unique: true },
  codeHash: { type: String, required: true },
  attempts: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
});
loginCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('LoginCode', loginCodeSchema);
