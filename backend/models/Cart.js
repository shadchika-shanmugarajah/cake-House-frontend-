import mongoose from 'mongoose';

// ─── Cart Item sub-schema ────────────────────────────────────
const cartItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  productName: { type: String, required: true },
  price:       { type: Number, required: true, min: 0 },
  quantity:    { type: Number, required: true, min: 1, default: 1 },
  image:       { type: String, default: '' },
}, { _id: true });

// ─── Cart schema ─────────────────────────────────────────────
const cartSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,    // one cart per user
    index: true,
  },
  items: [cartItemSchema],
  couponCode: { type: String, default: null },  // applied coupon
}, {
  timestamps: true,
});

// ─── Virtual: computed totals ────────────────────────────────
cartSchema.virtual('subtotal').get(function () {
  return this.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
});

cartSchema.virtual('totalItems').get(function () {
  return this.items.reduce((sum, item) => sum + item.quantity, 0);
});

cartSchema.set('toJSON', { virtuals: true });
cartSchema.set('toObject', { virtuals: true });

export default mongoose.model('Cart', cartSchema);
