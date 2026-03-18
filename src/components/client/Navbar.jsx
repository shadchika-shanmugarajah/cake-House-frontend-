import React, { useState, useContext, useRef, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, Menu, X, Cake, LogIn, UserPlus, Bell, CheckCheck } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import { CartContext } from '../../context/CartContext';
import { useOrders } from '../../context/OrderContext';
import { formatNotificationTime, getNotificationRedirectPath } from '../../utils/notificationRedirect';
import './Navbar.css';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const profileRef = useRef(null);
  const notificationRef = useRef(null);

  const { user, admin, logout } = useContext(AuthContext);
  const isLoggedIn = !!user || !!admin;
  const { cartItems } = useContext(CartContext);
  const {
    notifications,
    unreadNotificationCount,
    fetchNotifications,
    markNotificationRead,
    markAllNotificationsRead,
  } = useOrders();

  const navigate = useNavigate();

  const cartItemsCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  const latestNotifications = useMemo(() => notifications.slice(0, 6), [notifications]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setIsNotificationsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setIsProfileOpen(false);
    setIsNotificationsOpen(false);
    navigate('/');
  };

  const handleGuest = () => {
    setIsProfileOpen(false);
  };

  const openNotification = async (notification) => {
    if (!notification.read) {
      await markNotificationRead(notification.id);
    }

    setIsNotificationsOpen(false);
    navigate(getNotificationRedirectPath(notification));
  };

  const toggleNotifications = async () => {
    const next = !isNotificationsOpen;
    setIsNotificationsOpen(next);
    if (next) {
      fetchNotifications({ silent: true });
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo" onClick={() => setIsMenuOpen(false)}>
          <Cake className="logo-icon" />
          <span className="logo-text">Cake House</span>
        </Link>

        <button className="menu-toggle" onClick={() => setIsMenuOpen((prev) => !prev)} aria-label="Toggle menu">
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        <div className={`nav-menu ${isMenuOpen ? 'active' : ''}`}>
          <Link to="/" className="nav-link" onClick={() => setIsMenuOpen(false)}>
            Home
          </Link>
          <Link to="/products" className="nav-link" onClick={() => setIsMenuOpen(false)}>
            Cakes
          </Link>
          <Link to="/about" className="nav-link" onClick={() => setIsMenuOpen(false)}>
            About
          </Link>
        </div>

        <div className="nav-actions">
          {user && (
            <div className={`notification-dropdown ${isNotificationsOpen ? 'open' : ''}`} ref={notificationRef}>
              <button className="notification-btn" onClick={toggleNotifications} title="Notifications">
                <Bell size={22} />
                {unreadNotificationCount > 0 && (
                  <span className="notification-badge">{Math.min(unreadNotificationCount, 99)}</span>
                )}
              </button>

              {isNotificationsOpen && (
                <div className="notification-menu">
                  <div className="notification-menu-header">
                    <span>Notifications</span>
                    <button
                      type="button"
                      className="notification-mark-all"
                      onClick={markAllNotificationsRead}
                      disabled={unreadNotificationCount === 0}
                    >
                      <CheckCheck size={14} />
                      Mark all
                    </button>
                  </div>

                  <div className="notification-list">
                    {latestNotifications.length === 0 ? (
                      <div className="notification-empty">No notifications yet</div>
                    ) : (
                      latestNotifications.map((notification) => (
                        <button
                          type="button"
                          key={notification.id}
                          className={`notification-row ${notification.read ? 'read' : 'unread'}`}
                          onClick={() => openNotification(notification)}
                        >
                          <strong>{notification.title}</strong>
                          <p>{notification.message}</p>
                          <span>{formatNotificationTime(notification.createdAt)}</span>
                        </button>
                      ))
                    )}
                  </div>

                  <button
                    type="button"
                    className="notification-view-all"
                    onClick={() => {
                      setIsNotificationsOpen(false);
                      navigate('/notifications');
                    }}
                  >
                    View all notifications
                  </button>
                </div>
              )}
            </div>
          )}

          <Link to="/cart" className="cart-icon" onClick={() => setIsMenuOpen(false)}>
            <ShoppingCart size={24} />
            {cartItemsCount > 0 && (
              <span className="cart-badge">{cartItemsCount}</span>
            )}
          </Link>

          <div className={`user-dropdown ${isProfileOpen ? 'open' : ''}`} ref={profileRef}>
            <button
              className="user-btn"
              title="Profile"
              onClick={() => setIsProfileOpen((prev) => !prev)}
            >
              <User size={24} />
            </button>
            {isProfileOpen && (
              <div className="dropdown-menu">
                {isLoggedIn ? (
                  <>
                    <Link to="/profile" className="dropdown-item" onClick={() => setIsProfileOpen(false)}>
                      My Profile
                    </Link>
                    
                    <button onClick={handleLogout} className="dropdown-item">Logout</button>
                  </>
                ) : (
                  <>
                    <Link to="/login" className="dropdown-item" onClick={() => setIsProfileOpen(false)}>
                      <LogIn size={16} /> Login
                    </Link>
                    <Link to="/register" className="dropdown-item" onClick={() => setIsProfileOpen(false)}>
                      <UserPlus size={16} /> Register
                    </Link>
                    <button onClick={handleGuest} className="dropdown-item">
                      Continue as Guest
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
