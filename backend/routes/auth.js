import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { registerRules, loginRules, adminLoginRules, adminRegisterRules } from '../validators/authValidator.js';
import validate from '../middleware/validate.js';
import { verifyAdmin } from '../middleware/auth.js';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('FATAL: JWT_SECRET is not set in environment variables.');
  process.exit(1);
}

const router = express.Router();

// ──────────────────────────────────────────────
// USER: Register
// ──────────────────────────────────────────────
router.post('/register', registerRules, validate, async (req, res, next) => {
  try {
    const { name, email, password, phone, address } = req.body;

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists. Please login.' });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: 'user',
      phone: phone || '',
      addresses: address ? [{ label: 'Home', street: address, city: '', isDefault: true }] : [],
    });

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      user: { email: user.email, name: user.name, phone: user.phone, addresses: user.addresses },
      token,
    });
  } catch (err) {
    next(err);
  }
});

// ──────────────────────────────────────────────
// USER: Login
// ──────────────────────────────────────────────
router.post('/login', loginRules, validate, async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase(), role: 'user' }).select('+password');
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      type: 'user',
      data: {
        email: user.email,
        name: user.name,
        phone: user.phone,
        address: user.addresses?.find(a => a.isDefault)?.street || '',
        addresses: user.addresses,
        isAuthenticated: true,
        token,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ──────────────────────────────────────────────
// ADMIN: Register (bootstrap-friendly)
//   - First admin: no auth required
//   - Subsequent admins: existing admin token required
// ──────────────────────────────────────────────
router.post('/admin/register', adminRegisterRules, validate, async (req, res, next) => {
  try {
    // Check if any admin exists
    const adminCount = await User.countDocuments({ role: 'admin' });

    // If admins already exist, enforce admin auth
    if (adminCount > 0) {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Admin authentication required to create new admins.' });
      }
      try {
        const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
        if (decoded.role !== 'admin') {
          return res.status(403).json({ error: 'Only admins can create new admin accounts.' });
        }
      } catch (_) {
        return res.status(401).json({ error: 'Invalid or expired admin token.' });
      }
    }

    const { name, email, password } = req.body;

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const admin = await User.create({
      name: name || 'Admin',
      email: email.toLowerCase(),
      password,
      role: 'admin',
    });

    const token = jwt.sign(
      { id: admin._id, email: admin.email, role: admin.role },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.status(201).json({
      type: 'admin',
      data: { email: admin.email, name: admin.name, role: admin.role, token },
      message: adminCount === 0
        ? 'First admin account created successfully (no auth required for bootstrap).'
        : 'Admin account created successfully.',
    });
  } catch (err) {
    next(err);
  }
});

// ──────────────────────────────────────────────
// ADMIN: Login
// ──────────────────────────────────────────────
router.post('/admin/login', adminLoginRules, validate, async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const admin = await User.findOne({ email: email.toLowerCase(), role: 'admin' }).select('+password');
    if (!admin) {
      return res.status(401).json({ error: 'Invalid admin credentials' });
    }

    const isPasswordValid = await admin.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid admin credentials' });
    }

    const token = jwt.sign(
      { id: admin._id, email: admin.email, role: admin.role },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      type: 'admin',
      data: { email: admin.email, role: admin.role, isAuthenticated: true, token },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
