import mongoose from 'mongoose';

const bulkOrderItemSchema = new mongoose.Schema({
  id: mongoose.Schema.Types.Mixed,
  name: String,
  quantity: Number,
  price: Number,
  image: String,
});

const bulkOrderSchema = new mongoose.Schema({
  id: { type: String, unique: true },
  items: [bulkOrderItemSchema],
  totalQuantity: Number,
  subtotal: Number,
  tax: Number,
  shipping: Number,
  total: Number,
  customer: {
    name: String,
    email: String,
    phone: String,
  },
  preferredDate: String,
  preferredTime: String,
  alternateDate: String,
  alternateTime: String,
  additionalNotes: String,
  deliveryOption: { type: String, default: 'delivery' },
  address: String,
  status: { type: String, default: 'pending_approval' },
  paymentStatus: { type: String, default: 'pending' },
  isBulk: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model('BulkOrder', bulkOrderSchema);
