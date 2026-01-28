import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, Home, Store, Truck, Calendar, Clock } from 'lucide-react';
import { CartContext } from '../../context/CartContext';
import { toast } from 'react-toastify';
import './Cart.css';

const Cart = () => {
  const { cartItems, removeFromCart, updateQuantity, clearCart } = useContext(CartContext);
  const [deliveryOption, setDeliveryOption] = useState('delivery');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('');
  const [address, setAddress] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const navigate = useNavigate();

  // Calculate totals
  const calculateSubtotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const calculateTax = () => {
    return calculateSubtotal() * 0.08; // 8% tax
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

    if (deliveryOption === 'delivery' && !address.trim()) {
      toast.error('Please enter delivery address');
      return;
    }

    if (!deliveryDate || !deliveryTime) {
      toast.error('Please select delivery/pickup date and time');
      return;
    }

    // In real app, process checkout
    toast.success('Order placed successfully!');
    clearCart();
    navigate('/');
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

        <div className="cart-layout">
          {/* Left Column - Cart Items */}
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

            {/* Delivery Options */}
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

              {/* Delivery Address */}
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

              {/* Date & Time Selection */}
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

              {/* Special Instructions */}
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

          {/* Right Column - Order Summary */}
          <div className="cart-summary">
            <h2>Order Summary</h2>
            
            <div className="summary-details">
              <div className="summary-row">
                <span>Subtotal ({cartItems.reduce((total, item) => total + item.quantity, 0)} items)</span>
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

            <div className="order-note">
              <p>🕒 Orders require 24 hours advance notice for preparation</p>
              <p>📞 We'll contact you to confirm your order</p>
            </div>

            <div className="checkout-actions">
              <button onClick={handleCheckout} className="checkout-btn">
                Proceed to Checkout
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