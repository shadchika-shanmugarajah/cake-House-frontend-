// src/components/client/Navbar.jsx (UPDATED)
import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, Menu, X, Cake } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import { CartContext } from '../../context/CartContext';
import './Navbar.css';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout } = useContext(AuthContext);
  const { cartItems } = useContext(CartContext);
  const navigate = useNavigate();

  const cartItemsCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  const handleLogout = () => {
    logout();
    navigate('/');
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

          {user ? (
            <div className="user-dropdown">
              <button className="user-btn" title="My Account">
                <User size={24} />
              </button>
              <div className="dropdown-menu">
                <Link to="/profile" className="dropdown-item">My Profile</Link>
                {/* Admin Dashboard link only in dropdown menu */}
                {user.isAdmin && (
                  <Link to="/admin/dashboard" className="dropdown-item admin-item">
                    Admin Dashboard
                  </Link>
                )}
                <button onClick={handleLogout} className="dropdown-item">Logout</button>
              </div>
            </div>
          ) : (
            <Link to="/login" className="user-btn" title="Login">
              <User size={24} />
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;