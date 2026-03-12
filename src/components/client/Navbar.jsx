// src/components/client/Navbar.jsx (UPDATED)
import React, { useState, useContext, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, Menu, X, Cake, LogIn, UserPlus } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import { CartContext } from '../../context/CartContext';
import './Navbar.css';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef(null);
  const { user, admin, logout } = useContext(AuthContext);
  const isLoggedIn = !!user || !!admin;
  const { cartItems } = useContext(CartContext);
  const navigate = useNavigate();

  const cartItemsCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setIsProfileOpen(false);
    navigate('/');
  };

  const handleAdminDashboard = () => {
    setIsProfileOpen(false);
    if (admin) {
      navigate('/admin/dashboard');
    } else {
      navigate('/login', { state: { from: '/admin/dashboard', adminLogin: true } });
    }
  };

  const handleGuest = () => {
    setIsProfileOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo */}
        <Link to="/" className="navbar-logo">
          <Cake className="logo-icon" />
          <span className="logo-text">Cake House</span>
        </Link>


        {/* Navigation Links - REMOVED Admin Dashboard link */}
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
          {/* REMOVED: Admin Dashboard link from main Navbar */}
        </div>

        {/* User Actions */}
        <div className="nav-actions">
          <Link to="/cart" className="cart-icon">
            <ShoppingCart size={24} />
            {cartItemsCount > 0 && (
              <span className="cart-badge">{cartItemsCount}</span>
            )}
          </Link>

          <div className={`user-dropdown ${isProfileOpen ? 'open' : ''}`} ref={profileRef}>
            <button
              className="user-btn"
              title="Profile"
              onClick={() => setIsProfileOpen(!isProfileOpen)}
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
                    <button onClick={handleAdminDashboard} className="dropdown-item admin-item">
                      Admin Dashboard
                    </button>
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