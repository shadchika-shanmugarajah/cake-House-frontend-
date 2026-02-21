import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { CheckCircle, Package, Calendar, Clock, Home, ShoppingBag } from 'lucide-react';
import './OrderSuccess.css';

const OrderSuccess = () => {
  const location = useLocation();
  const order = location.state?.order;
  const isBulk = location.state?.isBulk;

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
            <span className="success-total-amount">${order.total?.toFixed(2)}</span>
          </div>

          <div className="success-status-badge" data-status={order.status}>
            {isBulk ? 'Pending Admin Approval' : 'Payment Confirmed'}
          </div>

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
