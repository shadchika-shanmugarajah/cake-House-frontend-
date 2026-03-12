# Cake House Backend

Express + MongoDB API for Cake House.

## Setup

1. Install dependencies:
   ```bash
   cd backend && npm install
   ```

2. Create `.env` (copy from `.env.example` and add your MongoDB URI).
   **Important:** Never commit `.env` or share your MongoDB credentials.

3. **Email & SMS for bulk order notifications** (optional): When admin confirms or cancels a bulk order, customers get in-app notifications. To also send email and SMS, add to `.env`:
   - **Email:** SMTP_HOST, SMTP_USER, SMTP_PASS (e.g. Gmail App Password)
   - **SMS:** TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER

4. Seed admin users and products (optional):
   ```bash
   npm run seed
   ```
   Creates: admin@example.com / admin123, manager@example.com / manager123

5. Start server:
   ```bash
   npm run dev
   ```

## API Endpoints

- `POST /api/auth/register` - Register customer
- `POST /api/auth/login` - Login (customer or admin)
- `GET /api/users` - List customers (admin)
- `GET /api/products` - List products
- `POST /api/products` - Create product (admin)
- `PUT /api/products/:id` - Update product (admin)
- `DELETE /api/products/:id` - Delete product (admin)
- `GET /api/orders` - List orders (admin)
- `POST /api/orders` - Create order (checkout)
- `PATCH /api/orders/mark-viewed` - Mark orders viewed (admin)
- `GET /api/bulk-orders` - List bulk orders
- `POST /api/bulk-orders` - Create bulk order
- `PATCH /api/bulk-orders/:id/confirm` - Confirm bulk order (in-app + email + SMS)
- `PATCH /api/bulk-orders/:id/cancel` - Cancel bulk order (in-app + email + SMS)
- `GET /api/notifications/:email` - Get customer notifications
- `PATCH /api/notifications/:id/read` - Mark notification read
- `PATCH /api/notifications/mark-all-read/:email` - Mark all read
