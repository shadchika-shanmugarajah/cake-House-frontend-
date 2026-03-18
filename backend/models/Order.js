import mongoose from 'mongoose';

const generatePublicOrderId = () => {
  const timePart = Date.now().toString(36).toUpperCase();
  const randomPart = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `ORD-${timePart}-${randomPart}`;
};

const orderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true },
  productName: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  quantity: { type: Number, required: true, min: 1 },
  image: { type: String, default: '' },
}, { _id: true });

const deliveryAddressSchema = new mongoose.Schema({
  label: { type: String, default: 'Home' },
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, default: '' },
  zipCode: { type: String, default: '' },
  country: { type: String, default: 'Sri Lanka' },
}, { _id: false });

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  phone: { type: String, default: '' },
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    unique: true,
    default: generatePublicOrderId,
  },
  source: {
    type: String,
    enum: ['web', 'chatbot', 'custom'],
    default: 'web',
  },
  customOrderRequestId: {
    type: String,
    default: '',
    index: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  items: {
    type: [orderItemSchema],
    validate: [(arr) => arr.length > 0, 'Order must have at least one item'],
  },
  subtotal: { type: Number, required: true, min: 0 },
  tax: { type: Number, default: 0, min: 0 },
  shipping: { type: Number, default: 0, min: 0 },
  discount: { type: Number, default: 0, min: 0 },
  totalAmount: { type: Number, required: true, min: 0 },

  customer: { type: customerSchema, required: true },
  address: { type: deliveryAddressSchema, required: true },
  deliveryType: { type: String, enum: ['delivery', 'takeaway'], default: 'delivery' },

  paymentMethod: {
    type: String,
    required: true,
    enum: ['online', 'cash_on_delivery', 'card', 'bank_transfer'],
  },
  paymentStatus: {
    type: String,
    default: 'pending',
    enum: ['pending', 'paid', 'failed', 'refunded'],
  },
  orderStatus: {
    type: String,
    default: 'pending',
    enum: ['pending', 'in_progress', 'ready', 'packed', 'out_for_delivery', 'delivered', 'cancelled'],
  },

  deliveryDate: { type: Date, default: null },
  deliverySlot: { type: String, default: '' },

  cancellationAllowed: { type: Boolean, default: true },
  cancelledAt: { type: Date, default: null },
  cancelReason: { type: String, default: '' },
  cancelledBy: {
    type: String,
    enum: ['', 'customer', 'admin'],
    default: '',
  },
  stockRestoredOnCancel: { type: Boolean, default: false },

  couponCode: { type: String, default: null },
  unread: { type: Boolean, default: true },
  notes: { type: String, default: '' },
}, {
  timestamps: true,
});

orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ orderStatus: 1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ createdAt: -1 });

orderSchema.virtual('id').get(function () {
  return this.orderId;
});

orderSchema.virtual('status').get(function () {
  return this.orderStatus;
});

orderSchema.virtual('total').get(function () {
  return this.totalAmount;
});

orderSchema.virtual('deliveryTime').get(function () {
  return this.deliverySlot;
});

orderSchema.set('toJSON', { virtuals: true });
orderSchema.set('toObject', { virtuals: true });

export default mongoose.model('Order', orderSchema);
