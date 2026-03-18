import React, { useMemo, useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useOrders } from '../../context/OrderContext';
import { usersApi, customOrdersApi } from '../../api/api';
import { User, Mail, Shield, LogOut, Phone, MapPin, ShoppingBag, Edit2, X, Check, Bell, Package, Camera } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import './Profile.css';

const formatMoney = (value) => `LKR ${Number(value || 0).toFixed(2)}`;
const formatDate = (value) => (value ? new Date(value).toLocaleDateString() : '-');
const formatStatus = (value) => String(value || 'pending').replace(/_/g, ' ');
const ORDER_LOCK_MESSAGE = 'Your order is already in progress and can no longer be modified or cancelled.';
const isLockedOrderStatus = (value) => ['in_progress', 'ready', 'out_for_delivery', 'delivered'].includes(String(value || '').toLowerCase());
const formatCustomStatus = (value) => {
  const status = String(value || '').toLowerCase();
  if (status === 'awaiting_admin_quote') return 'Custom Order Requested - Waiting for Price';
  if (status === 'awaiting_user_acceptance') return 'Price Updated - Waiting for Your Confirmation';
  if (status === 'price_accepted') return 'Price Accepted - Select Payment Method';
  if (status === 'awaiting_user_payment') return 'Price Accepted - Payment Pending';
  if (status === 'price_rejected') return 'Price Rejected';
  return formatStatus(status || 'pending');
};

const isTrackableBulkStatus = (status) => {
  const normalized = String(status || '').toLowerCase();
  return ['awaiting_user_payment', 'in_progress', 'ready', 'out_for_delivery', 'delivered', 'approved', 'completed'].includes(normalized);
};

const getOriginFromApiBase = (value, fallback) => {
  try {
    const parsed = new URL(value || fallback);
    return parsed.origin;
  } catch {
    return fallback;
  }
};

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const CHAT_API_BASE = import.meta.env.VITE_CHAT_API_URL || 'http://localhost:8001/chat-api/v1';
const API_ORIGIN = getOriginFromApiBase(API_BASE, 'http://localhost:5000');
const CHAT_ORIGIN = getOriginFromApiBase(CHAT_API_BASE, 'http://localhost:8001');

const resolveOrderImageUrl = (value) => {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('blob:') || raw.startsWith('data:')) {
    return raw;
  }
  if (raw.startsWith('/chat-api/')) return `${CHAT_ORIGIN}${raw}`;
  if (raw.startsWith('/')) return `${API_ORIGIN}${raw}`;
  return raw;
};

