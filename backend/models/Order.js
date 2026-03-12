import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  name: String,
  price: Number,
  quantity: Number,
  image: String,
});

const orderSchema = new mongoose.Schema({
  id: { type: String, unique: true },
  items: [orderItemSchema],
  subtotal: Number,
  tax: Number,
  shipping: Number,
  total: Number,
  customer: {
    name: String,
    email: String,
    phone: String,
  },
  deliveryAddress: String,
  deliveryType: { type: String, default: 'delivery' },
  paymentMethod: String,
  paymentMethodId: String,
  status: { type: String, default: 'completed' },
  paymentStatus: { type: String, default: 'paid' },
  unread: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('Order', orderSchema);
