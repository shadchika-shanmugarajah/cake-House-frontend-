import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'Coupon code is required'],
    unique: true,
    uppercase: true,
    trim: true,
    maxlength: 20,
  },
  description:  { type: String, default: '' },
  discountType: {
    type: String,
    required: true,
    enum: ['percentage', 'fixed'],              // 10% off vs Rs.500 off
  },
  discountValue: {
    type: Number,
    required: [true, 'Discount value is required'],
    min: 0,
  },
  minOrderAmount: { type: Number, default: 0, min: 0 },   // minimum cart total to apply
  maxDiscount:    { type: Number, default: null },         // cap for percentage discounts
  usageLimit:     { type: Number, default: null },         // total uses allowed (null = unlimited)
  usedCount:      { type: Number, default: 0 },
  perUserLimit:   { type: Number, default: 1 },            // uses per customer
  usedBy: [{
    userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    usedAt:    { type: Date, default: Date.now },
    orderId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  }],
  validFrom: { type: Date, required: true },
  validUntil:{ type: Date, required: true },
  isActive:  { type: Boolean, default: true },
  applicableCategories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }], // empty = all
}, {
  timestamps: true,
});

// ─── Indexes ─────────────────────────────────────────────────
couponSchema.index({ code: 1 });
couponSchema.index({ isActive: 1, validFrom: 1, validUntil: 1 });

// ─── Instance method: check if coupon is currently valid ─────
couponSchema.methods.isValid = function () {
  const now = new Date();
  return (
    this.isActive &&
    now >= this.validFrom &&
    now <= this.validUntil &&
    (this.usageLimit === null || this.usedCount < this.usageLimit)
  );
};

// ─── Instance method: check if a user can use this coupon ────
couponSchema.methods.canBeUsedBy = function (userId) {
  if (!this.isValid()) return false;
  const userUses = this.usedBy.filter(u => u.userId.toString() === userId.toString()).length;
  return userUses < this.perUserLimit;
};

export default mongoose.model('Coupon', couponSchema);
