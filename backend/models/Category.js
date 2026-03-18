import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    unique: true,
    trim: true,
    maxlength: 50,
  },
  description: { type: String, default: '', maxlength: 200 },
  image:       { type: String, default: '' },
  isActive:    { type: Boolean, default: true },
}, {
  timestamps: true,
});

// ─── Indexes ─────────────────────────────────────────────────
categorySchema.index({ isActive: 1 });

export default mongoose.model('Category', categorySchema);
