import express from 'express';
import mongoose from 'mongoose';
import Inventory from '../models/Inventory.js';
import Product from '../models/Product.js';
import { verifyAdmin } from '../middleware/auth.js';

const router = express.Router();
const DEFAULT_LOW_STOCK_THRESHOLD = 10;

const generateInvId = () => `INV-${String(Date.now()).slice(-6)}`;

const findById = (id) => {
  if (mongoose.Types.ObjectId.isValid(id) && String(new mongoose.Types.ObjectId(id)) === id) {
    return Inventory.findOne({ $or: [{ id }, { _id: id }] });
  }
  return Inventory.findOne({ id });
};

const normalizeThreshold = (value) => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 0) return DEFAULT_LOW_STOCK_THRESHOLD;
  return parsed;
};

const getStockStatus = (stockQuantity, lowStockThreshold) => {
  if (stockQuantity <= 0) return 'out-of-stock';
  if (stockQuantity <= lowStockThreshold) return 'low-stock';
  return 'in-stock';
};

const toProductInventoryView = (productDoc) => {
  const product = typeof productDoc.toObject === 'function'
    ? productDoc.toObject({ virtuals: true })
    : productDoc;

  const currentStock = Number(product.stockQuantity || 0);
  const lowStockThreshold = normalizeThreshold(product.lowStockThreshold);
  const stockStatus = getStockStatus(currentStock, lowStockThreshold);

  return {
    _id: product._id,
    id: product._id,
    productName: product.productName,
    category: product.categoryId?.name || '',
    categoryId: product.categoryId?._id || product.categoryId || null,
    image: product.image || '',
    currentStock,
    lowStockThreshold,
    stockStatus,
    isLowStock: stockStatus === 'low-stock' || stockStatus === 'out-of-stock',
    updatedAt: product.updatedAt,
  };
};

router.use(verifyAdmin);

// Product inventory endpoints
router.get('/products', async (req, res) => {
  try {
    const search = String(req.query.search || '').trim().toLowerCase();
    const status = String(req.query.status || 'all').trim().toLowerCase();
    const category = String(req.query.category || 'all').trim().toLowerCase();

    const products = await Product.find({ isActive: true })
      .populate('categoryId', 'name')
      .sort({ updatedAt: -1 });

    const allItems = products.map(toProductInventoryView);

    const summary = {
      totalProducts: allItems.length,
      lowStockItems: allItems.filter((item) => item.stockStatus === 'low-stock').length,
      outOfStockItems: allItems.filter((item) => item.stockStatus === 'out-of-stock').length,
    };

    const filtered = allItems.filter((item) => {
      if (search && !item.productName.toLowerCase().includes(search)) return false;
      if (category !== 'all') {
        const categoryName = String(item.category || '').toLowerCase();
        const categoryId = String(item.categoryId || '').toLowerCase();
        if (categoryName !== category && categoryId !== category) return false;
      }
      if (status !== 'all' && item.stockStatus !== status) return false;
      return true;
    });

    res.json({
      items: filtered,
      summary,
      total: filtered.length,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/products/low-stock', async (req, res) => {
  try {
    const products = await Product.find({ isActive: true })
      .populate('categoryId', 'name')
      .sort({ stockQuantity: 1, updatedAt: -1 });

    const lowStockItems = products
      .map(toProductInventoryView)
      .filter((item) => item.stockStatus === 'low-stock' || item.stockStatus === 'out-of-stock');

    res.json({
      items: lowStockItems,
      total: lowStockItems.length,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/products/:id/stock', async (req, res) => {
  try {
    const stockQuantity = Number.parseInt(req.body.stockQuantity, 10);
    const lowStockThreshold = req.body.lowStockThreshold === undefined
      ? undefined
      : Number.parseInt(req.body.lowStockThreshold, 10);

    if (!Number.isFinite(stockQuantity) || stockQuantity < 0) {
      return res.status(400).json({ error: 'stockQuantity must be a non-negative integer' });
    }

    if (lowStockThreshold !== undefined && (!Number.isFinite(lowStockThreshold) || lowStockThreshold < 0)) {
      return res.status(400).json({ error: 'lowStockThreshold must be a non-negative integer' });
    }

    const updates = { stockQuantity };
    if (lowStockThreshold !== undefined) updates.lowStockThreshold = lowStockThreshold;

    const product = await Product.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true })
      .populate('categoryId', 'name');

    if (!product) return res.status(404).json({ error: 'Product not found' });

    res.json({
      message: 'Stock updated successfully',
      item: toProductInventoryView(product),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Raw material inventory endpoints
router.get('/', async (req, res) => {
  try {
    const { category, search } = req.query;
    const filter = {};
    if (category && category !== 'all') filter.category = category;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
      ];
    }
    const items = await Inventory.find(filter).sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single item
router.get('/:id', async (req, res) => {
  try {
    const item = await findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Item not found' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create item
router.post('/', async (req, res) => {
  try {
    const id = generateInvId();
    const item = await Inventory.create({ ...req.body, id });
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update item
router.put('/:id', async (req, res) => {
  try {
    const existing = await findById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Item not found' });
    const item = await Inventory.findByIdAndUpdate(existing._id, req.body, { new: true });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete item
router.delete('/:id', async (req, res) => {
  try {
    const existing = await findById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Item not found' });
    await Inventory.findByIdAndDelete(existing._id);
    res.json({ message: 'Item deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
