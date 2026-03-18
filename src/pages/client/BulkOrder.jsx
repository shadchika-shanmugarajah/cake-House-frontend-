import React, { useState, useContext, useEffect, useMemo } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { ArrowLeft, Calendar, Clock, Package, AlertCircle, FileText, User, Mail, Phone, MessageSquare } from 'lucide-react';
import { CartContext } from '../../context/CartContext';
import { useOrders } from '../../context/OrderContext';
import { toast } from 'react-toastify';
import './BulkOrder.css';

const BULK_ORDER_THRESHOLD = 12;

const BulkOrder = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { clearCart } = useContext(CartContext);
  const { addBulkOrder, bulkOrders } = useOrders();
  const orderDetails = location.state?.orderDetails;

  useEffect(() => {
    if (!user && orderDetails) {
      navigate('/login', { state: { from: '/cart' } });
    }
  }, [user, orderDetails, navigate]);

  const [customerName, setCustomerName] = useState(user?.name || '');
  const [customerEmail, setCustomerEmail] = useState(user?.email || '');
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '');
  const [preferredDate, setPreferredDate] = useState('');
  const [preferredTime, setPreferredTime] = useState('');
  const [alternateDate, setAlternateDate] = useState('');
  const [alternateTime, setAlternateTime] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const totalQuantity = Number(orderDetails?.totalQuantity || 0);
  const myBulkOrders = useMemo(() => {
    if (!user) return [];
    return [...bulkOrders]
      .filter((order) => {
        const byEmail = String(order.customer?.email || order.customerEmail || '').toLowerCase() === String(user.email || '').toLowerCase();
        const byUserId = String(order.userId || '') === String(user.id || '');
        return byEmail || byUserId;
      })
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }, [bulkOrders, user]);

  const formatStatus = (value) => String(value || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());

  const getStatusClass = (value) => {
    const status = String(value || '').toLowerCase();
    if (status === 'rejected') return 'rejected';
    if (status === 'delivered') return 'delivered';
    if (status === 'awaiting_admin_acceptance' || status === 'pending') return 'pending';
    if (status === 'awaiting_user_payment' || status === 'approved') return 'approved';
    return 'progress';
  };

  const hasOrderDetails = Boolean(orderDetails);
  const showBulkForm = hasOrderDetails && totalQuantity >= BULK_ORDER_THRESHOLD;
  const showThresholdWarning = hasOrderDetails && totalQuantity < BULK_ORDER_THRESHOLD;

  if (!user && hasOrderDetails) return null;

  const getMinDate = () => {
    const minDate = new Date();
    minDate.setDate(minDate.getDate() + 3);
    return minDate.toISOString().split('T')[0];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!customerName.trim() || !customerEmail.trim() || !customerPhone.trim()) {
      toast.error('Please fill in all customer details');
      return;
    }

    if (!preferredDate || !preferredTime) {
      toast.error('Please select preferred date and time for your bulk order');
      return;
    }

    setSubmitting(true);

    try {
      const response = await addBulkOrder({
        ...orderDetails,
        customer: {
          name: customerName,
          email: customerEmail,
          phone: customerPhone,
        },
        preferredDate,
        preferredTime,
        alternateDate: alternateDate || null,
        alternateTime: alternateTime || null,
        additionalNotes,
      });

      const bulkOrder = response?.order || response;
      const bulkOrderId = bulkOrder?.id || bulkOrder?.bulkOrderId;

      setSubmitting(false);
      clearCart();
      toast.success('Bulk Order Request Sent');
      toast.info('Waiting for Admin Acceptance');
      if (bulkOrderId) {
        navigate(`/bulk-orders/${bulkOrderId}/tracking`, { replace: true });
      } else {
        navigate('/profile?tab=orders', { replace: true });
      }
    } catch (err) {
      setSubmitting(false);
      toast.error(err?.message || 'Failed to submit bulk order');
    }
  };

  return (
    <div className="bulk-order-page">
      <div className="bulk-order-container">
        {showBulkForm ? (
          <>
            <button onClick={() => navigate('/cart')} className="bulk-back-btn">
              <ArrowLeft size={20} />
              Back to Cart
            </button>

            <div className="bulk-order-header">
              <Package size={36} />
              <h1>Bulk Order Request</h1>
              <p>Orders with 12 or more pieces require scheduling and admin acceptance</p>
            </div>

            <div className="bulk-info-banner">
              <AlertCircle size={20} />
              <div>
                <strong>How Bulk Orders Work</strong>
                <ul>
                  <li>Submit your order request with preferred date & time</li>
                  <li>Our team reviews availability for your requested date</li>
                  <li>You'll receive a confirmation or alternative suggestion</li>
                  <li>Payment is collected after confirmation</li>
                </ul>
              </div>
            </div>

            <div className="bulk-order-layout">
              <form onSubmit={handleSubmit} className="bulk-order-form">
                <div className="bulk-form-section">
                  <h3>
                    <User size={20} />
                    Customer Information
                  </h3>
                  <div className="bulk-form-group">
                    <label>Full Name *</label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Your full name"
                      required
                    />
                  </div>
                  <div className="bulk-form-row">
                    <div className="bulk-form-group">
                      <label><Mail size={14} /> Email *</label>
                      <input
                        type="email"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        placeholder="your@email.com"
                        required
                      />
                    </div>
                    <div className="bulk-form-group">
                      <label><Phone size={14} /> Phone *</label>
                      <input
                        type="tel"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="+1 234 567 890"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="bulk-form-section">
                  <h3>
                    <Calendar size={20} />
                    Preferred Schedule *
                  </h3>
                  <p className="bulk-form-hint">Bulk orders require at least 3 days advance notice</p>
                  <div className="bulk-form-row">
                    <div className="bulk-form-group">
                      <label><Calendar size={14} /> Preferred Date *</label>
                      <input
                        type="date"
                        value={preferredDate}
                        onChange={(e) => setPreferredDate(e.target.value)}
                        min={getMinDate()}
                        required
                      />
                    </div>
                    <div className="bulk-form-group">
                      <label><Clock size={14} /> Preferred Time *</label>
                      <select
                        value={preferredTime}
                        onChange={(e) => setPreferredTime(e.target.value)}
                        required
                      >
                        <option value="">Select Time</option>
                        <option value="09:00">9:00 AM</option>
                        <option value="10:00">10:00 AM</option>
                        <option value="11:00">11:00 AM</option>
                        <option value="12:00">12:00 PM</option>
                        <option value="13:00">1:00 PM</option>
                        <option value="14:00">2:00 PM</option>
                        <option value="15:00">3:00 PM</option>
                        <option value="16:00">4:00 PM</option>
                        <option value="17:00">5:00 PM</option>
                        <option value="18:00">6:00 PM</option>
                      </select>
                    </div>
                  </div>

                  <h4 className="bulk-alternate-title">Alternate Date (Optional)</h4>
                  <div className="bulk-form-row">
                    <div className="bulk-form-group">
                      <label>Alternate Date</label>
                      <input
                        type="date"
                        value={alternateDate}
                        onChange={(e) => setAlternateDate(e.target.value)}
                        min={getMinDate()}
                      />
                    </div>
                    <div className="bulk-form-group">
                      <label>Alternate Time</label>
                      <select
                        value={alternateTime}
                        onChange={(e) => setAlternateTime(e.target.value)}
                      >
                        <option value="">Select Time</option>
                        <option value="09:00">9:00 AM</option>
                        <option value="10:00">10:00 AM</option>
                        <option value="11:00">11:00 AM</option>
                        <option value="12:00">12:00 PM</option>
                        <option value="13:00">1:00 PM</option>
                        <option value="14:00">2:00 PM</option>
                        <option value="15:00">3:00 PM</option>
                        <option value="16:00">4:00 PM</option>
                        <option value="17:00">5:00 PM</option>
                        <option value="18:00">6:00 PM</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="bulk-form-section">
                  <h3>
                    <MessageSquare size={20} />
                    Additional Notes
                  </h3>
                  <div className="bulk-form-group">
                    <textarea
                      value={additionalNotes}
                      onChange={(e) => setAdditionalNotes(e.target.value)}
                      placeholder="Any specific requirements, customizations, or special requests for your bulk order..."
                      rows="4"
                    />
                  </div>
                </div>

                <button type="submit" className="bulk-submit-btn" disabled={submitting}>
                  {submitting ? (
                    <span className="bulk-btn-loading">
                      <span className="bulk-spinner"></span>
                      Submitting Request...
                    </span>
                  ) : (
                    <span>
                      <FileText size={20} />
                      Submit Bulk Order Request
                    </span>
                  )}
                </button>
              </form>

              <div className="bulk-order-sidebar">
                <div className="bulk-summary-card">
                  <h3>Order Summary</h3>
                  <div className="bulk-items-list">
                    {orderDetails.items.map((item) => (
                      <div key={item.id || item.productId || item.name} className="bulk-item">
                        <img src={item.image} alt={item.name} className="bulk-item-img" />
                        <div className="bulk-item-info">
                          <span className="bulk-item-name">{item.name}</span>
                          <span className="bulk-item-qty">x{item.quantity}</span>
                        </div>
                        <span className="bulk-item-price">
                          ${(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="bulk-summary-rows">
                    <div className="bulk-summary-row">
                      <span>Total Items</span>
                      <span className="bulk-quantity-badge">{orderDetails.totalQuantity} pieces</span>
                    </div>
                    <div className="bulk-summary-row">
                      <span>Subtotal</span>
                      <span>${orderDetails.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="bulk-summary-row">
                      <span>Tax (8%)</span>
                      <span>${orderDetails.tax.toFixed(2)}</span>
                    </div>
                    <div className="bulk-summary-row">
                      <span>Shipping</span>
                      <span>${orderDetails.shipping.toFixed(2)}</span>
                    </div>
                    <div className="bulk-summary-row total">
                      <span>Estimated Total</span>
                      <span>${orderDetails.total.toFixed(2)}</span>
                    </div>
                  </div>

                  <p className="bulk-payment-note">
                    * Payment will be collected after admin confirms your order
                  </p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="bulk-order-empty">
            {!user ? (
              <>
                <h2>Sign in to view bulk orders</h2>
                <p>Please log in to access your bulk order requests.</p>
                <Link to="/login" className="back-to-cart-link">Go to Login</Link>
              </>
            ) : showThresholdWarning ? (
              <>
                <h2>Not a bulk order yet</h2>
                <p>Bulk orders require quantity of {BULK_ORDER_THRESHOLD} or more items.</p>
                <Link to="/cart" className="back-to-cart-link">Go to Cart</Link>
              </>
            ) : (
              <>
                <h2>Create a bulk order from cart</h2>
                <p>Add items to cart with quantity {BULK_ORDER_THRESHOLD}+ and continue to bulk checkout.</p>
                <Link to="/cart" className="back-to-cart-link">Go to Cart</Link>
              </>
            )}
          </div>
        )}

        {user && (
          <div className="bulk-history-section">
            <div className="bulk-history-header">
              <h2>Your Bulk Orders</h2>
              <span>{myBulkOrders.length} order{myBulkOrders.length !== 1 ? 's' : ''}</span>
            </div>

            {myBulkOrders.length === 0 ? (
              <p className="bulk-history-empty">No bulk orders found yet.</p>
            ) : (
              <div className="bulk-history-list">
                {myBulkOrders.map((order) => {
                  const orderId = order.bulkOrderId || order.id;
                  const status = order.approvalStatus || order.status || 'awaiting_admin_acceptance';
                  const total = Number(order.totalAmount || order.total || 0);
                  const deliveryDate = order.requestedDeliveryDate || order.preferredDate;
                  return (
                    <div key={order._id || orderId} className="bulk-history-card">
                      <div className="bulk-history-top">
                        <div>
                          <h4>{orderId}</h4>
                          <p>Created: {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '-'}</p>
                        </div>
                        <span className={`bulk-history-status ${getStatusClass(status)}`}>
                          {formatStatus(status)}
                        </span>
                      </div>

                      <div className="bulk-history-meta">
                        <span>Quantity: <strong>{order.totalQuantity || 0}</strong></span>
                        <span>Total: <strong>${total.toFixed(2)}</strong></span>
                        <span>Delivery: <strong>{deliveryDate ? new Date(deliveryDate).toLocaleDateString() : '-'}</strong></span>
                      </div>

                      <div className="bulk-history-actions">
                        <Link to={`/bulk-orders/${orderId}/tracking`} className="bulk-history-track-btn">
                          Track Order
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BulkOrder;
