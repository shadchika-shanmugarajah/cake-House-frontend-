import React, { useCallback } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { CheckCircle, Package, Calendar, Clock, Home, ShoppingBag, Download } from 'lucide-react';
import './OrderSuccess.css';

const OrderSuccess = () => {
  const location = useLocation();
  const order = location.state?.order;
  const isBulk = location.state?.isBulk;

  const downloadReceipt = useCallback(() => {
    if (!order) return;
    const deliveryDate = order.preferredDate || order.deliveryDate || '—';
    const deliveryTime = order.preferredTime || order.deliveryTime || '—';
    const itemsHtml = (order.items || []).map(item =>
      `<tr><td>${item.name}</td><td>${item.quantity}</td><td>LKR ${(item.price || 0).toFixed(2)}</td><td>LKR ${((item.price || 0) * (item.quantity || 1)).toFixed(2)}</td></tr>`
    ).join('');
    const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Receipt - ${order.id}</title>
<style>body{font-family:Arial,sans-serif;max-width:500px;margin:40px auto;padding:20px}
table{width:100%;border-collapse:collapse;margin:20px 0}
th,td{border:1px solid #ddd;padding:10px;text-align:left}
th{background:#f5f5f5}.total{font-weight:bold;font-size:1.2em}
h1{color:#e91e63;border-bottom:2px solid #e91e63;padding-bottom:10px}
.receipt-header{text-align:center;margin-bottom:30px}
</style></head>
<body>
<div class="receipt-header"><h1>🎂 Cake House</h1><p>Order Receipt</p></div>
<p><strong>Order ID:</strong> ${order.id}</p>
<p><strong>Date:</strong> ${order.createdAt ? new Date(order.createdAt).toLocaleString() : new Date().toLocaleString()}</p>
${order.customer ? `<p><strong>Customer:</strong> ${order.customer.name}</p><p><strong>Email:</strong> ${order.customer.email}</p><p><strong>Phone:</strong> ${order.customer.phone || '—'}</p>` : ''}
<p><strong>Delivery Date:</strong> ${deliveryDate}</p>
<p><strong>Delivery Time:</strong> ${deliveryTime}</p>
<table><thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead><tbody>${itemsHtml}</tbody></table>
<p class="total">Total Paid: LKR ${order.total?.toFixed(2) || '0.00'}</p>
<p><strong>Status:</strong> ${isBulk ? 'Awaiting Admin Acceptance' : 'Payment Confirmed'}</p>
<p style="margin-top:40px;font-size:12px;color:#666">Thank you for your order! — Cake House</p>
</body></html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CakeHouse-Receipt-${order.id}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }, [order, isBulk]);

  if (!order) {
    return (
      <div className="success-page">
        <div className="success-container">
          <div className="success-card">
            <CheckCircle size={60} className="success-icon" />
            <h1>Order Placed!</h1>
            <p>Thank you for your order.</p>
            <Link to="/products" className="success-btn">Continue Shopping</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="success-page">
      <div className="success-container">
        <div className="success-card">
          <div className="success-icon-wrapper">
            {isBulk ? <Package size={70} /> : <CheckCircle size={70} />}
          </div>

          <h1>{isBulk ? 'Bulk Order Submitted!' : 'Order Confirmed!'}</h1>
          <p className="success-subtitle">
            {isBulk
              ? 'Your bulk order request has been submitted for review.'
              : 'Your payment was successful and your order is being prepared.'}
          </p>

          <div className="success-order-id">
            <span>Order ID</span>
            <strong>{order.id}</strong>
          </div>

          {isBulk && (
            <div className="success-info-banner">
              <Package size={20} />
              <div>
                <strong>What happens next?</strong>
                <p>Our team will review your order and check availability for your preferred date.
                   You'll receive a confirmation or an alternative suggestion via email/phone.</p>
              </div>
            </div>
          )}

          <div className="success-details-grid">
            {order.preferredDate && (
              <div className="success-detail">
                <Calendar size={18} />
                <div>
                  <label>Preferred Date</label>
                  <span>{order.preferredDate}</span>
                </div>
              </div>
            )}
            {order.preferredTime && (
              <div className="success-detail">
                <Clock size={18} />
                <div>
                  <label>Preferred Time</label>
                  <span>{order.preferredTime}</span>
                </div>
              </div>
            )}
            {order.deliveryDate && !order.preferredDate && (
              <div className="success-detail">
                <Calendar size={18} />
                <div>
                  <label>Delivery Date</label>
                  <span>{order.deliveryDate}</span>
                </div>
              </div>
            )}
            {order.deliveryTime && !order.preferredTime && (
              <div className="success-detail">
                <Clock size={18} />
                <div>
                  <label>Delivery Time</label>
                  <span>{order.deliveryTime}</span>
                </div>
              </div>
            )}
          </div>

          <div className="success-total-row">
            <span>{isBulk ? 'Estimated Total' : 'Total Paid'}</span>
            <span className="success-total-amount">LKR {order.total?.toFixed(2)}</span>
          </div>

          <div className="success-status-badge" data-status={order.status}>
            {isBulk ? 'Awaiting Admin Acceptance' : 'Payment Confirmed'}
          </div>

          <button onClick={downloadReceipt} className="success-download-btn">
            <Download size={18} />
            Download Receipt
          </button>

          <div className="success-actions">
            <Link to="/products" className="success-btn primary">
              <ShoppingBag size={18} />
              Continue Shopping
            </Link>
            <Link to="/" className="success-btn secondary">
              <Home size={18} />
              Go Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;
