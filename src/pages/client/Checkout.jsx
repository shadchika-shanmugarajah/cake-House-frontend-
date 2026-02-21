import React, { useState, useContext } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { ShieldCheck, Lock, CreditCard, ArrowLeft, CheckCircle, Cake } from 'lucide-react';
import { CartContext } from '../../context/CartContext';
import { useOrders } from '../../context/OrderContext';
import { toast } from 'react-toastify';
import './Checkout.css';

const stripePromise = loadStripe('pk_test_51OpXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX');

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

const CheckoutForm = ({ orderDetails }) => {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const { clearCart } = useContext(CartContext);
  const { addOrder } = useOrders();
  const [processing, setProcessing] = useState(false);
  const [succeeded, setSucceeded] = useState(false);
  const [cardError, setCardError] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!customerName.trim() || !customerEmail.trim() || !customerPhone.trim()) {
      toast.error('Please fill in all customer details');
      return;
    }

    if (!stripe || !elements) return;

    setProcessing(true);
    setCardError('');

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

    // In production, send paymentMethod.id to your backend to create a PaymentIntent
    // For demo, we simulate a successful payment
    setTimeout(() => {
      const order = addOrder({
        ...orderDetails,
        customer: {
          name: customerName,
          email: customerEmail,
          phone: customerPhone,
        },
        paymentMethodId: paymentMethod.id,
        paymentMethod: 'Stripe',
      });

      setSucceeded(true);
      setProcessing(false);
      clearCart();
      toast.success('Payment successful! Order placed.');

      setTimeout(() => {
        navigate('/order-success', { state: { order } });
      }, 2000);
    }, 1500);
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

      <button
        type="submit"
        className="pay-btn"
        disabled={!stripe || processing}
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
  const orderDetails = location.state?.orderDetails;

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
            <Elements stripe={stripePromise}>
              <CheckoutForm orderDetails={orderDetails} />
            </Elements>
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

            <div className="checkout-test-info">
              <Cake size={16} />
              <div>
                <strong>Test Mode</strong>
                <p>Use card number <code>4242 4242 4242 4242</code> with any future date and CVC.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
