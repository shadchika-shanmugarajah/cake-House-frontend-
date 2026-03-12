import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { UserPlus, Shield, Cake } from 'lucide-react';
import './Landing.css';

const Landing = () => {
  const location = useLocation();
  const from = location.state?.from || '/';

  return (
    <div className="auth-landing-page">
      <div className="auth-landing-container">
        <Link to="/" className="auth-landing-logo">
          <Cake size={32} />
          Cake House
        </Link>
        
        <div className="auth-landing-header">
          <h1>Welcome to Cake House</h1>
          <p>Choose how you'd like to continue</p>
        </div>

        <div className="auth-landing-cards">
          <Link to="/register" state={{ from }} className="auth-landing-card customer-card">
            <div className="auth-card-icon">
              <UserPlus size={48} />
            </div>
            <h2>I'm a Customer</h2>
            <p>Sign up with your details to browse, order cakes, and manage your profile</p>
            <span className="auth-card-cta">Create Account →</span>
          </Link>

          <Link to="/login" state={{ from }} className="auth-landing-card admin-card">
            <div className="auth-card-icon">
              <Shield size={48} />
            </div>
            <h2>I'm an Admin</h2>
            <p>Login with your admin credentials to access the panel</p>
            <span className="auth-card-cta">Admin Login →</span>
          </Link>
        </div>

        <div className="admin-credentials-info">
          <strong>Admin access?</strong>
          <p>Email: <code>admin@example.com</code> | Password: <code>admin123</code></p>
        </div>
        <p className="auth-landing-footer">
          <Link to="/">Continue as guest</Link> to browse without an account
        </p>
      </div>
    </div>
  );
};

export default Landing;
