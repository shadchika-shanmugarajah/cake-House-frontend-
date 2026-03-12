import express from 'express';
import mongoose from 'mongoose';
import Inventory from '../models/Inventory.js';

const router = express.Router();

const generateInvId = () => `INV-${String(Date.now()).slice(-6)}`;

const findById = (id) => {
  if (mongoose.Types.ObjectId.isValid(id) && String(new mongoose.Types.ObjectId(id)) === id) {
    return Inventory.findOne({ $or: [{ id }, { _id: id }] });
  }
  return Inventory.findOne({ id });
};

// Get all inventory items
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
