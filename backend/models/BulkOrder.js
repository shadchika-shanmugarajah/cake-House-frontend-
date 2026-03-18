import mongoose from 'mongoose';

const generateBulkOrderId = () => {
  const timePart = Date.now().toString(36).toUpperCase();
  const randomPart = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `BULK-${timePart}-${randomPart}`;
};

const bulkOrderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  productName: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, default: 0, min: 0 },
  image: { type: String, default: '' },
  specialNotes: { type: String, default: '' },
}, { _id: true });

const bulkOrderSchema = new mongoose.Schema({
  bulkOrderId: {
    type: String,
    unique: true,
    default: generateBulkOrderId,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  items: {
    type: [bulkOrderItemSchema],
    validate: [(arr) => arr.length > 0, 'Bulk order must have at least one item'],
  },
  totalQuantity: { type: Number, default: 0, min: 0 },
  subtotal: { type: Number, default: 0, min: 0 },
  tax: { type: Number, default: 0, min: 0 },
  shipping: { type: Number, default: 0, min: 0 },
  totalAmount: { type: Number, default: 0, min: 0 },

  customerName: { type: String, required: true },
  customerEmail: { type: String, required: true, lowercase: true, trim: true },
  customerPhone: { type: String, default: '' },

  requestedDeliveryDate: { type: Date, required: [true, 'Delivery date is required'] },
  alternateDeliveryDate: { type: Date, default: null },
  deliverySlot: { type: String, default: '' },
  deliveryAddress: { type: String, default: '' },

  approvalStatus: {
    type: String,
    default: 'awaiting_admin_acceptance',
    // Keep legacy values for backward compatibility with older records.
    enum: [
      'awaiting_admin_acceptance',
      'awaiting_user_payment',
      'in_progress',
      'ready',
      'out_for_delivery',
      'delivered',
      'rejected',
      'pending',
      'approved',
      'completed',
    ],
  },
  paymentMethod: {
    type: String,
    default: '',
    enum: ['', 'online', 'cash_on_delivery'],
  },
  paymentStatus: {
    type: String,
    default: 'pending',
    enum: ['pending', 'paid', 'failed', 'refunded'],
  },
  trackingEnabled: { type: Boolean, default: false },

  adminRemarks: { type: String, default: '' },
  additionalNotes: { type: String, default: '' },

  approvedAt: { type: Date, default: null },
  rejectedAt: { type: Date, default: null },
  completedAt: { type: Date, default: null },
}, {
  timestamps: true,
});

bulkOrderSchema.index({ userId: 1, createdAt: -1 });
bulkOrderSchema.index({ approvalStatus: 1, createdAt: -1 });
bulkOrderSchema.index({ requestedDeliveryDate: 1 });

bulkOrderSchema.virtual('id').get(function () {
  return this.bulkOrderId;
});

bulkOrderSchema.set('toJSON', { virtuals: true });
bulkOrderSchema.set('toObject', { virtuals: true });

export default mongoose.model('BulkOrder', bulkOrderSchema);