const Profile = () => {
  const { user, admin, logoutUser, logoutAdmin, loadUserFromStorage } = useAuth();
  const { orders, bulkOrders, notifications, unreadNotificationCount, markAllNotificationsRead, cancelOrder } = useOrders();
  const navigate = useNavigate();
  const location = useLocation();

  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ name: '', phone: '', address: '', profileImage: '' });
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancellingOrder, setCancellingOrder] = useState(false);

  const [customOrders, setCustomOrders] = useState([]);
  const [customOrdersLoading, setCustomOrdersLoading] = useState(false);
  const [selectedBulkOrder, setSelectedBulkOrder] = useState(null);
  const [selectedCustomOrder, setSelectedCustomOrder] = useState(null);
  const [customDecisionLoading, setCustomDecisionLoading] = useState(false);
  const [customRejectReason, setCustomRejectReason] = useState('');
  const [customPaymentMethod, setCustomPaymentMethod] = useState('online');
  const [customCreateOrderLoading, setCustomCreateOrderLoading] = useState(false);

  const isAdmin = !!admin;
  const currentUser = isAdmin ? admin : user;

  const tabParam = useMemo(() => new URLSearchParams(location.search).get('tab') || '', [location.search]);
  const customOrderIdParam = useMemo(() => new URLSearchParams(location.search).get('customOrderId') || '', [location.search]);

  const allowedTabs = useMemo(() => new Set(['profile', 'orders', 'bulk-orders', 'custom-orders']), []);
  const activeTab = useMemo(() => {
    const normalized = allowedTabs.has(tabParam) ? tabParam : 'profile';
    if (customOrderIdParam && (normalized === 'orders' || !allowedTabs.has(tabParam))) {
      return 'custom-orders';
    }
    return normalized;
  }, [allowedTabs, customOrderIdParam, tabParam]);

  const orderCount = !isAdmin && user?.email
    ? orders.filter((o) => String(o.customer?.email || '').toLowerCase() === String(user.email || '').toLowerCase()).length
    : 0;

  const visibleNotifications = useMemo(() => (!isAdmin ? notifications : []), [isAdmin, notifications]);
  const unreadCount = !isAdmin ? unreadNotificationCount : 0;

  const myOrders = useMemo(() => {
    if (isAdmin || !user?.email) return [];
    return orders
      .filter((o) => String(o.customer?.email || '').toLowerCase() === String(user.email || '').toLowerCase())
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [isAdmin, orders, user?.email]);

  const myBulkOrders = useMemo(() => {
    if (isAdmin || !user) return [];
    return bulkOrders
      .filter((o) => {
        const byCustomerEmail = String(o.customer?.email || o.customerEmail || '').toLowerCase() === String(user.email || '').toLowerCase();
        const byUserId = String(o.userId || '') === String(user.id || '');
        return byCustomerEmail || byUserId;
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [bulkOrders, isAdmin, user]);

  const myCustomOrders = useMemo(() => {
    if (isAdmin) return [];
    return [...customOrders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [customOrders, isAdmin]);

  useEffect(() => {
    if (unreadCount > 0) {
      const firstUnread = visibleNotifications.find((n) => !n.read);
      toast.info(
        `You have ${unreadCount} new notification${unreadCount > 1 ? 's' : ''}: ${firstUnread?.message || ''}`,
        { autoClose: 5000 }
      );
    }
  }, [unreadCount, visibleNotifications]);

  useEffect(() => {
    if (isAdmin || !user?.token) {
      setCustomOrders([]);
      return;
    }

    const loadCustomOrders = async () => {
      setCustomOrdersLoading(true);
      try {
        const response = await customOrdersApi.getMine({ limit: 50 });
        const list = Array.isArray(response) ? response : (response.items || []);
        setCustomOrders(list);
      } catch (err) {
        setCustomOrders([]);
        toast.error(err.message || 'Failed to load custom orders');
      } finally {
        setCustomOrdersLoading(false);
      }
    };

    loadCustomOrders();
  }, [isAdmin, user?.token]);

  useEffect(() => {
    if (!customOrderIdParam || isAdmin || !user?.token) return;

    const found = myCustomOrders.find((item) => (
      String(item.requestId || '') === String(customOrderIdParam)
      || String(item._id || '') === String(customOrderIdParam)
    ));
    if (found) {
      setSelectedCustomOrder(found);
      return;
    }

    const loadSpecific = async () => {
      try {
        const response = await customOrdersApi.getMineById(customOrderIdParam);
        if (response?.item) {
          setSelectedCustomOrder(response.item);
        }
      } catch {
        // Ignore invalid deep link ids.
      }
    };

    loadSpecific();
  }, [customOrderIdParam, isAdmin, myCustomOrders, user?.token]);

  useEffect(() => {
    if (!selectedCustomOrder) return;
    setCustomPaymentMethod(selectedCustomOrder.paymentMethod || 'online');
    setCustomRejectReason('');
  }, [selectedCustomOrder]);

  const handleMarkAllNotificationsRead = async () => {
    await markAllNotificationsRead();
  };

  const handleTabChange = (tab) => {
    navigate(`/profile?tab=${encodeURIComponent(tab)}`);
  };

  const mergeCustomOrderState = (nextItem) => {
    if (!nextItem) return;
    setCustomOrders((prev) => {
      const existingIndex = prev.findIndex((item) => (
        String(item.requestId || item._id) === String(nextItem.requestId || nextItem._id)
      ));
      if (existingIndex === -1) return [nextItem, ...prev];

      const next = [...prev];
      next[existingIndex] = { ...next[existingIndex], ...nextItem };
      return next;
    });
    setSelectedCustomOrder((prev) => (prev ? { ...prev, ...nextItem } : nextItem));
  };

  const openCustomOrder = (order) => {
    setCustomRejectReason('');
    setCustomPaymentMethod(order?.paymentMethod || 'online');
    setSelectedCustomOrder(order);
  };

  const handleAcceptCustomPrice = async () => {
    if (!selectedCustomOrder) return;
    if (isLockedOrderStatus(selectedCustomOrder.status)) {
      toast.info(ORDER_LOCK_MESSAGE);
      return;
    }
    const requestId = selectedCustomOrder.requestId || selectedCustomOrder._id;
    if (!requestId) return;

    setCustomDecisionLoading(true);
    try {
      const response = await customOrdersApi.accept(requestId, { decision: 'accept' });
      mergeCustomOrderState(response?.item);
      toast.success('Price accepted. You can now choose a payment method.');
    } catch (err) {
      toast.error(err.message || 'Failed to accept custom cake price');
    } finally {
      setCustomDecisionLoading(false);
    }
  };

  const handleRejectCustomPrice = async () => {
    if (!selectedCustomOrder) return;
    if (isLockedOrderStatus(selectedCustomOrder.status)) {
      toast.info(ORDER_LOCK_MESSAGE);
      return;
    }
    const requestId = selectedCustomOrder.requestId || selectedCustomOrder._id;
    if (!requestId) return;

    setCustomDecisionLoading(true);
    try {
      const response = await customOrdersApi.rejectQuote(requestId, {
        decision: 'reject',
        reason: customRejectReason.trim(),
      });
      mergeCustomOrderState(response?.item);
      toast.success('Price rejected');
    } catch (err) {
      toast.error(err.message || 'Failed to reject custom cake price');
    } finally {
      setCustomDecisionLoading(false);
    }
  };

  const handleCreateCustomOrder = async () => {
    if (!selectedCustomOrder) return;
    if (isLockedOrderStatus(selectedCustomOrder.status)) {
      toast.info(ORDER_LOCK_MESSAGE);
      return;
    }
    const requestId = selectedCustomOrder.requestId || selectedCustomOrder._id;
    if (!requestId) return;

    setCustomCreateOrderLoading(true);
    try {
      const paymentPayload = customPaymentMethod === 'online'
        ? {
          provider: 'online_stub',
          transactionId: `SIM-${Date.now()}`,
        }
        : {
          provider: 'cash_on_delivery',
        };
      const response = await customOrdersApi.confirmPayment(requestId, {
        paymentMethod: customPaymentMethod,
        payment: paymentPayload,
      });
      const generatedOrderId = response?.orderId || '';
      const updatedItem = {
        ...selectedCustomOrder,
        status: 'in_progress',
        paymentMethod: customPaymentMethod,
        paymentStatus: response?.paymentStatus || 'paid',
        generatedOrderId,
      };
      mergeCustomOrderState(updatedItem);
      toast.success('Payment confirmed. Custom cake is now in progress');
    } catch (err) {
      toast.error(err.message || 'Failed to proceed with payment for custom cake');
    } finally {
      setCustomCreateOrderLoading(false);
    }
  };

  const openCancelModal = (order) => {
    setOrderToCancel(order);
    setCancelReason('');
    setCancelModalOpen(true);
  };

  const closeCancelModal = () => {
    if (cancellingOrder) return;
    setCancelModalOpen(false);
    setOrderToCancel(null);
    setCancelReason('');
  };

  const confirmCancelOrder = async () => {
    if (!orderToCancel) return;

    setCancellingOrder(true);
    try {
      await cancelOrder(orderToCancel.orderId || orderToCancel.id, cancelReason);
      toast.success('Order cancelled successfully');
      closeCancelModal();
    } catch (err) {
      toast.error(err.message || 'Failed to cancel order');
    } finally {
      setCancellingOrder(false);
    }
  };

  const handleLogout = () => {
    if (isAdmin) {
      logoutAdmin();
      toast.success('Admin logged out successfully');
      navigate('/admin/login');
    } else {
      logoutUser();
      toast.success('Logged out successfully');
      navigate('/login');
    }
  };

  const handleEdit = () => {
    setEditData({
      name: user?.name || '',
      phone: user?.phone || '',
      address: user?.address || '',
      profileImage: user?.profileImage || '',
    });
    setIsEditing(true);
  };

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setEditData((prev) => ({ ...prev, profileImage: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async () => {
    if (!user?.email) return;
    try {
      const updated = await usersApi.update(user.email, {
        name: editData.name,
        phone: editData.phone,
        address: editData.address,
        profileImage: editData.profileImage,
      });
      const toStore = { ...user, ...updated };
      localStorage.setItem('userAuth', JSON.stringify(toStore));
      loadUserFromStorage?.();
      setIsEditing(false);
      toast.success('Profile updated and saved to database');
    } catch (err) {
      toast.error(err.message || 'Failed to update profile');
    }
  };

  if (!currentUser) {
    navigate('/login');
    return null;
  }

  const selectedCustomStatus = String(selectedCustomOrder?.status || '').toLowerCase();
  const isSelectedCustomLocked = isLockedOrderStatus(selectedCustomStatus);
  const canRespondToQuote = ['awaiting_user_acceptance', 'quoted'].includes(selectedCustomStatus);
  const canSelectPayment = ['price_accepted', 'awaiting_user_payment'].includes(selectedCustomStatus)
    && Number(selectedCustomOrder?.adminQuote?.quotedPrice || 0) > 0
    && !selectedCustomOrder?.generatedOrderId;
  const pricingHistory = Array.isArray(selectedCustomOrder?.pricingHistory)
    ? selectedCustomOrder.pricingHistory
    : [];

  return (
    <div className="profile-page">
      <div className="profile-container">
        <div className="profile-header">
          <div className="profile-avatar">
            {isAdmin ? (
              <Shield size={48} />
            ) : (
              <div className="avatar-wrapper">
                {(isEditing ? editData.profileImage : currentUser?.profileImage) ? (
                  <img
                    src={isEditing ? editData.profileImage : currentUser.profileImage}
                    alt="Profile"
                    className="avatar-image"
                  />
                ) : (
                  <User size={48} />
                )}
                {isEditing && (
                  <label className="avatar-upload">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden-input"
                    />
                    <Camera size={16} />
                  </label>
                )}
              </div>
            )}
          </div>
          <h1>
            {isAdmin ? 'Admin Profile' : 'My Profile'}
            {isAdmin && (
              <span className="admin-badge">{admin.role}</span>
            )}
          </h1>
        </div>

        {!isAdmin && (
          <div className="profile-tabs">
            <button className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => handleTabChange('profile')}>Profile Details</button>
            <button className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => handleTabChange('orders')}>My Orders</button>
            <button className={`tab-btn ${activeTab === 'bulk-orders' ? 'active' : ''}`} onClick={() => handleTabChange('bulk-orders')}>Bulk Orders</button>
            <button className={`tab-btn ${activeTab === 'custom-orders' ? 'active' : ''}`} onClick={() => handleTabChange('custom-orders')}>Custom Orders</button>
          </div>
        )}

        {!isAdmin && activeTab === 'orders' && (
          <div className="orders-section">
            <h3><ShoppingBag size={20} /> Order History</h3>
            {myOrders.length === 0 ? (
              <p className="no-orders-msg">You haven't placed any orders yet.</p>
            ) : (
              <div className="orders-list">
                {myOrders.map((order) => {
                  const orderStatus = order.status || order.orderStatus || 'pending';
                  const canCancelCurrentOrder = ['pending', 'ready', 'packed'].includes(orderStatus);
                  const orderPublicId = order.orderId || order.id;

                  return (
                    <div key={orderPublicId} className="order-mini-card">
                      <div className="order-mini-header">
                        <span className="order-mini-id">Order #{orderPublicId}</span>
                        <span className="order-mini-date">{formatDate(order.createdAt)}</span>
                      </div>

                      <div className="order-mini-items">
                        {(order.items || []).map((item) => (
                          <div key={item.id || item._id} className="order-mini-item-row">
                            <span className="order-mini-item-name">{item.quantity}x {item.name || item.productName}</span>
                            <span className="order-mini-item-price">{formatMoney((item.price || 0) * (item.quantity || 1))}</span>
                          </div>
                        ))}
                      </div>

                      <div className="order-mini-total">
                        <strong>Total</strong>
                        <strong>{formatMoney(order.total || order.totalAmount || 0)}</strong>
                      </div>

                      <div className="order-mini-actions">
                        <Link className="order-action-btn track" to={`/orders/${orderPublicId}/tracking`}>Track Order</Link>
                        {canCancelCurrentOrder ? (
                          <button className="order-action-btn cancel" onClick={() => openCancelModal(order)}>Cancel Order</button>
                        ) : (
                          <span className="order-cancel-disabled-note">Cannot cancel at {formatStatus(orderStatus)}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {!isAdmin && activeTab === 'bulk-orders' && (
          <div className="orders-section">
            <h3><Package size={20} /> Bulk Orders</h3>
            {myBulkOrders.length === 0 ? (
              <p className="no-orders-msg">No bulk orders found yet.</p>
            ) : (
              <div className="orders-list">
                {myBulkOrders.map((order) => {
                  const orderId = order.bulkOrderId || order.id;
                  const status = order.approvalStatus || order.status || 'awaiting_admin_acceptance';
                  const canTrack = Boolean(order.trackingEnabled || isTrackableBulkStatus(status));
                  const previewItems = (order.items || []).slice(0, 2);
                  const remainingCount = Math.max(0, (order.items || []).length - previewItems.length);

                  return (
                    <div key={orderId} className="order-mini-card">
                      <div className="order-mini-header">
                        <span className="order-mini-id">Bulk #{orderId}</span>
                        <span className="order-mini-date">{formatDate(order.createdAt)}</span>
                      </div>

                      <div className="order-mini-items">
                        {previewItems.map((item) => (
                          <div key={item._id || item.id || `${orderId}-${item.productName}`} className="order-mini-item-row">
                            <span className="order-mini-item-name">{item.quantity}x {item.productName}</span>
                            <span className="order-mini-item-price">{formatMoney((item.price || 0) * (item.quantity || 1))}</span>
                          </div>
                        ))}
                        {remainingCount > 0 && (
                          <div className="order-mini-item-row">
                            <span className="order-mini-item-name">+{remainingCount} more item{remainingCount > 1 ? 's' : ''}</span>
                            <span className="order-mini-item-price">&nbsp;</span>
                          </div>
                        )}
                      </div>

                      <div className="order-mini-total">
                        <strong>{order.totalQuantity || 0} pcs</strong>
                        <strong>{formatMoney(order.total || order.totalAmount || 0)}</strong>
                      </div>

                      <div className="order-mini-meta-grid">
                        <span><strong>Status:</strong> {formatStatus(status)}</span>
                        <span><strong>Delivery:</strong> {formatDate(order.requestedDeliveryDate)}</span>
                      </div>

                      <div className="order-mini-actions">
                        <button className="order-action-btn track" onClick={() => setSelectedBulkOrder(order)}>View Details</button>
                        {canTrack && (
                          <Link className="order-action-btn cancel" to={`/bulk-orders/${orderId}/tracking`}>Track Order</Link>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {!isAdmin && activeTab === 'custom-orders' && (
          <div className="orders-section">
            <h3><ShoppingBag size={20} /> Custom Orders</h3>
            {customOrdersLoading ? (
              <p className="no-orders-msg">Loading custom orders...</p>
            ) : myCustomOrders.length === 0 ? (
              <p className="no-orders-msg">No custom cake requests found yet.</p>
            ) : (
              <div className="orders-list">
                {myCustomOrders.map((order) => {
                  const requestId = order.requestId || order.id || order._id;
                  const status = order.status || 'ai_processing';
                  const quotePrice = order.adminQuote?.quotedPrice;
                  const details = order.userConfirmation?.details || {};

                  return (
                    <div key={requestId} className="order-mini-card">
                      <div className="order-mini-header">
                        <span className="order-mini-id">Custom #{requestId}</span>
                        <span className="order-mini-date">{formatDate(order.createdAt)}</span>
                      </div>

                      <div className="order-mini-items">
                        <div className="order-mini-item-row">
                          <span className="order-mini-item-name">Flavor</span>
                          <span className="order-mini-item-price">{details.flavor || '-'}</span>
                        </div>
                        <div className="order-mini-item-row">
                          <span className="order-mini-item-name">Delivery</span>
                          <span className="order-mini-item-price">{formatDate(details.deliveryDate)}</span>
                        </div>
                        <div className="order-mini-item-row">
                          <span className="order-mini-item-name">Status</span>
                          <span className="order-mini-item-price">{formatCustomStatus(status)}</span>
                        </div>
                      </div>

                      <div className="order-mini-total">
                        <strong>Quoted Price</strong>
                        <strong>{quotePrice ? formatMoney(quotePrice) : 'Pending quote'}</strong>
                      </div>

                      <div className="order-mini-actions">
                        <button className="order-action-btn track" onClick={() => openCustomOrder(order)}>View Details</button>
                        {order.generatedOrderId && (
                          <Link className="order-action-btn cancel" to={`/orders/${order.generatedOrderId}/tracking`}>Track Order</Link>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {((isAdmin) || (!isAdmin && activeTab === 'profile')) && (
          <>
            <div className="profile-details">
              <div className="detail-item">
                <Mail size={20} />
                <div>
                  <label>Email</label>
                  <p>{currentUser.email}</p>
                </div>
              </div>

              {!isAdmin && (
                <>
                  <div className="detail-item">
                    <User size={20} />
                    <div>
                      <label>Name</label>
                      {isEditing ? (
                        <input
                          value={editData.name}
                          onChange={(event) => setEditData((prev) => ({ ...prev, name: event.target.value }))}
                          className="profile-edit-input"
                        />
                      ) : (
                        <p>{user?.name || '-'}</p>
                      )}
                    </div>
                  </div>
                  <div className="detail-item">
                    <Phone size={20} />
                    <div>
                      <label>Phone</label>
                      {isEditing ? (
                        <input
                          value={editData.phone}
                          onChange={(event) => setEditData((prev) => ({ ...prev, phone: event.target.value }))}
                          className="profile-edit-input"
                        />
                      ) : (
                        <p>{user?.phone || '-'}</p>
                      )}
                    </div>
                  </div>
                  <div className="detail-item">
                    <MapPin size={20} />
                    <div>
                      <label>Address</label>
                      {isEditing ? (
                        <input
                          value={editData.address}
                          onChange={(event) => setEditData((prev) => ({ ...prev, address: event.target.value }))}
                          className="profile-edit-input"
                        />
                      ) : (
                        <p>{user?.address || '-'}</p>
                      )}
                    </div>
                  </div>
                  <div className="detail-item">
                    <ShoppingBag size={20} />
                    <div>
                      <label>Orders Placed</label>
                      <p>{orderCount} order{orderCount !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                </>
              )}

              {isAdmin && (
                <div className="detail-item">
                  <Shield size={20} />
                  <div>
                    <label>Role</label>
                    <p className="admin-role">{admin.role}</p>
                  </div>
                </div>
              )}
            </div>

            {!isAdmin && visibleNotifications.length > 0 && (
              <div className="profile-notifications-section">
                <h3><Bell size={20} /> Notifications</h3>
                <div className="notifications-list">
                  {visibleNotifications.slice(0, 5).map((notification) => (
                    <div key={notification.id} className={`notification-item ${notification.read ? 'read' : 'unread'}`}>
                      <div className="notification-content">
                        <strong>{notification.orderId || notification.type}</strong>
                        <p>{notification.message}</p>
                        <span className="notification-date">{formatDate(notification.createdAt)}</span>
                      </div>
                    </div>
                  ))}
                  {unreadCount > 0 && (
                    <button className="mark-read-btn" onClick={handleMarkAllNotificationsRead}>Mark all as read</button>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        <div className="profile-actions">
          {!isAdmin && (
            isEditing ? (
              <div className="profile-edit-actions">
                <button onClick={handleSaveProfile} className="profile-save-btn">
                  <Check size={18} /> Save
                </button>
                <button onClick={() => setIsEditing(false)} className="profile-cancel-btn">
                  <X size={18} /> Cancel
                </button>
              </div>
            ) : (
              <button onClick={handleEdit} className="profile-edit-btn">
                <Edit2 size={18} /> Edit Profile
              </button>
            )
          )}
          <button onClick={handleLogout} className="logout-btn">
            <LogOut size={20} />
            <span>{isAdmin ? 'Logout Admin' : 'Logout'}</span>
          </button>
        </div>
      </div>

      {cancelModalOpen && (
        <div className="profile-cancel-modal-overlay" onClick={closeCancelModal}>
          <div className="profile-cancel-modal" onClick={(event) => event.stopPropagation()}>
            <h3>Cancel Order {orderToCancel?.id || orderToCancel?.orderId}</h3>
            <p>You can only cancel orders in Pending or Packed status. This action cannot be undone.</p>
            <textarea
              rows="3"
              value={cancelReason}
              onChange={(event) => setCancelReason(event.target.value)}
              placeholder="Reason (optional)"
            />
            <div className="profile-cancel-modal-actions">
              <button className="profile-cancel-order-btn secondary" onClick={closeCancelModal} disabled={cancellingOrder}>Keep Order</button>
              <button className="profile-cancel-order-btn" onClick={confirmCancelOrder} disabled={cancellingOrder}>
                {cancellingOrder ? 'Cancelling...' : 'Confirm Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedBulkOrder && (
        <div className="profile-cancel-modal-overlay" onClick={() => setSelectedBulkOrder(null)}>
          <div className="profile-cancel-modal profile-order-detail-modal" onClick={(event) => event.stopPropagation()}>
            <h3>Bulk Order {selectedBulkOrder.bulkOrderId || selectedBulkOrder.id}</h3>
            <div className="profile-order-detail-grid">
              <p><strong>Status:</strong> {formatStatus(selectedBulkOrder.approvalStatus || selectedBulkOrder.status)}</p>
              <p><strong>Created:</strong> {formatDate(selectedBulkOrder.createdAt)}</p>
              <p><strong>Delivery Date:</strong> {formatDate(selectedBulkOrder.requestedDeliveryDate)}</p>
              <p><strong>Delivery Slot:</strong> {selectedBulkOrder.deliverySlot || '-'}</p>
              <p><strong>Address:</strong> {selectedBulkOrder.deliveryAddress || '-'}</p>
              <p><strong>Payment:</strong> {formatStatus(selectedBulkOrder.paymentMethod || 'pending')}</p>
              <p><strong>Payment Status:</strong> {formatStatus(selectedBulkOrder.paymentStatus)}</p>
              <p><strong>Total:</strong> {formatMoney(selectedBulkOrder.total || selectedBulkOrder.totalAmount || 0)}</p>
            </div>

            <div className="profile-order-detail-items">
              {(selectedBulkOrder.items || []).map((item) => (
                <div key={item._id || item.id || item.productName} className="order-mini-item-row">
                  <span className="order-mini-item-name">{item.quantity}x {item.productName}</span>
                  <span className="order-mini-item-price">{formatMoney((item.price || 0) * (item.quantity || 1))}</span>
                </div>
              ))}
            </div>

            {selectedBulkOrder.adminRemarks && (
              <p className="profile-order-detail-note"><strong>Admin Notes:</strong> {selectedBulkOrder.adminRemarks}</p>
            )}

            <div className="profile-cancel-modal-actions">
              <button className="profile-cancel-order-btn secondary" onClick={() => setSelectedBulkOrder(null)}>Close</button>
              {(selectedBulkOrder.trackingEnabled || isTrackableBulkStatus(selectedBulkOrder.approvalStatus || selectedBulkOrder.status)) && (
                <Link className="profile-cancel-order-btn" to={`/bulk-orders/${selectedBulkOrder.bulkOrderId || selectedBulkOrder.id}/tracking`}>
                  Track Bulk Order
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {selectedCustomOrder && (
        <div className="profile-cancel-modal-overlay" onClick={() => setSelectedCustomOrder(null)}>
          <div className="profile-cancel-modal profile-order-detail-modal" onClick={(event) => event.stopPropagation()}>
            <h3>Custom Order {selectedCustomOrder.requestId || selectedCustomOrder.id}</h3>
            <div className="profile-order-detail-grid">
              <p><strong>Status:</strong> {formatCustomStatus(selectedCustomOrder.status)}</p>
              <p><strong>Created:</strong> {formatDate(selectedCustomOrder.createdAt)}</p>
              <p><strong>Delivery Date:</strong> {formatDate(selectedCustomOrder.userConfirmation?.details?.deliveryDate)}</p>
              <p><strong>Flavor:</strong> {selectedCustomOrder.userConfirmation?.details?.flavor || '-'}</p>
              <p><strong>Weight:</strong> {selectedCustomOrder.userConfirmation?.details?.weightKg ? `${selectedCustomOrder.userConfirmation.details.weightKg}kg` : '-'}</p>
              <p><strong>Payment:</strong> {formatStatus(selectedCustomOrder.paymentMethod || 'pending')}</p>
              <p><strong>Payment Status:</strong> {formatStatus(selectedCustomOrder.paymentStatus)}</p>
              <p><strong>Quote:</strong> {selectedCustomOrder.adminQuote?.quotedPrice ? formatMoney(selectedCustomOrder.adminQuote.quotedPrice) : 'Pending quote'}</p>
            </div>

            {selectedCustomOrder.imageUrl && (
              <img
                src={resolveOrderImageUrl(selectedCustomOrder.imageUrl)}
                alt="Custom cake"
                className="profile-order-detail-image"
              />
            )}

            <div className="profile-order-detail-note">
              <strong>AI Description:</strong> {selectedCustomOrder.aiResult?.description || '-'}
            </div>

            {selectedCustomOrder.adminQuote?.quoteNotes && (
              <div className="profile-order-detail-note">
                <strong>Admin Quote Notes:</strong> {selectedCustomOrder.adminQuote.quoteNotes}
              </div>
            )}

            {selectedCustomOrder.adminReview?.rejectionReason && (
              <div className="profile-order-detail-note">
                <strong>Rejection Reason:</strong> {selectedCustomOrder.adminReview.rejectionReason}
              </div>
            )}

            {isSelectedCustomLocked && (
              <div className="profile-order-detail-note">
                <strong>Order Locked:</strong> {ORDER_LOCK_MESSAGE}
              </div>
            )}

            {pricingHistory.length > 0 && (
              <div className="profile-order-detail-history">
                <strong>Pricing History</strong>
                <div className="profile-order-detail-items">
                  {pricingHistory.map((entry, index) => (
                    <div key={`${entry.updatedAt || index}-${index}`} className="order-mini-item-row">
                      <span className="order-mini-item-name">
                        {formatDate(entry.updatedAt)} | {entry.source || 'admin update'}
                        {entry.preparationDays ? ` | ${entry.preparationDays} days` : ''}
                      </span>
                      <span className="order-mini-item-price">
                        {entry.quotedPrice ? formatMoney(entry.quotedPrice) : '-'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!isSelectedCustomLocked && canRespondToQuote && (
              <div className="profile-order-detail-decision">
                <strong>Price Confirmation</strong>
                <p className="profile-order-detail-note">Accept the price to unlock payment options, or reject with a reason.</p>
                <textarea
                  rows="2"
                  value={customRejectReason}
                  onChange={(event) => setCustomRejectReason(event.target.value)}
                  placeholder="Optional rejection reason"
                />
                <div className="profile-cancel-modal-actions">
                  <button
                    className="profile-cancel-order-btn secondary"
                    disabled={customDecisionLoading}
                    onClick={handleRejectCustomPrice}
                  >
                    {customDecisionLoading ? 'Updating...' : 'Reject Price'}
                  </button>
                  <button
                    className="profile-cancel-order-btn"
                    disabled={customDecisionLoading}
                    onClick={handleAcceptCustomPrice}
                  >
                    {customDecisionLoading ? 'Updating...' : 'Accept Price'}
                  </button>
                </div>
              </div>
            )}

            {!isSelectedCustomLocked && canSelectPayment && (
              <div className="profile-order-detail-decision">
                <strong>Payment Options</strong>
                <p className="profile-order-detail-note">Choose payment method and proceed to create your order.</p>
                <div className="profile-payment-methods">
                  <label>
                    <input
                      type="radio"
                      name="custom-payment-method"
                      checked={customPaymentMethod === 'online'}
                      onChange={() => setCustomPaymentMethod('online')}
                    />
                    Online Payment
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="custom-payment-method"
                      checked={customPaymentMethod === 'cash_on_delivery'}
                      onChange={() => setCustomPaymentMethod('cash_on_delivery')}
                    />
                    Cash on Delivery
                  </label>
                </div>
                <div className="profile-cancel-modal-actions">
                  <Link
                    className="profile-cancel-order-btn secondary"
                    to={`/custom-orders/${selectedCustomOrder.requestId || selectedCustomOrder._id}/payment`}
                  >
                    Open Payment Page
                  </Link>
                  <button
                    className="profile-cancel-order-btn"
                    onClick={handleCreateCustomOrder}
                    disabled={customCreateOrderLoading}
                  >
                    {customCreateOrderLoading ? 'Processing...' : 'Proceed with Payment'}
                  </button>
                </div>
              </div>
            )}

            <div className="profile-cancel-modal-actions">
              <button className="profile-cancel-order-btn secondary" onClick={() => setSelectedCustomOrder(null)}>Close</button>
              {selectedCustomOrder.generatedOrderId && (
                <Link className="profile-cancel-order-btn" to={`/orders/${selectedCustomOrder.generatedOrderId}/tracking`}>
                  Track Order
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
