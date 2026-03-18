import express from 'express';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import Order from '../models/Order.js';
import Review from '../models/Review.js';
import { verifyUser, verifyAdmin } from '../middleware/auth.js';
import { createProductRules, updateProductRules, stockUpdateRules, reviewRules } from '../validators/productValidator.js';
import validate from '../middleware/validate.js';
import upload from '../middleware/upload.js';
import { PAGINATION } from '../utils/constants.js';

const router = express.Router();

// ──────────────────────────────────────────────
// GET /  —  List products (public, paginated)
// ──────────────────────────────────────────────
router.get('/', async (req, res, next) => {
  try {
    const filter = { isActive: true };

    // Category filter (by ID or name)
    if (req.query.category && req.query.category !== 'all') {
      // Try as ObjectId first, fallback to name lookup
      if (req.query.category.match(/^[0-9a-fA-F]{24}$/)) {
        filter.categoryId = req.query.category;
      } else {
        const cat = await Category.findOne({ name: { $regex: new RegExp(`^${req.query.category}$`, 'i') } });
        if (cat) filter.categoryId = cat._id;
      }
    }

    // Search
    if (req.query.search) {
      filter.$or = [
        { productName: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } },
      ];
    }

    // Featured filter
    if (req.query.featured === 'true') filter.featured = true;

    const page = parseInt(req.query.page) || PAGINATION.DEFAULT_PAGE;
    const limit = Math.min(parseInt(req.query.limit) || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);
    const skip = (page - 1) * limit;

    // Sort
    let sort = { createdAt: -1 };
    if (req.query.sort === 'price_asc') sort = { price: 1 };
    if (req.query.sort === 'price_desc') sort = { price: -1 };
    if (req.query.sort === 'rating') sort = { averageRating: -1 };
    if (req.query.sort === 'name') sort = { productName: 1 };

    const [products, total] = await Promise.all([
      Product.find(filter).populate('categoryId', 'name').sort(sort).skip(skip).limit(limit),
      Product.countDocuments(filter),
    ]);

    res.json({
      products,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
});

// ──────────────────────────────────────────────
// GET /:id  —  Single product (public)
// ──────────────────────────────────────────────
router.get('/:id', async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).populate('categoryId', 'name');
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (err) {
    next(err);
  }
});

// ──────────────────────────────────────────────
// GET /:id/related  —  Related products (same category)
// ──────────────────────────────────────────────
router.get('/:id/related', async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const related = await Product.find({
      categoryId: product.categoryId,
      _id: { $ne: product._id },
      isActive: true,
    })
      .populate('categoryId', 'name')
      .sort({ averageRating: -1 })
      .limit(parseInt(req.query.limit) || 4);

    res.json(related);
  } catch (err) {
    next(err);
  }
});

// ──────────────────────────────────────────────
// GET /:id/reviews  —  Product reviews (public)
// ──────────────────────────────────────────────
router.get('/:id/reviews', async (req, res, next) => {
  try {
    const reviews = await Review.find({ productId: req.params.id })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    next(err);
  }
});

// ──────────────────────────────────────────────
// POST /  —  Create product (admin, with image)
// ──────────────────────────────────────────────
router.post('/', verifyAdmin, upload.single('image'), createProductRules, validate, async (req, res, next) => {
  try {
    // Validate category exists
    const category = await Category.findById(req.body.categoryId);
    if (!category) return res.status(400).json({ error: 'Category does not exist' });

    const parsedLowStockThreshold = Number.parseInt(req.body.lowStockThreshold, 10);

    const productData = {
      productName: req.body.productName,
      categoryId: req.body.categoryId,
      price: parseFloat(req.body.price),
      description: req.body.description || '',
      stockQuantity: parseInt(req.body.stockQuantity) || 0,
      lowStockThreshold: Number.isFinite(parsedLowStockThreshold) ? parsedLowStockThreshold : 10,
      featured: req.body.featured === 'true' || req.body.featured === true,
      weight: req.body.weight || '',
      preparationTime: req.body.preparationTime || '',
      tags: req.body.tags ? (typeof req.body.tags === 'string' ? req.body.tags.split(',').map(t => t.trim()) : req.body.tags) : [],
    };

    // Handle image: uploaded file or URL
    if (req.file) {
      productData.image = `/uploads/products/${req.file.filename}`;
    } else if (req.body.image) {
      productData.image = req.body.image;
    }

    const product = await Product.create(productData);
    const populated = await Product.findById(product._id).populate('categoryId', 'name');
    res.status(201).json(populated);
  } catch (err) {
    next(err);
  }
});

