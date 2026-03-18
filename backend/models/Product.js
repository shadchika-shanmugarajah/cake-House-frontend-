import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  productName: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: 100,
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Category is required'],
    index: true,
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative'],
  },
  description: { type: String, default: '', maxlength: 1000 },
  image:       { type: String, default: '' },
  images:      [{ type: String }],                    // additional gallery images
  stockQuantity: {
    type: Number,
    default: 0,
    min: [0, 'Stock cannot be negative'],
  },
  lowStockThreshold: {
    type: Number,
    default: 10,
    min: [0, 'Low stock threshold cannot be negative'],
  },
  averageRating: { type: Number, default: 0, min: 0, max: 5 },
  reviewCount:   { type: Number, default: 0 },
  featured:      { type: Boolean, default: false },
  isActive:      { type: Boolean, default: true },
  tags:          [{ type: String, trim: true }],      // e.g. ['birthday', 'chocolate']
  weight:        { type: String, default: '' },       // e.g. '1kg', '500g'
  preparationTime: { type: String, default: '' },     // e.g. '2 hours'
}, {
  timestamps: true,
});

// ─── Indexes ─────────────────────────────────────────────────
productSchema.index({ productName: 'text', description: 'text', tags: 'text' }); // Full-text search
productSchema.index({ categoryId: 1, isActive: 1 });
productSchema.index({ price: 1 });
productSchema.index({ averageRating: -1 });
productSchema.index({ featured: 1, isActive: 1 });
productSchema.index({ createdAt: -1 });

// ─── Virtual: inStock ────────────────────────────────────────
productSchema.virtual('inStock').get(function () {
  return this.stockQuantity > 0;
});

productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

export default mongoose.model('Product', productSchema);
