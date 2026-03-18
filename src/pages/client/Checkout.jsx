import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Home, Calendar, Clock, CreditCard, Wallet, MapPin } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import { CartContext } from '../../context/CartContext';
import { useOrders } from '../../context/OrderContext';
import { toast } from 'react-toastify';
import './Checkout.css';

const DELIVERY_SLOTS = ['10:00', '12:00', '14:00', '16:00', '18:00'];

const Checkout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { clearCart } = useContext(CartContext);
  const { addOrder } = useOrders();

  const orderDetails = location.state?.orderDetails;

  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [useNewAddress, setUseNewAddress] = useState(false);
  const [saveAddress, setSaveAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({
    label: 'Home',
    street: orderDetails?.address || '',
    city: '',
    state: '',
    zipCode: '',
    country: 'Sri Lanka',
  });

  const [paymentMethod, setPaymentMethod] = useState('cash_on_delivery');
  const [deliveryDate, setDeliveryDate] = useState(orderDetails?.deliveryDate || '');
  const [deliverySlot, setDeliverySlot] = useState(orderDetails?.deliveryTime || '');
  const [notes, setNotes] = useState(orderDetails?.specialInstructions || '');
  const [placing, setPlacing] = useState(false);

  const addresses = useMemo(() => (
    Array.isArray(user?.addresses) ? user.addresses : []
  ), [user?.addresses]);

  useEffect(() => {
    if (!user && orderDetails) {
      navigate('/login', { state: { from: '/cart' } });
    }
  }, [user, orderDetails, navigate]);

  useEffect(() => {
    if (addresses.length === 0) {
      setUseNewAddress(true);
      return;
    }

    const defaultAddress = addresses.find((addr) => addr.isDefault) || addresses[0];
    if (defaultAddress?._id && !selectedAddressId) {
      setSelectedAddressId(defaultAddress._id);
    }
  }, [addresses, selectedAddressId]);

  const getTomorrowDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  };

  const formatCurrency = (value) => `Rs. ${Number(value || 0).toLocaleString()}`;

  const formatAddressLine = (address) => {
    if (!address) return '';
    return [address.street, address.city, address.state, address.zipCode, address.country]
      .filter(Boolean)
      .join(', ');
  };

  const handlePlaceOrder = async () => {
    if (!orderDetails?.items?.length) {
      toast.error('Your cart is empty');
      return;
    }

    if (!deliveryDate || !deliverySlot) {
      toast.error('Please select delivery date and time slot');
      return;
    }

    const needsNewAddress = useNewAddress || !selectedAddressId;
    if (needsNewAddress && (!newAddress.street.trim() || !newAddress.city.trim())) {
      toast.error('Please enter a valid delivery address (street and city)');
      return;
    }

    setPlacing(true);
    try {
      const payload = {
        paymentMethod,
        deliveryType: orderDetails.deliveryOption || 'delivery',
        deliveryDate,
        deliverySlot,
        notes,
        tax: orderDetails.tax,
        shipping: orderDetails.shipping,
      };

      if (needsNewAddress) {
        payload.address = newAddress;
        payload.saveAddress = saveAddress;
      } else {
        payload.addressId = selectedAddressId;
      }

      const response = await addOrder(payload);
      const createdOrder = response?.order || response;

      await clearCart();

      const orderForSuccess = {
        ...createdOrder,
        id: createdOrder.id || createdOrder.orderId,
        status: createdOrder.status || createdOrder.orderStatus,
        total: createdOrder.total ?? createdOrder.totalAmount,
        deliveryTime: createdOrder.deliveryTime || createdOrder.deliverySlot,
      };

      toast.success('Order placed successfully!');
      navigate('/order-success', { state: { order: orderForSuccess } });
    } catch (err) {
      const stockIssue = err?.data?.stockIssues?.[0];
      if (stockIssue) {
        toast.error(`${stockIssue.name || 'Item'} has only ${stockIssue.availableStock} in stock`);
      } else {
        toast.error(err.message || 'Failed to place order');
      }
    } finally {
      setPlacing(false);
    }
  };

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

  if (!user) return null;

  return (
    <div className="checkout-page">
      <div className="checkout-container">
        <button onClick={() => navigate('/cart')} className="checkout-back-btn">
          <ArrowLeft size={20} />
          Back to Cart
        </button>

        <div className="checkout-header">
          <Home size={32} />
          <h1>Checkout</h1>
          <p>Confirm delivery details and payment method</p>
        </div>

        <div className="checkout-layout">
          <div className="checkout-left">
            <div className="checkout-form-section">
              <h3><MapPin size={18} /> Delivery Address</h3>

              {addresses.length > 0 && (
                <div className="address-card-list">
                  {addresses.map((address) => (
                    <button
                      type="button"
                      key={address._id}
                      className={`address-card ${selectedAddressId === address._id && !useNewAddress ? 'selected' : ''}`}
                      onClick={() => {
                        setUseNewAddress(false);
                        setSelectedAddressId(address._id);
                      }}
                    >
                      <strong>{address.label || 'Address'}</strong>
                      <span>{formatAddressLine(address)}</span>
                    </button>
                  ))}
                </div>
              )}

              <label className="checkout-inline-note">
                <input
                  type="checkbox"
                  checked={useNewAddress}
                  onChange={(e) => setUseNewAddress(e.target.checked)}
                />
                Use a new address
              </label>

              {useNewAddress && (
                <div className="address-grid">
                  <div className="form-group">
                    <label>Label</label>
                    <input
                      value={newAddress.label}
                      onChange={(e) => setNewAddress((prev) => ({ ...prev, label: e.target.value }))}
                      placeholder="Home / Work"
                    />
                  </div>
                  <div className="form-group">
                    <label>Street *</label>
                    <input
                      value={newAddress.street}
                      onChange={(e) => setNewAddress((prev) => ({ ...prev, street: e.target.value }))}
                      placeholder="Street address"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>City *</label>
                    <input
                      value={newAddress.city}
                      onChange={(e) => setNewAddress((prev) => ({ ...prev, city: e.target.value }))}
                      placeholder="City"
                      required
                    />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>State</label>
                      <input
                        value={newAddress.state}
                        onChange={(e) => setNewAddress((prev) => ({ ...prev, state: e.target.value }))}
                        placeholder="State"
                      />
                    </div>
                    <div className="form-group">
                      <label>ZIP Code</label>
                      <input
                        value={newAddress.zipCode}
                        onChange={(e) => setNewAddress((prev) => ({ ...prev, zipCode: e.target.value }))}
                        placeholder="ZIP"
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Country</label>
                    <input
                      value={newAddress.country}
                      onChange={(e) => setNewAddress((prev) => ({ ...prev, country: e.target.value }))}
                      placeholder="Country"
                    />
                  </div>

                  <label className="checkout-inline-note">
                    <input
                      type="checkbox"
                      checked={saveAddress}
                      onChange={(e) => setSaveAddress(e.target.checked)}
                    />
                    Save this address to profile
                  </label>
                </div>
              )}
            </div>

            <div className="checkout-form-section">
              <h3><CreditCard size={18} /> Payment Method</h3>
              <div className="checkout-radio-group">
                <label className={`checkout-radio-option ${paymentMethod === 'online' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="online"
                    checked={paymentMethod === 'online'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <div>
                    <strong><CreditCard size={16} /> Online Payment</strong>
                    <p>Pay now using your card or gateway</p>
                  </div>
                </label>

                <label className={`checkout-radio-option ${paymentMethod === 'cash_on_delivery' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cash_on_delivery"
                    checked={paymentMethod === 'cash_on_delivery'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <div>
                    <strong><Wallet size={16} /> Cash on Delivery</strong>
                    <p>Pay when your order is delivered</p>
                  </div>
                </label>
              </div>
            </div>

            <div className="checkout-form-section">
              <h3><Calendar size={18} /> Delivery Schedule</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Delivery Date *</label>
                  <input
                    type="date"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    min={getTomorrowDate()}
                  />
                </div>
                <div className="form-group">
                  <label>Delivery Slot *</label>
                  <select
                    value={deliverySlot}
                    onChange={(e) => setDeliverySlot(e.target.value)}
                  >
                    <option value="">Select slot</option>
                    {DELIVERY_SLOTS.map((slot) => (
                      <option key={slot} value={slot}>{slot}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Additional Notes</label>
                <textarea
                  rows="3"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any special instructions for the order"
                />
              </div>
            </div>
          </div>

          <div className="checkout-right">
            <div className="checkout-summary-card">
              <h3>Order Summary</h3>
              <div className="checkout-items-list">
                {orderDetails.items.map((item) => (
                  <div key={item.id || item._id} className="checkout-item">
                    <img src={item.image} alt={item.name || item.productName} className="checkout-item-img" />
                    <div className="checkout-item-info">
                      <span className="checkout-item-name">{item.name || item.productName}</span>
                      <span className="checkout-item-qty">x{item.quantity}</span>
                    </div>
                    <span className="checkout-item-price">{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="checkout-summary-rows">
                <div className="checkout-summary-row">
                  <span>Subtotal</span>
                  <span>{formatCurrency(orderDetails.subtotal)}</span>
                </div>
                <div className="checkout-summary-row">
                  <span>Tax</span>
                  <span>{formatCurrency(orderDetails.tax)}</span>
                </div>
                <div className="checkout-summary-row">
                  <span>Shipping</span>
                  <span>{formatCurrency(orderDetails.shipping)}</span>
                </div>
                <div className="checkout-summary-row total">
                  <span>Total</span>
                  <span>{formatCurrency(orderDetails.total)}</span>
                </div>
              </div>

              <button type="button" className="pay-btn" onClick={handlePlaceOrder} disabled={placing}>
                {placing ? 'Placing Order...' : 'Place Order'}
              </button>
            </div>

            <div className="checkout-delivery-info">
              <h4>Selected Preferences</h4>
              <p><strong>Payment:</strong> {paymentMethod === 'online' ? 'Online Payment' : 'Cash on Delivery'}</p>
              <p><strong>Date:</strong> {deliveryDate || '-'}</p>
              <p><strong>Slot:</strong> {deliverySlot || '-'}</p>
              <p><strong>Delivery Type:</strong> {orderDetails.deliveryOption === 'takeaway' ? 'Takeaway' : 'Delivery'}</p>
            </div>

            <div className="checkout-test-info">
              <Clock size={16} />
              <div>
                <strong>Checkout Validation</strong>
                <p>Cart and stock are re-validated on the server before creating your order.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