// ──────────────────────────────────────────────
// PUT /:id  —  Update product (admin, with image)
// ──────────────────────────────────────────────
router.put('/:id', verifyAdmin, upload.single('image'), updateProductRules, validate, async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    // Validate category if changed
    if (req.body.categoryId) {
      const category = await Category.findById(req.body.categoryId);
      if (!category) return res.status(400).json({ error: 'Category does not exist' });
    }

    const updates = {};
    if (req.body.productName !== undefined) updates.productName = req.body.productName;
    if (req.body.categoryId !== undefined) updates.categoryId = req.body.categoryId;
    if (req.body.price !== undefined) updates.price = parseFloat(req.body.price);
    if (req.body.description !== undefined) updates.description = req.body.description;
    if (req.body.stockQuantity !== undefined) updates.stockQuantity = parseInt(req.body.stockQuantity);
    if (req.body.lowStockThreshold !== undefined) updates.lowStockThreshold = parseInt(req.body.lowStockThreshold);
    if (req.body.featured !== undefined) updates.featured = req.body.featured === 'true' || req.body.featured === true;
    if (req.body.weight !== undefined) updates.weight = req.body.weight;
    if (req.body.preparationTime !== undefined) updates.preparationTime = req.body.preparationTime;
    if (req.body.isActive !== undefined) updates.isActive = req.body.isActive === 'true' || req.body.isActive === true;
    if (req.body.tags) updates.tags = typeof req.body.tags === 'string' ? req.body.tags.split(',').map(t => t.trim()) : req.body.tags;

    // Handle image
    if (req.file) {
      updates.image = `/uploads/products/${req.file.filename}`;
    } else if (req.body.image !== undefined) {
      updates.image = req.body.image;
    }

    const updated = await Product.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true })
      .populate('categoryId', 'name');
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// ──────────────────────────────────────────────
// DELETE /:id  —  Delete product (admin)
// ──────────────────────────────────────────────
router.delete('/:id', verifyAdmin, async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    next(err);
  }
});

// ──────────────────────────────────────────────
// PATCH /:id/stock  —  Update stock only (admin)
// ──────────────────────────────────────────────
router.patch('/:id/stock', verifyAdmin, stockUpdateRules, validate, async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { stockQuantity: parseInt(req.body.stockQuantity) },
      { new: true, runValidators: true }
    ).populate('categoryId', 'name');

    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (err) {
    next(err);
  }
});

// ──────────────────────────────────────────────
// POST /:id/reviews  —  Add review (user)
// ──────────────────────────────────────────────
router.post('/:id/reviews', verifyUser, reviewRules, validate, async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    // Only customers with delivered orders containing this product can submit a review.
    const deliveredOrder = await Order.findOne({
      userId: req.user.id,
      orderStatus: 'delivered',
      'items.productId': product._id,
    }).sort({ createdAt: -1 });

    if (!deliveredOrder) {
      return res.status(403).json({
        error: 'Only users who purchased and received this product can rate it',
      });
    }

    const existingReview = await Review.findOne({
      userId: req.user.id,
      productId: req.params.id,
    });

    let review;
    let message;

    if (existingReview) {
      existingReview.rating = Number(req.body.rating);
      existingReview.comment = req.body.comment;
      existingReview.title = req.body.title || existingReview.title || '';
      existingReview.orderId = deliveredOrder._id;
      existingReview.isVerifiedPurchase = true;
      review = await existingReview.save();
      message = 'Review updated successfully';
    } else {
      review = await Review.create({
        userId: req.user.id,
        productId: req.params.id,
        orderId: deliveredOrder._id,
        rating: Number(req.body.rating),
        comment: req.body.comment,
        title: req.body.title || '',
        isVerifiedPurchase: true,
      });
      message = 'Review submitted successfully';
    }

    const updated = await Product.findById(req.params.id).populate('categoryId', 'name');
    res.status(existingReview ? 200 : 201).json({
      message,
      review,
      product: updated,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'You have already reviewed this product' });
    }
    next(err);
  }
});

export default router;
