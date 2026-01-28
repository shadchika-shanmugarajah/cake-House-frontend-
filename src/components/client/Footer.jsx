import React from 'react';
import { Link } from 'react-router-dom';
import { Cake, Facebook, Instagram, Twitter, Mail, Phone, MapPin } from 'lucide-react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-grid">
          {/* Company Info */}
          <div className="footer-section">
            <div className="footer-logo">
              <Cake size={32} />
              <span className="logo-text">Cake House</span>
            </div>
            <p className="footer-description">
              Creating sweet memories one cake at a time. Freshly baked with love and premium ingredients.
            </p>
            <div className="social-links">
              <a href="#" className="social-link" aria-label="Facebook">
                <Facebook size={20} />
              </a>
              <a href="#" className="social-link" aria-label="Instagram">
                <Instagram size={20} />
              </a>
              <a href="#" className="social-link" aria-label="Twitter">
                <Twitter size={20} />
              </a>
            </div>
          </div>

          {/* Quick Links - Vertical List */}
          <div className="footer-section">
            <h3>Quick Links</h3>
            <ul className="footer-links">
              <li><Link to="/">Home</Link></li>
              <li><Link to="/products">Our Cakes</Link></li>
              <li><Link to="/about">About Us</Link></li>
          
            </ul>
          </div>

          {/* Categories - Vertical List */}
          <div className="footer-section">
            <h3>Categories</h3>
            <ul className="footer-links">
              <li><Link to="/products?category=birthday">Birthday Cakes</Link></li>
              <li><Link to="/products?category=wedding">Wedding Cakes</Link></li>
              <li><Link to="/products?category=anniversary">Anniversary Cakes</Link></li>
              <li><Link to="/products?category=custom">Custom Cakes</Link></li>
              
            </ul>
          </div>

          
           
        </div>

        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} Cake House. All rights reserved.</p>
        
        </div>
      </div>
    </footer>
  );
};

export default Footer;