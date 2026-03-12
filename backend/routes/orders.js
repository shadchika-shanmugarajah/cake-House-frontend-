import express from 'express';
import Order from '../models/Order.js';

const router = express.Router();

const generateOrderId = () => `ORD-${Date.now().toString(36).toUpperCase()}`;

// Get all orders (admin)
router.get('/', async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create order (checkout)
router.post('/', async (req, res) => {
  try {
    const id = generateOrderId();
    const order = await Order.create({ ...req.body, id, status: 'completed', paymentStatus: 'paid', unread: true });
    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mark orders as viewed (admin)
router.patch('/mark-viewed', async (req, res) => {
  try {
    await Order.updateMany({}, { unread: false });
    res.json({ message: 'Orders marked as viewed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
