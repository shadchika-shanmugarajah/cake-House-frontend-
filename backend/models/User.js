import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// ─── Address sub-schema ──────────────────────────────────────
const addressSchema = new mongoose.Schema({
  label:    { type: String, default: 'Home' },              // Home, Work, Other
  street:   { type: String, required: true },
  city:     { type: String, required: true },
  state:    { type: String, default: '' },
  zipCode:  { type: String, default: '' },
  country:  { type: String, default: 'Sri Lanka' },
  isDefault:{ type: Boolean, default: false },
}, { _id: true });

// ─── User schema ─────────────────────────────────────────────
const userSchema = new mongoose.Schema({
  name:     { type: String, required: [true, 'Name is required'], trim: true, minlength: 2, maxlength: 50 },
  email:    { type: String, required: [true, 'Email is required'], unique: true, lowercase: true, trim: true },
  password: { type: String, required: [true, 'Password is required'], minlength: 6, select: false },
  role:     { type: String, enum: ['user', 'admin'], default: 'user' },
  phone:    { type: String, default: '' },
  profileImage: { type: String, default: '' },
  addresses: [addressSchema],
  isActive: { type: Boolean, default: true },
}, {
  timestamps: true,   // createdAt + updatedAt
});

// ─── Indexes ─────────────────────────────────────────────────
userSchema.index({ role: 1 });
userSchema.index({ createdAt: -1 });

// ─── Pre-save: hash password ─────────────────────────────────
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// ─── Instance method: compare password ───────────────────────
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// ─── Strip password from JSON output ─────────────────────────
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

export default mongoose.model('User', userSchema);
