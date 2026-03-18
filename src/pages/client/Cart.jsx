import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, Home, Store, Truck, Calendar, Clock, AlertTriangle, Package } from 'lucide-react';
import { CartContext } from '../../context/CartContext';
import { AuthContext } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import './Cart.css';

const BULK_ORDER_THRESHOLD = 12;

const Cart = () => {
  const { cartItems, removeFromCart, updateQuantity, clearCart, syncing } = useContext(CartContext);
  const { user } = useContext(AuthContext);
  const [deliveryOption, setDeliveryOption] = useState('delivery');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('');
  const [address, setAddress] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const navigate = useNavigate();

  const totalQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const hasSingleItemBulkQty = cartItems.some((item) => Number(item.quantity) >= BULK_ORDER_THRESHOLD);
  const isBulkOrder = totalQuantity >= BULK_ORDER_THRESHOLD || hasSingleItemBulkQty;

  const calculateSubtotal = () => cartItems.reduce((t, i) => t + i.price * i.quantity, 0);
  const calculateTax = () => calculateSubtotal() * 0.08;
  const calculateShipping = () => (deliveryOption === 'delivery' ? 350.00 : 0);
  const calculateTotal = () => calculateSubtotal() + calculateTax() + calculateShipping();

  // Get item identifier (works for both API _id and local id)
  const getItemId = (item) => item._id || item.id;
  const getItemName = (item) => item.productName || item.name || 'Product';
  const getItemCategory = (item) => item.category || '';
  const getItemImage = (item) => item.image || '';

  const handleDecrease = async (item) => {
    try {
      await updateQuantity(getItemId(item), item.quantity - 1);
    } catch (err) {
      toast.error(err.message || 'Failed to update cart');
    }
  };

  const handleIncrease = async (item) => {
    if (item.stock && item.quantity >= item.stock) {
      toast.warning(`Only ${item.stock} available`);
      return;
    }

    try {
      await updateQuantity(getItemId(item), item.quantity + 1);
    } catch (err) {
      toast.error(err.message || 'Failed to update cart');
    }
  };

  const handleRemove = async (item) => {
    try {
      await removeFromCart(getItemId(item));
    } catch (err) {
      toast.error(err.message || 'Failed to remove item');
    }
  };

  const handleClear = async () => {
    try {
      await clearCart();
    } catch (err) {
      toast.error(err.message || 'Failed to clear cart');
    }
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) return toast.error('Your cart is empty');
    if (!user) { toast.info('Please login to proceed'); navigate('/login', { state: { from: '/cart' } }); return; }
    if (deliveryOption === 'delivery' && !address.trim()) return toast.error('Please enter delivery address');
    if (!deliveryDate || !deliveryTime) return toast.error('Please select date and time');

    const orderDetails = {
      items: cartItems,
      deliveryOption, deliveryDate, deliveryTime, address, specialInstructions,
      subtotal: calculateSubtotal(), tax: calculateTax(),
      shipping: calculateShipping(), total: calculateTotal(), totalQuantity,
    };

    navigate(isBulkOrder ? '/bulk-order' : '/checkout', { state: { orderDetails } });
  };

  const getTomorrowDate = () => {
    const d = new Date(); d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  };

  if (cartItems.length === 0) {
    return (
      <div className="cart-page">
        <div className="cart-container">
          <div className="empty-cart">
            <h2>Your cart is empty</h2>
            <p>Add some delicious cakes to your cart!</p>
            <Link to="/products" className="continue-shopping-btn">Continue Shopping</Link>
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
                <p>Orders with {BULK_ORDER_THRESHOLD} or more pieces are treated as bulk orders and require admin approval.</p>
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
                <div key={getItemId(item)} className="cart-item">
                  <img src={getItemImage(item)} alt={getItemName(item)} className="cart-item-image" />
                  <div className="cart-item-info">
                    <h3>{getItemName(item)}</h3>
                    {getItemCategory(item) && <p className="cart-item-category">{getItemCategory(item)}</p>}
                    <p className="cart-item-price">Rs. {item.price.toLocaleString()}</p>
                    <div className="cart-item-quantity">
                      <button className="quantity-btn" onClick={() => handleDecrease(item)} disabled={syncing}>
                        <Minus size={14} />
                      </button>
                      <span className="quantity-display">{item.quantity}</span>
                      <button
                        className="quantity-btn"
                        onClick={() => handleIncrease(item)}
                        disabled={syncing || (item.stock && item.quantity >= item.stock)}
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="cart-item-total">
                    <span>Rs. {(item.price * item.quantity).toLocaleString()}</span>
                    <button onClick={() => handleRemove(item)} className="remove-btn" title="Remove" disabled={syncing}>
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
                  <input type="radio" name="delivery" value="delivery" checked={deliveryOption === 'delivery'} onChange={(e) => setDeliveryOption(e.target.value)} />
                  <div className="option-content">
                    <Truck size={24} />
                    <div><h3>Delivery</h3><p>We'll deliver to your address</p><span className="option-price">Rs. 350</span></div>
                  </div>
                </label>
                <label className={`delivery-option ${deliveryOption === 'takeaway' ? 'selected' : ''}`}>
                  <input type="radio" name="delivery" value="takeaway" checked={deliveryOption === 'takeaway'} onChange={(e) => setDeliveryOption(e.target.value)} />
                  <div className="option-content">
                    <Store size={24} />
                    <div><h3>Takeaway</h3><p>Pick up from our store</p><span className="option-price">FREE</span></div>
                  </div>
                </label>
              </div>

              {deliveryOption === 'delivery' && (
                <div className="address-section">
                  <h3>Delivery Address</h3>
                  <div className="input-with-icon">
                    <Home size={20} />
                    <textarea value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Enter your full delivery address" rows="3" required />
                  </div>
                </div>
              )}

              <div className="datetime-section">
                <h3>Select Date & Time</h3>
                <div className="datetime-inputs">
                  <div className="input-with-icon">
                    <Calendar size={20} />
                    <input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} min={getTomorrowDate()} required />
                  </div>
                  <div className="input-with-icon">
                    <Clock size={20} />
                    <select value={deliveryTime} onChange={(e) => setDeliveryTime(e.target.value)} required>
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
                <textarea value={specialInstructions} onChange={(e) => setSpecialInstructions(e.target.value)} placeholder="Any special requests or instructions..." rows="3" />
              </div>
            </div>
          </div>

          <div className="cart-summary">
            <h2>Order Summary</h2>
            <div className="summary-details">
              <div className="summary-row"><span>Subtotal ({totalQuantity} items)</span><span>Rs. {calculateSubtotal().toLocaleString()}</span></div>
              <div className="summary-row"><span>Tax (8%)</span><span>Rs. {calculateTax().toFixed(0)}</span></div>
              <div className="summary-row"><span>Shipping</span><span>Rs. {calculateShipping().toLocaleString()}</span></div>
              <div className="summary-row total"><span>Total</span><span>Rs. {calculateTotal().toLocaleString()}</span></div>
            </div>

            {isBulkOrder ? (
              <div className="order-note bulk-note">
                <p>📦 This is a <strong>bulk order</strong> ({totalQuantity} pieces)</p>
                <p>📋 Your order will be sent for admin approval</p>
                <p>📞 We'll contact you once confirmed</p>
              </div>
            ) : (
              <div className="order-note">
                <p>🕒 Orders require 24 hours advance notice</p>
                <p>📞 We'll confirm your order shortly</p>
              </div>
            )}

            <div className="checkout-actions">
              <button onClick={handleCheckout} className={`checkout-btn ${isBulkOrder ? 'bulk-checkout-btn' : ''}`} disabled={syncing}>
                {isBulkOrder ? 'Request Bulk Order' : 'Proceed to Checkout'}
              </button>
              <button onClick={handleClear} className="clear-cart-btn" disabled={syncing}>Clear Cart</button>
              <Link to="/products" className="continue-shopping-btn">Continue Shopping</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
