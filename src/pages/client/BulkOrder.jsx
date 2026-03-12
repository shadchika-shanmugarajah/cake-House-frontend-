import React, { useState, useContext, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { ArrowLeft, Calendar, Clock, Package, AlertCircle, FileText, User, Mail, Phone, MessageSquare } from 'lucide-react';
import { CartContext } from '../../context/CartContext';
import { useOrders } from '../../context/OrderContext';
import { toast } from 'react-toastify';
import './BulkOrder.css';

const BulkOrder = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { clearCart } = useContext(CartContext);
  const { addBulkOrder } = useOrders();
  const orderDetails = location.state?.orderDetails;

  useEffect(() => {
    if (!user && orderDetails) {
      navigate('/auth', { state: { from: '/cart' } });
    }
  }, [user, orderDetails, navigate]);

  useEffect(() => {
    if (user?.email) {
      setCustomerName(user.name || '');
      setCustomerEmail(user.email || '');
      setCustomerPhone(user.phone || '');
    }
  }, []);

  const [customerName, setCustomerName] = useState(user?.name || '');
  const [customerEmail, setCustomerEmail] = useState(user?.email || '');
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '');
  const [preferredDate, setPreferredDate] = useState('');
  const [preferredTime, setPreferredTime] = useState('');
  const [alternateDate, setAlternateDate] = useState('');
  const [alternateTime, setAlternateTime] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!orderDetails) {
    return (
      <div className="bulk-order-page">
        <div className="bulk-order-container">
          <div className="bulk-order-empty">
            <h2>No order details found</h2>
            <p>Please go back to your cart and proceed to checkout.</p>
            <Link to="/cart" className="back-to-cart-link">Go to Cart</Link>
          </div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const getMinDate = () => {
    const minDate = new Date();
    minDate.setDate(minDate.getDate() + 3);
    return minDate.toISOString().split('T')[0];
  };

  const handleSubmit = (e) => {
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

    setTimeout(() => {
      const bulkOrder = addBulkOrder({
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

      setSubmitting(false);
      setSubmitted(true);
      clearCart();
      toast.success('Bulk order request submitted! We\'ll review and contact you.');

      setTimeout(() => {
        navigate('/order-success', {
          state: {
            order: bulkOrder,
            isBulk: true,
          }
        });
      }, 2000);
    }, 1500);
  };

  if (submitted) {
    return (
      <div className="bulk-order-page">
        <div className="bulk-order-container">
          <div className="bulk-submitted-card">
            <div className="bulk-submitted-icon">
              <Package size={60} />
            </div>
            <h2>Bulk Order Submitted!</h2>
            <p>Your request is being reviewed by our team. We'll contact you to confirm availability.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bulk-order-page">
      <div className="bulk-order-container">
        <button onClick={() => navigate('/cart')} className="bulk-back-btn">
          <ArrowLeft size={20} />
          Back to Cart
        </button>

        <div className="bulk-order-header">
          <Package size={36} />
          <h1>Bulk Order Request</h1>
          <p>Orders above 12 pieces require scheduling and admin approval</p>
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
                {orderDetails.items.map(item => (
                  <div key={item.id} className="bulk-item">
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
      </div>
    </div>
  );
};

export default BulkOrder;
