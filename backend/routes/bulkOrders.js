import express from 'express';
import BulkOrder from '../models/BulkOrder.js';
import Notification from '../models/Notification.js';
import { notifyBulkOrderUpdate } from '../services/notificationService.js';

const router = express.Router();

const generateBulkId = () => `BULK-${Date.now().toString(36).toUpperCase()}`;

// Get all bulk orders (admin)
router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    const orders = await BulkOrder.find(filter).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create bulk order
router.post('/', async (req, res) => {
  try {
    const id = generateBulkId();
    const order = await BulkOrder.create({ ...req.body, id, status: 'pending_approval', paymentStatus: 'pending', isBulk: true });
    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Confirm bulk order (admin) - sends in-app, email & SMS notification to customer
router.patch('/:id/confirm', async (req, res) => {
  try {
    const order = await BulkOrder.findOne({ id: req.params.id });
    if (!order) return res.status(404).json({ error: 'Bulk order not found' });
    order.status = 'confirmed';
    order.updatedAt = new Date();
    await order.save();
    const message = `Your bulk order ${order.id} has been confirmed! We'll contact you for payment.`;
    if (order.customer?.email) {
      await Notification.create({
        customerEmail: order.customer.email,
        orderId: order.id,
        message,
        type: 'bulk_confirmed',
      });
      console.log(`[bulk] In-app notification created for ${order.customer.email}`);
    } else {
      console.warn('[bulk] No customer email on order - in-app notification skipped');
    }
    // Send email & SMS (if configured in .env)
    await notifyBulkOrderUpdate({
      customer: order.customer,
      orderId: order.id,
      status: 'confirmed',
      message,
    });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Cancel bulk order (admin) - sends in-app, email & SMS notification
router.patch('/:id/cancel', async (req, res) => {
  try {
    const order = await BulkOrder.findOne({ id: req.params.id });
    if (!order) return res.status(404).json({ error: 'Bulk order not found' });
    order.status = 'cancelled';
    order.updatedAt = new Date();
    await order.save();
    const message = `Your bulk order ${order.id} has been cancelled. Please contact us if you have questions.`;
    if (order.customer?.email) {
      await Notification.create({
        customerEmail: order.customer.email,
        orderId: order.id,
        message,
        type: 'bulk_cancelled',
      });
    }
    // Send email & SMS (if configured in .env)
    await notifyBulkOrderUpdate({
      customer: order.customer,
      orderId: order.id,
      status: 'cancelled',
      message,
    });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
