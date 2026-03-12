import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, Home, Store, Truck, Calendar, Clock, AlertTriangle, Package } from 'lucide-react';
import { CartContext } from '../../context/CartContext';
import { AuthContext } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import './Cart.css';

const BULK_ORDER_THRESHOLD = 12;

const Cart = () => {
  const { cartItems, removeFromCart, updateQuantity, clearCart } = useContext(CartContext);
  const { user } = useContext(AuthContext);
  const [deliveryOption, setDeliveryOption] = useState('delivery');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('');
  const [address, setAddress] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const navigate = useNavigate();

  const totalQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const isBulkOrder = totalQuantity > BULK_ORDER_THRESHOLD;

  const calculateSubtotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const calculateTax = () => {
    return calculateSubtotal() * 0.08;
  };

  const calculateShipping = () => {
    return deliveryOption === 'delivery' ? 5.00 : 0;
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax() + calculateShipping();
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    if (!user) {
      toast.info('Please login or register to proceed to payment');
      navigate('/auth', { state: { from: '/cart' } });
      return;
    }

    if (deliveryOption === 'delivery' && !address.trim()) {
      toast.error('Please enter delivery address');
      return;
    }

    if (!deliveryDate || !deliveryTime) {
      toast.error('Please select delivery/pickup date and time');
      return;
    }

    const orderDetails = {
      items: cartItems,
      deliveryOption,
      deliveryDate,
      deliveryTime,
      address,
      specialInstructions,
      subtotal: calculateSubtotal(),
      tax: calculateTax(),
      shipping: calculateShipping(),
      total: calculateTotal(),
      totalQuantity,
    };

    if (isBulkOrder) {
      navigate('/bulk-order', { state: { orderDetails } });
    } else {
      navigate('/checkout', { state: { orderDetails } });
    }
  };

  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  if (cartItems.length === 0) {
    return (
      <div className="cart-page">
        <div className="cart-container">
          <div className="empty-cart">
            <h2>Your cart is empty</h2>
            <p>Add some delicious cakes to your cart!</p>
            <Link to="/products" className="continue-shopping-btn">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="cart-container">
        <div className="cart-header">
          <h1>Shopping Cart</h1>
          <p>Review your order before checkout</p>
        </div>

        {isBulkOrder && (
          <div className="bulk-order-banner">
            <div className="bulk-order-banner-content">
              <AlertTriangle size={24} />
              <div>
                <h3>Bulk Order Detected ({totalQuantity} pieces)</h3>
                <p>Orders with more than {BULK_ORDER_THRESHOLD} pieces are considered bulk orders. 
                   You'll need to select a preferred date and time. Your order will be reviewed by our team for availability confirmation.</p>
              </div>
            </div>
            <Package size={32} className="bulk-order-banner-icon" />
          </div>
        )}

        <div className="cart-layout">
          <div className="cart-left">
            <div className="cart-items-section">
              <h2>Your Items ({cartItems.length})</h2>
              {cartItems.map(item => (
                <div key={item.id} className="cart-item">
                  <img src={item.image} alt={item.name} className="cart-item-image" />
                  <div className="cart-item-info">
                    <h3>{item.name}</h3>
                    <p className="cart-item-category">{item.category}</p>
                    <p className="cart-item-price">${item.price.toFixed(2)}</p>
                    <div className="cart-item-quantity">
                      <button 
                        className="quantity-btn" 
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      >
                        <Minus size={14} />
                      </button>
                      <span className="quantity-display">{item.quantity}</span>
                      <button 
                        className="quantity-btn" 
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="cart-item-total">
                    <span>${(item.price * item.quantity).toFixed(2)}</span>
                    <button 
                      onClick={() => removeFromCart(item.id)} 
                      className="remove-btn"
                      title="Remove item"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="delivery-section">
              <h2>Delivery Options</h2>
              <div className="delivery-options">
                <label className={`delivery-option ${deliveryOption === 'delivery' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="delivery"
                    value="delivery"
                    checked={deliveryOption === 'delivery'}
                    onChange={(e) => setDeliveryOption(e.target.value)}
                  />
                  <div className="option-content">
                    <Truck size={24} />
                    <div>
                      <h3>Delivery</h3>
                      <p>We'll deliver to your address</p>
                      <span className="option-price">$5.00</span>
                    </div>
                  </div>
                </label>

                <label className={`delivery-option ${deliveryOption === 'takeaway' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="delivery"
                    value="takeaway"
                    checked={deliveryOption === 'takeaway'}
                    onChange={(e) => setDeliveryOption(e.target.value)}
                  />
                  <div className="option-content">
                    <Store size={24} />
                    <div>
                      <h3>Takeaway</h3>
                      <p>Pick up from our store</p>
                      <span className="option-price">FREE</span>
                    </div>
                  </div>
                </label>
              </div>

              {deliveryOption === 'delivery' && (
                <div className="address-section">
                  <h3>Delivery Address</h3>
                  <div className="input-with-icon">
                    <Home size={20} />
                    <textarea
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Enter your full delivery address"
                      rows="3"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="datetime-section">
                <h3>Select Date & Time</h3>
                <div className="datetime-inputs">
                  <div className="input-with-icon">
                    <Calendar size={20} />
                    <input
                      type="date"
                      value={deliveryDate}
                      onChange={(e) => setDeliveryDate(e.target.value)}
                      min={getTomorrowDate()}
                      required
                    />
                  </div>
                  <div className="input-with-icon">
                    <Clock size={20} />
                    <select
                      value={deliveryTime}
                      onChange={(e) => setDeliveryTime(e.target.value)}
                      required
                    >
                      <option value="">Select Time</option>
                      <option value="10:00">10:00 AM</option>
                      <option value="12:00">12:00 PM</option>
                      <option value="14:00">2:00 PM</option>
                      <option value="16:00">4:00 PM</option>
                      <option value="18:00">6:00 PM</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="instructions-section">
                <h3>Special Instructions</h3>
                <textarea
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  placeholder="Any special requests or instructions for your order..."
                  rows="3"
                />
              </div>
            </div>
          </div>

          <div className="cart-summary">
            <h2>Order Summary</h2>
            
            <div className="summary-details">
              <div className="summary-row">
                <span>Subtotal ({totalQuantity} items)</span>
                <span>${calculateSubtotal().toFixed(2)}</span>
              </div>
              
              <div className="summary-row">
                <span>Tax (8%)</span>
                <span>${calculateTax().toFixed(2)}</span>
              </div>
              
              <div className="summary-row">
                <span>Shipping</span>
                <span>${calculateShipping().toFixed(2)}</span>
              </div>
              
              <div className="summary-row total">
                <span>Total</span>
                <span>${calculateTotal().toFixed(2)}</span>
              </div>
            </div>

            {isBulkOrder ? (
              <div className="order-note bulk-note">
                <p>📦 This is a <strong>bulk order</strong> ({totalQuantity} pieces)</p>
                <p>📋 Your order will be sent for admin approval</p>
                <p>📞 We'll contact you once availability is confirmed</p>
              </div>
            ) : (
              <div className="order-note">
                <p>🕒 Orders require 24 hours advance notice for preparation</p>
                <p>📞 We'll contact you to confirm your order</p>
              </div>
            )}

            <div className="checkout-actions">
              <button onClick={handleCheckout} className={`checkout-btn ${isBulkOrder ? 'bulk-checkout-btn' : ''}`}>
                {isBulkOrder ? 'Request Bulk Order' : 'Proceed to Checkout'}
              </button>
              
              <button onClick={clearCart} className="clear-cart-btn">
                Clear Cart
              </button>
              
              <Link to="/products" className="continue-shopping-btn">
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
