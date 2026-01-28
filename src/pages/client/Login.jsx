// src/pages/client/Login.jsx (simplified)
import React, { useState, useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, LogIn, Eye, EyeOff, Shield, User } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import './Login.css';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await login(formData.email, formData.password);
      
      if (result.type === 'admin') {
        toast.success('Admin login successful!');
        navigate('/admin/dashboard');
      } else {
        toast.success('Login successful!');
        navigate(from, { replace: true });
      }
    } catch (error) {
      toast.error(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <Link to="/" className="login-logo">
            🎂 Cake House
          </Link>
          <h1>Welcome Back</h1>
          <p>Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <div className="input-with-icon">
              <Mail size={20} />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Email Address"
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
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <Link to="/forgot-password" className="forgot-password">
              Forgot password?
            </Link>
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            <LogIn size={20} />
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          <p className="signup-link">
            Don't have an account?{' '}
            <Link to="/register">Sign up here</Link>
          </p>

        
          <div className="quick-demo-section">
            <div className="demo-buttons">
              <button 
                type="button" 
                className="demo-btn admin-demo"
                onClick={() => {
                  setFormData({
                    email: 'admin@example.com',
                    password: 'admin123'
                  });
                  toast.info('Admin credentials filled. Click "Sign In" to login as admin.');
                }}
              >
              
              </button>
              <button 
                type="button" 
                className="demo-btn user-demo"
                onClick={() => {
                  setFormData({
                    email: 'user@example.com',
                    password: 'user123'
                  });
                  toast.info('User credentials filled. Click "Sign In" to login as user.');
                }}
              >
            
            
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;