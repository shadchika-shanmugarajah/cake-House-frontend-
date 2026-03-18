import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import connectDB from './config/db.js';
import errorHandler from './middleware/errorHandler.js';

// Route imports
import authRoutes from './routes/auth.js';
import usersRoutes from './routes/users.js';
import productsRoutes from './routes/products.js';
import ordersRoutes from './routes/orders.js';
import bulkOrdersRoutes from './routes/bulkOrders.js';
import customOrdersRoutes from './routes/customOrders.js';
import notificationsRoutes from './routes/notifications.js';
import inventoryRoutes from './routes/inventory.js';
import categoriesRoutes from './routes/categories.js';
import analyticsRoutes from './routes/analytics.js';
import cartRoutes from './routes/cart.js';
import reviewsRoutes from './routes/reviews.js';
import { initNotificationRealtime } from './services/realtimeNotifications.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// ──────────────────────────────────────────────
// Security Middleware
// ──────────────────────────────────────────────
app.use(helmet());                      // Set security HTTP headers
app.use(mongoSanitize());               // Sanitize data against NoSQL injection
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));

// Rate limiting for auth endpoints (prevent brute-force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,                    // 20 attempts per window
  message: { error: 'Too many login attempts. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// General API rate limit
const isProduction = process.env.NODE_ENV === 'production';
const apiRateLimitWindowMs = Number(process.env.API_RATE_LIMIT_WINDOW_MS || (15 * 60 * 1000));
const apiRateLimitMax = Number(process.env.API_RATE_LIMIT_MAX || (isProduction ? 400 : 4000));

const apiLimiter = rateLimit({
  windowMs: apiRateLimitWindowMs,
  max: apiRateLimitMax,
  message: { error: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ──────────────────────────────────────────────
// Body Parsing
// ──────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// ──────────────────────────────────────────────
// API Routes
// ──────────────────────────────────────────────
app.get('/api', (req, res) => res.json({
  message: 'Cake House API',
  version: '1.0.0',
  endpoints: [
    '/api/auth',
    '/api/users',
    '/api/products',
    '/api/orders',
    '/api/bulk-orders',
    '/api/custom-orders',
    '/api/notifications',
    '/api/inventory',
    '/api/categories',
    '/api/analytics',
    '/api/cart',
    '/api/reviews',
    '/api/health',
  ],
}));

// Apply rate limiter to auth routes
app.use('/api/auth', authLimiter, authRoutes);

// Apply general rate limiter to all other API routes
app.use('/api/users', apiLimiter, usersRoutes);
app.use('/api/products', apiLimiter, productsRoutes);
app.use('/api/orders', apiLimiter, ordersRoutes);
app.use('/api/bulk-orders', apiLimiter, bulkOrdersRoutes);
app.use('/api/custom-orders', apiLimiter, customOrdersRoutes);
app.use('/api/notifications', apiLimiter, notificationsRoutes);
app.use('/api/inventory', apiLimiter, inventoryRoutes);
app.use('/api/categories', apiLimiter, categoriesRoutes);
app.use('/api/analytics', apiLimiter, analyticsRoutes);
app.use('/api/cart', apiLimiter, cartRoutes);
app.use('/api/reviews', apiLimiter, reviewsRoutes);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', uptime: process.uptime() }));

// Chrome DevTools - avoid 404
app.get('/.well-known/appspecific/com.chrome.devtools.json', (req, res) => res.json({}));

// ──────────────────────────────────────────────
// 404 Handler (unknown routes)
// ──────────────────────────────────────────────
app.all('*', (req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.originalUrl} not found` });
});

// ──────────────────────────────────────────────
// Global Error Handler
// ──────────────────────────────────────────────
app.use(errorHandler);

// ──────────────────────────────────────────────
// Start Server
// ──────────────────────────────────────────────
const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  const hasSmtp = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
  const hasTwilio = !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER);
  if (!hasSmtp && !hasTwilio) {
    console.log('Tip: Add SMTP_* and/or TWILIO_* to .env to send email/SMS when bulk orders are confirmed');
  }
});

initNotificationRealtime(server);

// Handle unhandled rejections
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION:', err.message);
});

process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err.message);
  process.exit(1);
});
