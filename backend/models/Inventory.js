import mongoose from 'mongoose';

const inventorySchema = new mongoose.Schema({
  id: { type: String, unique: true },
  name: { type: String, required: true },
  category: { type: String, default: 'Dry Ingredients' },
  sku: { type: String, default: '' },
  stock: { type: Number, default: 0 },
  unit: { type: String, default: 'kg' },
  minStock: { type: Number, default: 0 },
  maxStock: { type: Number, default: 100 },
  price: { type: Number, default: 0 },
  supplier: { type: String, default: '' },
  lastRestock: { type: String, default: '' },
  status: { type: String, default: 'in-stock' },
  location: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('Inventory', inventorySchema);
