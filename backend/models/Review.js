import mongoose from 'mongoose';
import Product from './Product.js';

const reviewSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    default: null,                              // links review to a purchase
  },
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: 1,
    max: 5,
  },
  comment: { type: String, required: true, maxlength: 500 },
  title:   { type: String, default: '', maxlength: 100 },

  isVerifiedPurchase: { type: Boolean, default: false },
  helpful:   { type: Number, default: 0 },        // helpful-vote count
  reported:  { type: Boolean, default: false },    // flagged by other users
}, {
  timestamps: true,
});

// ─── Indexes ─────────────────────────────────────────────────
reviewSchema.index({ productId: 1, createdAt: -1 });
reviewSchema.index({ userId: 1 });
reviewSchema.index({ productId: 1, userId: 1 }, { unique: true }); // one review per user per product

// ─── Post-save: recalculate product averageRating ────────────
async function recalcRating(productId) {
  const result = await mongoose.model('Review').aggregate([
    { $match: { productId } },
    {
      $group: {
        _id: '$productId',
        averageRating: { $avg: '$rating' },
        reviewCount:   { $sum: 1 },
      },
    },
  ]);

  if (result.length > 0) {
    await Product.findByIdAndUpdate(productId, {
      averageRating: Math.round(result[0].averageRating * 10) / 10,
      reviewCount: result[0].reviewCount,
    });
  } else {
    await Product.findByIdAndUpdate(productId, {
      averageRating: 0,
      reviewCount: 0,
    });
  }
}

reviewSchema.post('save', function () {
  recalcRating(this.productId);
});

reviewSchema.post('findOneAndDelete', function (doc) {
  if (doc) recalcRating(doc.productId);
});

export default mongoose.model('Review', reviewSchema);
