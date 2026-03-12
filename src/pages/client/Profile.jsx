// src/pages/client/Profile.jsx (updated)
import React, { useContext, useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useOrders } from '../../context/OrderContext';
import { usersApi } from '../../api/api';
import { User, Mail, Shield, LogOut, Phone, MapPin, ShoppingBag, Edit2, X, Check, Bell, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import './Profile.css';

const Profile = () => {
  const { user, admin, logoutUser, logoutAdmin, loadUserFromStorage } = useAuth();
  const { orders, bulkOrders, getCustomerNotifications, markAllNotificationsRead } = useOrders();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ name: '', phone: '', address: '' });
  const [notifications, setNotifications] = useState([]);

  const isAdmin = !!admin;
  const currentUser = isAdmin ? admin : user;

  const orderCount = !isAdmin && user?.email
    ? orders.filter(o => o.customer?.email === user.email).length
    : 0;

  const unreadCount = notifications.filter(n => !n.read).length;
  const myBulkOrders = !isAdmin && user?.email
    ? bulkOrders.filter(o => o.customer?.email === user.email)
    : [];

  useEffect(() => {
    if (!isAdmin && user?.email) {
      getCustomerNotifications(user.email).then(setNotifications);
    } else {
      setNotifications([]);
    }
  }, [user?.email, isAdmin, getCustomerNotifications]);

  useEffect(() => {
    if (unreadCount > 0) {
      toast.info(`You have ${unreadCount} new notification${unreadCount > 1 ? 's' : ''}: ${notifications.find(n => !n.read)?.message || ''}`, { autoClose: 5000 });
    }
  }, [unreadCount]);

  const handleLogout = () => {
    if (isAdmin) {
      logoutAdmin();
      toast.success('Admin logged out successfully');
      navigate('/auth');
    } else {
      logoutUser();
      toast.success('Logged out successfully');
      navigate('/auth');
    }
  };

  const handleEdit = () => {
    setEditData({
      name: user?.name || '',
      phone: user?.phone || '',
      address: user?.address || '',
    });
    setIsEditing(true);
  };

  const handleSaveProfile = async () => {
    if (!user?.email) return;
    try {
      const updated = await usersApi.update(user.email, {
        name: editData.name,
        phone: editData.phone,
        address: editData.address,
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
    navigate('/auth');
    return null;
  }

  return (
    <div className="profile-page">
      <div className="profile-container">
        <div className="profile-header">
          <div className="profile-avatar">
            {isAdmin ? (
              <Shield size={48} />
            ) : (
              <User size={48} />
            )}
          </div>
          <h1>
            {isAdmin ? 'Admin Profile' : 'My Profile'}
            {isAdmin && (
              <span className="admin-badge">
                {admin.role}
              </span>
            )}
          </h1>
        </div>

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
                      onChange={e => setEditData({ ...editData, name: e.target.value })}
                      className="profile-edit-input"
                    />
                  ) : (
                    <p>{user?.name || '—'}</p>
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
                      onChange={e => setEditData({ ...editData, phone: e.target.value })}
                      className="profile-edit-input"
                    />
                  ) : (
                    <p>{user?.phone || '—'}</p>
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
                      onChange={e => setEditData({ ...editData, address: e.target.value })}
                      className="profile-edit-input"
                    />
                  ) : (
                    <p>{user?.address || '—'}</p>
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

        {!isAdmin && (notifications.length > 0 || myBulkOrders.length > 0) && (
          <div className="profile-notifications-section">
            <h3><Bell size={20} /> Notifications & Bulk Orders</h3>
            {notifications.length > 0 && (
              <div className="notifications-list">
                {notifications.slice(0, 5).map(notif => (
                  <div key={notif.id} className={`notification-item ${notif.read ? 'read' : 'unread'}`}>
                    <div className="notification-content">
                      <strong>{notif.orderId}</strong>
                      <p>{notif.message}</p>
                      <span className="notification-date">
                        {new Date(notif.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
                {unreadCount > 0 && (
                  <button
                    className="mark-read-btn"
                    onClick={() => markAllNotificationsRead(user.email)}
                  >
                    Mark all as read
                  </button>
                )}
              </div>
            )}
            {myBulkOrders.length > 0 && (
              <div className="bulk-orders-list">
                <h4><Package size={18} /> My Bulk Orders</h4>
                {myBulkOrders.map(bo => (
                  <div key={bo.id} className={`bulk-order-card status-${bo.status}`}>
                    <div className="bulk-order-id">{bo.id}</div>
                    <div className="bulk-order-meta">
                      <span>{bo.totalQuantity} pieces</span>
                      <span>${bo.total?.toFixed(2)}</span>
                      <span className={`bulk-status status-${bo.status}`}>
                        {bo.status === 'pending_approval' ? 'Pending' : bo.status === 'confirmed' ? 'Confirmed' : 'Cancelled'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
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
    </div>
  );
};

export default Profile;