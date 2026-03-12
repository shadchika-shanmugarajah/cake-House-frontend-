import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import connectDB from './config/db.js';
import authRoutes from './routes/auth.js';
import usersRoutes from './routes/users.js';
import productsRoutes from './routes/products.js';
import ordersRoutes from './routes/orders.js';
import bulkOrdersRoutes from './routes/bulkOrders.js';
import notificationsRoutes from './routes/notifications.js';
import inventoryRoutes from './routes/inventory.js';

const app = express();
const PORT = process.env.PORT || 5000;

connectDB();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.get('/api', (req, res) => res.json({ message: 'Cake House API', endpoints: ['/api/auth', '/api/users', '/api/products', '/api/orders', '/api/bulk-orders', '/api/notifications', '/api/inventory', '/api/health'] }));
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/bulk-orders', bulkOrdersRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/inventory', inventoryRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Chrome DevTools probes this - return empty to avoid 404
app.get('/.well-known/appspecific/com.chrome.devtools.json', (req, res) => res.json({}));

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  const hasSmtp = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
  const hasTwilio = !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER);
  if (!hasSmtp && !hasTwilio) {
    console.log('Tip: Add SMTP_* and/or TWILIO_* to .env to send email/SMS when bulk orders are confirmed');
  }
});
