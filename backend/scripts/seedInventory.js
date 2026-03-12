import 'dotenv/config';
import mongoose from 'mongoose';
import Inventory from '../models/Inventory.js';

const defaultItems = [
  { id: 'INV-001', name: 'All-Purpose Flour', category: 'Dry Ingredients', sku: 'FLR-AP-5KG', stock: 42, unit: 'kg', minStock: 20, maxStock: 100, price: 120, supplier: 'Bakery Supplies Co.', lastRestock: 'Jan 15, 2026', status: 'in-stock', location: 'Aisle 1, Shelf B' },
  { id: 'INV-002', name: 'Granulated Sugar', category: 'Dry Ingredients', sku: 'SGR-GR-10KG', stock: 15, unit: 'kg', minStock: 25, maxStock: 80, price: 95, supplier: 'Sweetness Inc.', lastRestock: 'Jan 12, 2026', status: 'low-stock', location: 'Aisle 1, Shelf C' },
  { id: 'INV-003', name: 'Unsalted Butter', category: 'Dairy', sku: 'BTR-UN-1KG', stock: 68, unit: 'kg', minStock: 30, maxStock: 150, price: 650, supplier: 'Fresh Dairy Co.', lastRestock: 'Jan 14, 2026', status: 'in-stock', location: 'Fridge 2' },
  { id: 'INV-004', name: 'Fresh Eggs', category: 'Dairy', sku: 'EGG-FR-30CT', stock: 8, unit: 'cartons', minStock: 15, maxStock: 50, price: 320, supplier: 'Farm Fresh Eggs', lastRestock: 'Jan 13, 2026', status: 'out-of-stock', location: 'Fridge 1' },
  { id: 'INV-005', name: 'Vanilla Extract', category: 'Flavorings', sku: 'VNL-EX-500ML', stock: 120, unit: 'ml', minStock: 10, maxStock: 200, price: 450, supplier: 'Flavor Masters', lastRestock: 'Jan 10, 2026', status: 'in-stock', location: 'Aisle 3, Shelf A' },
  { id: 'INV-006', name: 'Chocolate Chips', category: 'Add-ins', sku: 'CHO-CH-2KG', stock: 22, unit: 'kg', minStock: 20, maxStock: 60, price: 850, supplier: 'Chocolate World', lastRestock: 'Jan 16, 2026', status: 'in-stock', location: 'Aisle 4, Shelf B' },
  { id: 'INV-007', name: 'Baking Powder', category: 'Leavening Agents', sku: 'BPW-500G', stock: 5, unit: 'kg', minStock: 8, maxStock: 30, price: 180, supplier: 'Bakery Supplies Co.', lastRestock: 'Jan 5, 2026', status: 'low-stock', location: 'Aisle 2, Shelf A' },
  { id: 'INV-008', name: 'Heavy Cream', category: 'Dairy', sku: 'CRM-HV-1L', stock: 0, unit: 'liters', minStock: 12, maxStock: 40, price: 380, supplier: 'Fresh Dairy Co.', lastRestock: 'Jan 3, 2026', status: 'out-of-stock', location: 'Fridge 3' },
];

const seed = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const count = await Inventory.countDocuments();
  if (count === 0) {
    await Inventory.insertMany(defaultItems);
    console.log('Inventory seed completed');
  } else {
    console.log('Inventory already has data, skipping seed');
  }
  process.exit(0);
};

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
