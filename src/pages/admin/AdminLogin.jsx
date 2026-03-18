// src/pages/admin/AdminLogin.jsx
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, LogIn, Eye, EyeOff, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import './AdminLogin.css';

const AdminLogin = () => {
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { loginAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (typeof location.state?.from === 'string'
    ? location.state.from
    : location.state?.from?.pathname) || '/admin/dashboard';

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const email = formData.email.trim().toLowerCase();
    const password = formData.password;

    if (!EMAIL_REGEX.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }
    if (!password.trim()) {
      toast.error('Password is required');
      return;
    }

    setLoading(true);

    try {
      await loginAdmin(email, password);
      toast.success('Admin login successful!');
      navigate(from, { replace: true });
    } catch (error) {
      toast.error(error.message || 'Admin login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-container">
        <div className="admin-login-header">
          <Shield size={48} className="admin-login-icon" />
          <h1>Admin Portal</h1>
          <p>Secure access for authorized personnel only</p>
        </div>

        <form onSubmit={handleSubmit} className="admin-login-form">
          <div className="form-group">
            <div className="input-with-icon">
              <Mail size={20} />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Admin Email"
                required
                autoComplete="username"
              />
            </div>
          </div>

          <div className="form-group">
            <div className="input-with-icon">
              <Lock size={20} />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Password"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button type="submit" className="admin-login-btn" disabled={loading}>
            <LogIn size={20} />
            {loading ? 'Authenticating...' : 'Secure Login'}
          </button>
        </form>
        
        <div className="admin-login-footer">
          <p>Protected by Enterprise Auth Security</p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
