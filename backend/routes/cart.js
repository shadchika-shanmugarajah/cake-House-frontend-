import express from 'express';
import mongoose from 'mongoose';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import { verifyUser } from '../middleware/auth.js';

const router = express.Router();

// All cart routes require authentication
router.use(verifyUser);

// ──────────────────────────────────────────────
// GET /  —  Get current user's cart
// ──────────────────────────────────────────────
router.get('/', async (req, res, next) => {
  try {
    let cart = await Cart.findOne({ userId: req.user.id })
      .populate('items.productId', 'productName price image stockQuantity categoryId');

    if (!cart) {
      cart = await Cart.create({ userId: req.user.id, items: [] });
    }

    res.json(cart);
  } catch (err) {
    next(err);
  }
});

// ──────────────────────────────────────────────
// POST /items  —  Add item to cart
// ──────────────────────────────────────────────
router.post('/items', async (req, res, next) => {
  try {
    const { productId, quantity = 1 } = req.body;
    const parsedQty = Number(quantity);

    if (!productId) return res.status(400).json({ error: 'productId is required' });
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ error: 'Invalid productId format' });
    }
    if (!Number.isInteger(parsedQty) || parsedQty < 1) {
      return res.status(400).json({ error: 'Quantity must be a whole number of at least 1' });
    }

    // Validate product exists and has stock
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    if (product.stockQuantity < parsedQty) {
      return res.status(400).json({
        error: `Only ${product.stockQuantity} items available in stock`,
        availableStock: product.stockQuantity,
      });
    }

    let cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) {
      cart = new Cart({ userId: req.user.id, items: [] });
    }

    // Check if item already in cart
    const existingIdx = cart.items.findIndex(
      i => i.productId.toString() === productId
    );

    if (existingIdx >= 0) {
      const newQty = cart.items[existingIdx].quantity + parsedQty;
      if (newQty > product.stockQuantity) {
        return res.status(400).json({
          error: `Cannot add more. Stock limit: ${product.stockQuantity}, already in cart: ${cart.items[existingIdx].quantity}`,
          availableStock: product.stockQuantity,
        });
      }
      cart.items[existingIdx].quantity = newQty;
      cart.items[existingIdx].price = product.price;
    } else {
      cart.items.push({
        productId: product._id,
        productName: product.productName,
        price: product.price,
        quantity: parsedQty,
        image: product.image || '',
      });
    }

    await cart.save();

    const populated = await Cart.findById(cart._id)
      .populate('items.productId', 'productName price image stockQuantity categoryId');
    res.status(201).json(populated);
  } catch (err) {
    next(err);
  }
});

// ──────────────────────────────────────────────
// PUT /items/:itemId  —  Update item quantity
// ──────────────────────────────────────────────
router.put('/items/:itemId', async (req, res, next) => {
  try {
    const { quantity } = req.body;
    const parsedQty = Number(quantity);
    if (!Number.isInteger(parsedQty) || parsedQty < 0) {
      return res.status(400).json({ error: 'Quantity must be a whole number of 0 or more' });
    }

    const cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) return res.status(404).json({ error: 'Cart not found' });

    const item = cart.items.id(req.params.itemId);
    if (!item) return res.status(404).json({ error: 'Cart item not found' });

    // If quantity is 0, remove the item
    if (parsedQty === 0) {
      cart.items.pull(req.params.itemId);
      await cart.save();
      const populated = await Cart.findById(cart._id)
        .populate('items.productId', 'productName price image stockQuantity categoryId');
      return res.json(populated);
    }

    // Validate stock
    const product = await Product.findById(item.productId);
    if (product && parsedQty > product.stockQuantity) {
      return res.status(400).json({
        error: `Only ${product.stockQuantity} items available in stock`,
        availableStock: product.stockQuantity,
      });
    }

    item.quantity = parsedQty;
    if (product) item.price = product.price; // Sync latest price
    await cart.save();

    const populated = await Cart.findById(cart._id)
      .populate('items.productId', 'productName price image stockQuantity categoryId');
    res.json(populated);
  } catch (err) {
    next(err);
  }
});

// ──────────────────────────────────────────────
// DELETE /items/:itemId  —  Remove item from cart
// ──────────────────────────────────────────────
router.delete('/items/:itemId', async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) return res.status(404).json({ error: 'Cart not found' });

    const item = cart.items.id(req.params.itemId);
    if (!item) return res.status(404).json({ error: 'Cart item not found' });

    cart.items.pull(req.params.itemId);
    await cart.save();

    const populated = await Cart.findById(cart._id)
      .populate('items.productId', 'productName price image stockQuantity categoryId');
    res.json(populated);
  } catch (err) {
    next(err);
  }
});

// ──────────────────────────────────────────────
// DELETE /  —  Clear entire cart
// ──────────────────────────────────────────────
router.delete('/', async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) return res.status(404).json({ error: 'Cart not found' });

    cart.items = [];
    cart.couponCode = null;
    await cart.save();

    res.json(cart);
  } catch (err) {
    next(err);
  }
});

export default router;
