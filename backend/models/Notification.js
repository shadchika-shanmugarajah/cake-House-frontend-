import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  customerEmail: { type: String, required: true },
  orderId: String,
  message: { type: String, required: true },
  type: { type: String, default: 'bulk_confirmed' },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('Notification', notificationSchema);
