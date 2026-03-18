import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CalendarDays, CreditCard, MapPin, PackageCheck } from 'lucide-react';
import { ordersApi } from '../../api/api';
import OrderProgressBar from '../../components/client/OrderProgressBar';
import { toast } from 'react-toastify';
import './OrderTracking.css';

const formatCurrency = (value) => `Rs. ${Number(value || 0).toLocaleString()}`;

const formatAddress = (address = {}) => (
  [address.street, address.city, address.state, address.zipCode, address.country]
    .filter(Boolean)
    .join(', ') || 'Not provided'
);

const prettyStatus = (value) => {
  const normalized = String(value || 'pending').toLowerCase();
  if (normalized === 'pending') return 'Pending';
  if (normalized === 'packed') return 'Ready';
  return normalized
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const OrderTracking = () => {
  const { orderId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [order, setOrder] = useState(null);
  const [progress, setProgress] = useState(null);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const loadTracking = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await ordersApi.getTracking(orderId);
      setOrder(response?.order || null);
      setProgress(response?.progress || null);
    } catch (err) {
      setError(err.message || 'Failed to load order tracking details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    if (!cancelled) loadTracking();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  const orderTotal = useMemo(() => (
    order?.total ?? order?.totalAmount ?? 0
  ), [order]);

  if (loading) {
    return (
      <div className="order-tracking-page">
        <div className="order-tracking-card">
          <h1>Loading order tracking...</h1>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="order-tracking-page">
        <div className="order-tracking-card">
          <h1>Order not found</h1>
          <p>{error || 'We could not find this order in your account history.'}</p>
          <Link to="/profile?tab=orders" className="order-tracking-link">Go to My Orders</Link>
        </div>
      </div>
    );
  }

  const orderStatus = progress?.currentStatus || order.status || order.orderStatus || 'pending';
  const canCancelOrder = ['pending', 'ready', 'packed'].includes(orderStatus);

  const handleConfirmCancel = async () => {
    setCancelling(true);
    try {
      await ordersApi.cancel(order.orderId || order.id, cancelReason);
      toast.success('Order cancelled successfully');
      setCancelModalOpen(false);
      setCancelReason('');
      await loadTracking();
    } catch (err) {
      toast.error(err.message || 'Failed to cancel order');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="order-tracking-page">
      <div className="order-tracking-card">
        <div className="order-tracking-header">
          <div>
            <h1>Order Tracking</h1>
            <p>Track your order progress in real-time</p>
          </div>
          <PackageCheck size={28} />
        </div>

        <div className="order-tracking-summary">
          <div className="tracking-summary-item">
            <span>Order ID</span>
            <strong>{order.orderId || order.id}</strong>
          </div>
          <div className="tracking-summary-item">
            <span>Current Status</span>
            <strong>{prettyStatus(orderStatus)}</strong>
          </div>
          <div className="tracking-summary-item">
            <span>Delivery Date</span>
            <strong>{order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString() : 'Not selected'}</strong>
          </div>
        </div>

        <OrderProgressBar
          steps={progress?.steps || []}
          isCancelled={Boolean(progress?.isCancelled)}
        />

        <div className="order-tracking-actions">
          {canCancelOrder ? (
            <button className="order-cancel-btn" onClick={() => setCancelModalOpen(true)}>
              Cancel Order
            </button>
          ) : (
            <span className="order-cancel-note">
              Cancellation is allowed only for Pending or Ready orders.
            </span>
          )}
        </div>

        <div className="order-tracking-grid">
          <section>
            <h3>Product List</h3>
            <div className="order-tracking-items">
              {(order.items || []).map((item) => (
                <div key={item.id || item._id || item.productId} className="order-tracking-item">
                  <div>
                    <strong>{item.name || item.productName}</strong>
                    <p>Qty: {item.quantity}</p>
                  </div>
                  <span>{formatCurrency((item.price || 0) * (item.quantity || 1))}</span>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h3>Delivery & Payment</h3>
            <div className="order-tracking-meta">
              <p><CalendarDays size={15} /> Delivery Date: {order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString() : 'Not selected'}</p>
              <p><CalendarDays size={15} /> Delivery Slot: {order.deliverySlot || order.deliveryTime || 'Not selected'}</p>
              <p><CreditCard size={15} /> Payment Method: {prettyStatus(order.paymentMethod)}</p>
              <p><MapPin size={15} /> Delivery Address: {formatAddress(order.address)}</p>
              <p><strong>Total: {formatCurrency(orderTotal)}</strong></p>
            </div>
          </section>
        </div>

        <Link to="/profile?tab=orders" className="order-tracking-link">Back to My Orders</Link>
      </div>

      {cancelModalOpen && (
        <div className="order-cancel-modal-overlay" onClick={() => !cancelling && setCancelModalOpen(false)}>
          <div className="order-cancel-modal" onClick={(event) => event.stopPropagation()}>
            <h3>Cancel Order {order.orderId || order.id}</h3>
            <p>You can cancel only while order is Pending or Ready.</p>
            <textarea
              rows="3"
              value={cancelReason}
              onChange={(event) => setCancelReason(event.target.value)}
              placeholder="Reason (optional)"
            />
            <div className="order-cancel-modal-actions">
              <button className="order-cancel-btn secondary" onClick={() => setCancelModalOpen(false)} disabled={cancelling}>
                Keep Order
              </button>
              <button className="order-cancel-btn" onClick={handleConfirmCancel} disabled={cancelling}>
                {cancelling ? 'Cancelling...' : 'Confirm Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderTracking;
