import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CheckCircle2, CreditCard, Package, Truck, Wallet } from 'lucide-react';
import { useOrders } from '../../context/OrderContext';
import { toast } from 'react-toastify';
import './BulkOrderTracking.css';

const formatCurrency = (value) => `Rs. ${Number(value || 0).toLocaleString()}`;
const formatStatus = (value) => String(value || '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
const ORDER_LOCK_MESSAGE = 'Your order is already in progress and can no longer be modified or cancelled.';

const BulkOrderTracking = () => {
  const { bulkOrderId } = useParams();
  const { getBulkOrderTracking, setBulkOrderPaymentMethod } = useOrders();

  const [loading, setLoading] = useState(true);
  const [savingPayment, setSavingPayment] = useState(false);
  const [order, setOrder] = useState(null);
  const [progress, setProgress] = useState(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('cash_on_delivery');
  const [error, setError] = useState('');

  const loadTracking = async () => {
    if (!bulkOrderId) return;
    setLoading(true);
    setError('');
    try {
      const data = await getBulkOrderTracking(bulkOrderId);
      const trackedOrder = data?.order || null;
      setOrder(trackedOrder);
      setProgress(data?.progress || null);
      if (trackedOrder?.paymentMethod) {
        setSelectedPaymentMethod(trackedOrder.paymentMethod);
      }
    } catch (err) {
      setError(err.message || 'Failed to load bulk order tracking');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTracking();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bulkOrderId]);

  const rawOrderStatus = String(order?.approvalStatus || order?.status || '').toLowerCase();
  const orderStatus = rawOrderStatus === 'pending' || rawOrderStatus === 'pending_approval'
    ? 'awaiting_admin_acceptance'
    : rawOrderStatus === 'approved'
      ? 'awaiting_user_payment'
      : rawOrderStatus === 'completed'
        ? 'delivered'
        : rawOrderStatus;
  const canChoosePayment = useMemo(() => (
    orderStatus === 'awaiting_user_payment'
  ), [orderStatus]);
  const isLockedForChanges = useMemo(() => (
    ['in_progress', 'ready', 'out_for_delivery', 'delivered'].includes(orderStatus)
  ), [orderStatus]);

  const handlePaymentSave = async () => {
    if (!canChoosePayment) return;
    try {
      setSavingPayment(true);
      const data = await setBulkOrderPaymentMethod(order.id || order.bulkOrderId, selectedPaymentMethod);
      setOrder(data?.order || order);
      setProgress(data?.progress || progress);
      toast.success('Payment method saved');
    } catch (err) {
      toast.error(err.message || 'Failed to save payment method');
    } finally {
      setSavingPayment(false);
    }
  };

  if (loading) {
    return (
      <div className="bulk-track-page">
        <div className="bulk-track-card">
          <h2>Loading bulk order tracking...</h2>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="bulk-track-page">
        <div className="bulk-track-card">
          <h2>Bulk order not found</h2>
          <p>{error || 'Unable to load this bulk order.'}</p>
          <Link to="/profile?tab=orders" className="bulk-track-link">Back to Profile</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bulk-track-page">
      <div className="bulk-track-card">
        <div className="bulk-track-header">
          <div>
            <h1>Bulk Order Tracking</h1>
            <p>Order ID: <strong>{order.bulkOrderId || order.id}</strong></p>
          </div>
          <Package size={32} />
        </div>

        {progress?.waitingForApproval && (
          <div className="bulk-track-banner waiting">
            <strong>Bulk Order Request Sent</strong>
            <span>Waiting for Admin Acceptance</span>
          </div>
        )}

        {progress?.isRejected && (
          <div className="bulk-track-banner rejected">
            <strong>Bulk Order Rejected</strong>
            <span>Please contact support for more details.</span>
          </div>
        )}

        {orderStatus === 'awaiting_user_payment' && !progress?.isRejected && (
          <div className="bulk-track-banner approved">
            <strong>Admin accepted your bulk order</strong>
            <span>Please choose your payment method to start preparation.</span>
          </div>
        )}

        {!progress?.waitingForApproval && !progress?.isRejected && orderStatus !== 'awaiting_user_payment' && (
          <div className="bulk-track-banner approved">
            <strong>Bulk order in progress</strong>
            <span>You can track updates until delivery.</span>
          </div>
        )}

        <div className="bulk-track-steps">
          {(progress?.steps || []).map((step) => (
            <div
              key={step.key}
              className={`bulk-track-step ${step.completed ? 'completed' : ''} ${step.active ? 'active' : ''}`}
            >
              <CheckCircle2 size={16} />
              <span>{step.label}</span>
            </div>
          ))}
        </div>

        <div className="bulk-track-grid">
          <section className="bulk-track-panel">
            <h3><Truck size={16} /> Delivery</h3>
            <p>Status: <strong>{formatStatus(order.approvalStatus || order.status)}</strong></p>
            <p>Requested Date: <strong>{order.preferredDate || (order.requestedDeliveryDate ? new Date(order.requestedDeliveryDate).toLocaleDateString() : '-')}</strong></p>
            <p>Delivery Slot: <strong>{order.deliverySlot || order.preferredTime || '-'}</strong></p>
            <p>Total Quantity: <strong>{order.totalQuantity || 0}</strong></p>
            <p>Total Amount: <strong>{formatCurrency(order.totalAmount || order.total)}</strong></p>
          </section>

          <section className="bulk-track-panel">
            <h3><CreditCard size={16} /> Payment</h3>
            {canChoosePayment ? (
              <>
                <label className="bulk-pay-option">
                  <input
                    type="radio"
                    name="bulkPaymentMethod"
                    value="online"
                    checked={selectedPaymentMethod === 'online'}
                    onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                  />
                  <span><CreditCard size={14} /> Online Payment</span>
                </label>
                <label className="bulk-pay-option">
                  <input
                    type="radio"
                    name="bulkPaymentMethod"
                    value="cash_on_delivery"
                    checked={selectedPaymentMethod === 'cash_on_delivery'}
                    onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                  />
                  <span><Wallet size={14} /> Cash on Delivery</span>
                </label>
                <button
                  type="button"
                  className="bulk-pay-save-btn"
                  onClick={handlePaymentSave}
                  disabled={savingPayment}
                >
                  {savingPayment ? 'Saving...' : 'Save Payment Method'}
                </button>
              </>
            ) : (
              <p>{isLockedForChanges ? ORDER_LOCK_MESSAGE : 'Payment will be available after admin acceptance.'}</p>
            )}

            <p>Selected Method: <strong>{formatStatus(order.paymentMethod || 'not selected')}</strong></p>
            <p>Payment Status: <strong>{formatStatus(order.paymentStatus)}</strong></p>
          </section>
        </div>

        <section className="bulk-track-panel">
          <h3>Items</h3>
          <div className="bulk-track-items">
            {(order.items || []).map((item) => (
              <div key={item._id || item.id || item.productId} className="bulk-track-item">
                <span>{item.productName || item.name} x{item.quantity}</span>
                <span>{formatCurrency((item.price || 0) * (item.quantity || 1))}</span>
              </div>
            ))}
          </div>
        </section>

        <Link to="/profile?tab=orders" className="bulk-track-link">Back to Profile</Link>
      </div>
    </div>
  );
};

export default BulkOrderTracking;
