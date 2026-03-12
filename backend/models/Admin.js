import mongoose from 'mongoose';

const adminSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role: { type: String, default: 'superadmin' },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('Admin', adminSchema);
