import React, { useState, useContext, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { ShieldCheck, Lock, CreditCard, ArrowLeft, CheckCircle, Cake } from 'lucide-react';
import { CartContext } from '../../context/CartContext';
import { useOrders } from '../../context/OrderContext';
import { toast } from 'react-toastify';
import './Checkout.css';

const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
const stripePromise = stripePublishableKey && !stripePublishableKey.includes('XXXX')
  ? loadStripe(stripePublishableKey)
  : null;

const CARD_ELEMENT_OPTIONS = {
  hidePostalCode: true,
  style: {
    base: {
      fontSize: '16px',
      color: '#424770',
      fontFamily: '"Poppins", sans-serif',
      '::placeholder': { color: '#aab7c4' },
      padding: '12px',
    },
    invalid: {
      color: '#ff6b8a',
      iconColor: '#ff6b8a',
    },
  },
};

const CheckoutFormWithStripe = ({ orderDetails }) => {
  const stripe = useStripe();
  const elements = useElements();
  return <CheckoutForm orderDetails={orderDetails} isDemoMode={false} stripe={stripe} elements={elements} />;
};

const CheckoutForm = ({ orderDetails, isDemoMode, stripe, elements }) => {
  const navigate = useNavigate();
  const { clearCart } = useContext(CartContext);
  const { addOrder } = useOrders();
  const [processing, setProcessing] = useState(false);
  const [succeeded, setSucceeded] = useState(false);
  const [cardError, setCardError] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  const completePayment = (paymentMethod = 'Demo') => {
    const order = addOrder({
      ...orderDetails,
      customer: {
        name: customerName,
        email: customerEmail,
        phone: customerPhone,
      },
      paymentMethodId: isDemoMode ? 'demo_pm_123' : 'pm_stripe',
      paymentMethod,
    });
    setSucceeded(true);
    setProcessing(false);
    clearCart();
    toast.success('Payment successful! Order placed.');
    setTimeout(() => {
      navigate('/order-success', { state: { order } });
    }, 2000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!customerName.trim() || !customerEmail.trim() || !customerPhone.trim()) {
      toast.error('Please fill in all customer details');
      return;
    }

    setProcessing(true);
    setCardError('');

    if (isDemoMode) {
      setTimeout(() => completePayment('Demo'), 1500);
      return;
    }

    if (!stripe || !elements) return;

    const cardElement = elements.getElement(CardElement);
    const { error, paymentMethod } = await stripe.createPaymentMethod({
      type: 'card',
      card: cardElement,
      billing_details: {
        name: customerName,
        email: customerEmail,
        phone: customerPhone,
      },
    });

    if (error) {
      setCardError(error.message);
      setProcessing(false);
      return;
    }

    setTimeout(() => completePayment('Stripe'), 1500);
  };

  if (succeeded) {
    return (
      <div className="checkout-success">
        <div className="success-animation">
          <CheckCircle size={80} />
        </div>
        <h2>Payment Successful!</h2>
        <p>Your order has been placed. Redirecting...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="checkout-form">
      <div className="checkout-form-section">
        <h3>Customer Details</h3>
        <div className="form-group">
          <label>Full Name</label>
          <input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="John Doe"
            required
          />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              placeholder="john@example.com"
              required
            />
          </div>
          <div className="form-group">
            <label>Phone</label>
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

      {!isDemoMode && (
        <div className="checkout-form-section">
          <h3>
            <CreditCard size={20} />
            Payment Information
          </h3>
          <div className="stripe-card-wrapper">
            <CardElement options={CARD_ELEMENT_OPTIONS} />
          </div>
          {cardError && <div className="card-error">{cardError}</div>}
          <div className="secure-badge">
            <Lock size={14} />
            <span>Secured by Stripe - Your card details are encrypted</span>
          </div>
        </div>
      )}

      {isDemoMode && (
        <div className="checkout-form-section demo-payment-section">
          <h3>
            <CreditCard size={20} />
            Demo Payment
          </h3>
          <div className="demo-payment-info">
            <p>No Stripe API key configured. Use demo mode to complete a sample payment.</p>
            <p>Add <code>VITE_STRIPE_PUBLISHABLE_KEY</code> to .env for real payments.</p>
          </div>
        </div>
      )}

      <button
        type="submit"
        className="pay-btn"
        disabled={(!isDemoMode && !stripe) || processing}
      >
        {processing ? (
          <span className="btn-loading">
            <span className="spinner"></span>
            Processing Payment...
          </span>
        ) : (
          <span>Pay ${orderDetails?.total?.toFixed(2)}</span>
        )}
      </button>
    </form>
  );
};

const Checkout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const orderDetails = location.state?.orderDetails;

  useEffect(() => {
    if (!user && orderDetails) {
      navigate('/auth', { state: { from: '/cart' } });
    }
  }, [user, orderDetails, navigate]);

  if (!orderDetails) {
    return (
      <div className="checkout-page">
        <div className="checkout-container">
          <div className="checkout-empty">
            <h2>No order details found</h2>
            <p>Please go back to your cart and proceed to checkout.</p>
            <Link to="/cart" className="back-to-cart-btn">Go to Cart</Link>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="checkout-page">
      <div className="checkout-container">
        <button onClick={() => navigate('/cart')} className="checkout-back-btn">
          <ArrowLeft size={20} />
          Back to Cart
        </button>

        <div className="checkout-header">
          <ShieldCheck size={32} />
          <h1>Secure Checkout</h1>
          <p>Complete your payment to place your order</p>
        </div>

        <div className="checkout-layout">
          <div className="checkout-left">
            {stripePromise ? (
              <Elements stripe={stripePromise}>
                <CheckoutFormWithStripe orderDetails={orderDetails} />
              </Elements>
            ) : (
              <CheckoutForm orderDetails={orderDetails} isDemoMode={true} stripe={null} elements={null} />
            )}
          </div>

          <div className="checkout-right">
            <div className="checkout-summary-card">
              <h3>Order Summary</h3>
              <div className="checkout-items-list">
                {orderDetails.items.map(item => (
                  <div key={item.id} className="checkout-item">
                    <img src={item.image} alt={item.name} className="checkout-item-img" />
                    <div className="checkout-item-info">
                      <span className="checkout-item-name">{item.name}</span>
                      <span className="checkout-item-qty">x{item.quantity}</span>
                    </div>
                    <span className="checkout-item-price">
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="checkout-summary-rows">
                <div className="checkout-summary-row">
                  <span>Subtotal</span>
                  <span>${orderDetails.subtotal.toFixed(2)}</span>
                </div>
                <div className="checkout-summary-row">
                  <span>Tax (8%)</span>
                  <span>${orderDetails.tax.toFixed(2)}</span>
                </div>
                <div className="checkout-summary-row">
                  <span>Shipping</span>
                  <span>${orderDetails.shipping.toFixed(2)}</span>
                </div>
                <div className="checkout-summary-row total">
                  <span>Total</span>
                  <span>${orderDetails.total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="checkout-delivery-info">
              <h4>Delivery Details</h4>
              <p><strong>Type:</strong> {orderDetails.deliveryOption === 'delivery' ? 'Home Delivery' : 'Takeaway'}</p>
              <p><strong>Date:</strong> {orderDetails.deliveryDate}</p>
              <p><strong>Time:</strong> {orderDetails.deliveryTime}</p>
              {orderDetails.address && <p><strong>Address:</strong> {orderDetails.address}</p>}
            </div>

            {stripePromise && (
              <div className="checkout-test-info">
                <Cake size={16} />
                <div>
                  <strong>Test Mode</strong>
                  <p>Use card number <code>4242 4242 4242 4242</code> with any future date and CVC.</p>
                </div>
              </div>
            )}
            {!stripePromise && (
              <div className="checkout-test-info demo-mode">
                <Cake size={16} />
                <div>
                  <strong>Demo Mode</strong>
                  <p>Sample payment - no card required. Add Stripe key to .env for real payments.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
