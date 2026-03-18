import express from 'express';
import Category from '../models/Category.js';
import Product from '../models/Product.js';
import { verifyAdmin } from '../middleware/auth.js';
import { createCategoryRules, updateCategoryRules } from '../validators/categoryValidator.js';
import validate from '../middleware/validate.js';

const router = express.Router();

// ──────────────────────────────────────────────
// GET /  —  List all categories (public)
// ──────────────────────────────────────────────
router.get('/', async (req, res, next) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 });

    // Attach product count per category
    const Product_ = (await import('../models/Product.js')).default;
    const counts = await Product_.aggregate([
      { $group: { _id: '$categoryId', count: { $sum: 1 } } },
    ]);
    const countMap = {};
    counts.forEach(c => { countMap[c._id?.toString()] = c.count; });

    const result = categories.map(cat => ({
      ...cat.toObject(),
      productCount: countMap[cat._id.toString()] || 0,
    }));

    res.json(result);
  } catch (err) {
    next(err);
  }
});

// ──────────────────────────────────────────────
// GET /:id  —  Get single category
// ──────────────────────────────────────────────
router.get('/:id', async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ error: 'Category not found' });
    res.json(category);
  } catch (err) {
    next(err);
  }
});

// ──────────────────────────────────────────────
// POST /  —  Create category (admin only)
// ──────────────────────────────────────────────
router.post('/', verifyAdmin, createCategoryRules, validate, async (req, res, next) => {
  try {
    const { name, description, image } = req.body;

    // Case-insensitive duplicate check
    const existing = await Category.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
    });
    if (existing) {
      return res.status(409).json({ error: `Category "${existing.name}" already exists` });
    }

    const category = await Category.create({
      name: name.trim(),
      description: description || '',
      image: image || '',
    });

    res.status(201).json(category);
  } catch (err) {
    next(err);
  }
});

// ──────────────────────────────────────────────
// PUT /:id  —  Update category (admin only)
// ──────────────────────────────────────────────
router.put('/:id', verifyAdmin, updateCategoryRules, validate, async (req, res, next) => {
  try {
    const { name, description, image } = req.body;

    // If renaming, check for duplicates (exclude self)
    if (name) {
      const duplicate = await Category.findOne({
        _id: { $ne: req.params.id },
        name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
      });
      if (duplicate) {
        return res.status(409).json({ error: `Category "${duplicate.name}" already exists` });
      }
    }

    const updates = {};
    if (name !== undefined) updates.name = name.trim();
    if (description !== undefined) updates.description = description;
    if (image !== undefined) updates.image = image;

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    if (!category) return res.status(404).json({ error: 'Category not found' });
    res.json(category);
  } catch (err) {
    next(err);
  }
});

// ──────────────────────────────────────────────
// DELETE /:id  —  Delete category (admin only)
//   Safe deletion: if products exist, block or
//   move them based on ?force=true query param
// ──────────────────────────────────────────────
router.delete('/:id', verifyAdmin, async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ error: 'Category not found' });

    // Check how many products reference this category
    const productCount = await Product.countDocuments({ categoryId: req.params.id });

    if (productCount > 0 && req.query.force !== 'true') {
      return res.status(400).json({
        error: `Cannot delete: ${productCount} product(s) are in this category. Use ?force=true to move them to Uncategorized and delete.`,
        productCount,
      });
    }

    // If forced, move products to "Uncategorized" category
    if (productCount > 0) {
      let uncategorized = await Category.findOne({ name: 'Uncategorized' });
      if (!uncategorized) {
        uncategorized = await Category.create({ name: 'Uncategorized', description: 'Products moved from deleted categories' });
      }
      await Product.updateMany(
        { categoryId: req.params.id },
        { categoryId: uncategorized._id }
      );
    }

    await Category.findByIdAndDelete(req.params.id);
    res.json({ message: 'Category deleted successfully', movedProducts: productCount });
  } catch (err) {
    next(err);
  }
});

export default router;
