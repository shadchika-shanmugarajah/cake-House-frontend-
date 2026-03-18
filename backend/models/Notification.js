import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true,
  },
  customerEmail: {
    type: String,
    default: '',
    lowercase: true,
    trim: true,
    index: true,
  },
  orderId: { type: String, default: '' },
  title: { type: String, required: [true, 'Title is required'], maxlength: 120 },
  message: { type: String, required: [true, 'Message is required'], maxlength: 500 },
  type: {
    type: String,
    required: true,
    enum: [
      'admin_new_order',
      'order_placed',
      'order_status_update',
      'order_cancelled_update',
      'payment_required',
      'bulk_order_approved',
      'bulk_order_rejected',
      'rating_request',
      'custom_order_received',
      'custom_order_quote',
      'custom_order_price_updated',
      'custom_order_approved',
      'custom_order_status_update',
      'custom_order_rejected',
      'custom_order_price_accepted',
      'custom_order_price_rejected',
      'custom_order_in_progress',
      // Backward-compatible legacy values used by older routes.
      'order_pending',
      'order_packed',
      'order_out_for_delivery',
      'order_delivered',
      'order_cancelled',
      'bulk_confirmed',
      'bulk_cancelled',
      'system',
    ],
  },
  relatedType: {
    type: String,
    default: 'system',
    enum: ['order', 'bulk_order', 'custom_order', 'product', 'system'],
  },
  relatedId: { type: String, default: '' },
  redirectPath: { type: String, default: '/notifications' },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  read: { type: Boolean, default: false },
}, {
  timestamps: true,
});

notificationSchema.index({ customerEmail: 1, read: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

notificationSchema.virtual('id').get(function () {
  return this._id.toString();
});

notificationSchema.set('toJSON', { virtuals: true });
notificationSchema.set('toObject', { virtuals: true });

export default mongoose.model('Notification', notificationSchema);
