import express from 'express';
import User from '../models/User.js';
import Admin from '../models/Admin.js';

const router = express.Router();

// Register customer
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, address } = req.body;
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      const updated = await User.findByIdAndUpdate(
        existing._id,
        { name, phone, address, password },
        { new: true }
      );
      return res.json({ user: { email: updated.email, name: updated.name, phone: updated.phone, address: updated.address } });
    }
    const user = await User.create({ name, email: email.toLowerCase(), password, phone: phone || '', address: address || '' });
    res.status(201).json({ user: { email: user.email, name: user.name, phone: user.phone, address: user.address } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login (customer or admin)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email: email.toLowerCase(), password });
    if (admin) {
      return res.json({
        type: 'admin',
        data: { email: admin.email, role: admin.role, isAuthenticated: true, token: `admin-${Date.now()}` },
      });
    }
    const user = await User.findOne({ email: email.toLowerCase(), password });
    if (user) {
      return res.json({
        type: 'user',
        data: {
          email: user.email,
          name: user.name,
          phone: user.phone,
          address: user.address,
          isAuthenticated: true,
          token: `user-${Date.now()}`,
        },
      });
    }
    res.status(401).json({ error: 'Invalid credentials' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
