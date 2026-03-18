import mongoose from 'mongoose';

const wishlistSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,      // one wishlist per user
    index: true,
  },
  products: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    addedAt:   { type: Date, default: Date.now },
  }],
}, {
  timestamps: true,
});

// ─── Index for fast product lookup within a wishlist ─────────
wishlistSchema.index({ 'products.productId': 1 });

export default mongoose.model('Wishlist', wishlistSchema);
