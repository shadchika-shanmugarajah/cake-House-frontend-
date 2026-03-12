import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  price: { type: Number, required: true },
  category: { type: String, default: 'Custom' },
  image: { type: String, default: '' },
  rating: { type: Number, default: 4.5 },
  reviewCount: { type: Number, default: 0 },
  isTrending: { type: Boolean, default: false },
  stock: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('Product', productSchema);
