import express from 'express';
import Notification from '../models/Notification.js';

const router = express.Router();

// Get notifications for customer (by email)
router.get('/:email', async (req, res) => {
  try {
    const notifications = await Notification.find({ customerEmail: req.params.email })
      .sort({ createdAt: -1 });
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mark notification as read
router.patch('/:id/read', async (req, res) => {
  try {
    const notif = await Notification.findByIdAndUpdate(req.params.id, { read: true }, { new: true });
    if (!notif) return res.status(404).json({ error: 'Notification not found' });
    res.json(notif);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mark all as read for customer
router.patch('/mark-all-read/:email', async (req, res) => {
  try {
    await Notification.updateMany({ customerEmail: req.params.email }, { read: true });
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
