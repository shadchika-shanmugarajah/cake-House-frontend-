import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { customOrdersApi } from '../../api/api';
import './CustomOrderPayment.css';

const formatMoney = (value) => `LKR ${Number(value || 0).toFixed(2)}`;
const formatDate = (value) => (value ? new Date(value).toLocaleDateString() : '-');
const ORDER_LOCK_MESSAGE = 'Your order is already in progress and can no longer be modified or cancelled.';

const CustomOrderPayment = () => {
  const { customOrderId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [customOrder, setCustomOrder] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('online');
  const [confirmation, setConfirmation] = useState(null);

  useEffect(() => {
    const load = async () => {
      if (!customOrderId) return;
      setLoading(true);
      try {
        const response = await customOrdersApi.getMineById(customOrderId);
        const item = response?.item || null;
        setCustomOrder(item);
        if (item?.paymentMethod) {
          setPaymentMethod(item.paymentMethod);
        }
      } catch (err) {
        toast.error(err.message || 'Unable to load custom order payment');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [customOrderId]);

  const status = String(customOrder?.status || '').toLowerCase();
  const quotedPrice = Number(customOrder?.adminQuote?.quotedPrice || 0);
  const isLockedForChanges = useMemo(() => (
    ['in_progress', 'ready', 'out_for_delivery', 'delivered'].includes(status)
  ), [status]);
  const canPay = useMemo(() => (
    ['price_accepted', 'awaiting_user_payment'].includes(status) && quotedPrice > 0
  ), [quotedPrice, status]);

  const handleConfirmPayment = async () => {
    if (!customOrderId || !canPay) return;

    setPlacing(true);
    try {
      const paymentPayload = paymentMethod === 'online'
        ? {
          provider: 'online_stub',
          transactionId: `SIM-${Date.now()}`,
          metadata: { channel: 'custom_order_payment_page' },
        }
        : {
          provider: 'cash_on_delivery',
          metadata: { channel: 'custom_order_payment_page' },
        };

      const response = await customOrdersApi.confirmPayment(customOrderId, {
        paymentMethod,
        payment: paymentPayload,
      });

      setConfirmation(response);
      setCustomOrder((prev) => ({
        ...(prev || {}),
        status: response?.customOrderStatus || 'in_progress',
        paymentMethod: response?.paymentMethod || paymentMethod,
        paymentStatus: response?.paymentStatus || 'paid',
        generatedOrderId: response?.orderId || prev?.generatedOrderId || '',
      }));

      toast.success(response?.message || 'Payment confirmed');
    } catch (err) {
      toast.error(err.message || 'Failed to confirm payment');
    } finally {
      setPlacing(false);
    }
  };

  if (loading) {
    return (
      <div className="custom-payment-page">
        <div className="custom-payment-card">Loading custom order payment details...</div>
      </div>
    );
  }

  if (!customOrder) {
    return (
      <div className="custom-payment-page">
        <div className="custom-payment-card">
          <h2>Custom Order Not Found</h2>
          <p>We could not find this custom order for your account.</p>
          <button className="custom-payment-btn secondary" onClick={() => navigate('/profile?tab=custom-orders')}>
            Back to Custom Orders
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="custom-payment-page">
      <div className="custom-payment-card">
        <h1>Custom Cake Payment</h1>
        <p className="custom-payment-subtitle">
          Confirm payment for custom order <strong>{customOrder.requestId || customOrder.id}</strong>
        </p>

        <div className="custom-payment-summary">
          <div><span>Status</span><strong>{status.replace(/_/g, ' ') || '-'}</strong></div>
          <div><span>Quote Amount</span><strong>{quotedPrice > 0 ? formatMoney(quotedPrice) : 'Pending quote'}</strong></div>
          <div><span>Preparation Time</span><strong>{customOrder.adminQuote?.preparationDays ? `${customOrder.adminQuote.preparationDays} days` : '-'}</strong></div>
          <div><span>Delivery Date</span><strong>{formatDate(customOrder.userConfirmation?.details?.deliveryDate)}</strong></div>
        </div>

        {customOrder.adminQuote?.quoteNotes && (
          <p className="custom-payment-note"><strong>Admin Notes:</strong> {customOrder.adminQuote.quoteNotes}</p>
        )}

        {!canPay ? (
          <div className="custom-payment-blocked">
            <p>{isLockedForChanges ? ORDER_LOCK_MESSAGE : 'Payment is enabled only after you accept the admin price quote.'}</p>
            <Link to="/profile?tab=custom-orders" className="custom-payment-btn secondary">Go to Custom Orders</Link>
          </div>
        ) : (
          <div className="custom-payment-methods">
            <label>
              <input
                type="radio"
                name="custom-order-payment-method"
                checked={paymentMethod === 'online'}
                onChange={() => setPaymentMethod('online')}
              />
              Online Payment
            </label>
            <label>
              <input
                type="radio"
                name="custom-order-payment-method"
                checked={paymentMethod === 'cash_on_delivery'}
                onChange={() => setPaymentMethod('cash_on_delivery')}
              />
              Cash on Delivery
            </label>

            <button className="custom-payment-btn" onClick={handleConfirmPayment} disabled={placing}>
              {placing ? 'Confirming...' : 'Confirm Payment & Start Order'}
            </button>
          </div>
        )}

        {confirmation?.orderId && (
          <div className="custom-payment-confirmation">
            <p><strong>Order Confirmed:</strong> {confirmation.orderId}</p>
            <p><strong>Payment Status:</strong> {confirmation.paymentStatus}</p>
            <p><strong>Order Status:</strong> {confirmation.orderStatus || confirmation.customOrderStatus}</p>
            <Link className="custom-payment-btn secondary" to={`/orders/${confirmation.orderId}/tracking`}>
              Track Order
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomOrderPayment;
