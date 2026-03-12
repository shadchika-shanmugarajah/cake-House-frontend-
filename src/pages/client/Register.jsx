import React, { useState, useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { Mail, Lock, User, Phone, MapPin, Eye, EyeOff, UserPlus } from 'lucide-react';
import { toast } from 'react-toastify';
import './Register.css';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { loadUserFromStorage } = useContext(AuthContext);
  const from = (typeof location.state?.from === 'string' ? location.state.from : location.state?.from?.pathname) || '/';

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      // Store registered user (with password for login) + current session
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const registered = JSON.parse(localStorage.getItem('cakeHouseRegisteredUsers') || '[]');
      const existing = registered.find(u => u.email.toLowerCase() === formData.email.toLowerCase());
      if (existing) {
        const updated = registered.map(u => 
          u.email.toLowerCase() === formData.email.toLowerCase()
            ? { ...u, name: formData.name, phone: formData.phone, address: formData.address, password: formData.password }
            : u
        );
        localStorage.setItem('cakeHouseRegisteredUsers', JSON.stringify(updated));
      } else {
        registered.push({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          phone: formData.phone,
          address: formData.address,
        });
        localStorage.setItem('cakeHouseRegisteredUsers', JSON.stringify(registered));
      }

      const userData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        isAuthenticated: true,
        token: `demo-user-token-${Date.now()}`,
      };
      localStorage.setItem('userAuth', JSON.stringify(userData));
      loadUserFromStorage?.();
      toast.success('Registration successful!');
      navigate(from, { replace: true });
    } catch (error) {
      toast.error('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-container">
        <div className="register-header">
          <Link to="/" className="register-logo">
            🎂 Cake House
          </Link>
          <h1>Create Account</h1>
          <p>Join our sweet community</p>
        </div>

        <form onSubmit={handleSubmit} className="register-form">
          <div className="form-group">
            <div className="input-with-icon">
              <User size={20} />
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Full Name"
                required
              />
            </div>
          </div>

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
              />
            </div>
          </div>

          <div className="form-group">
            <div className="input-with-icon">
              <Phone size={20} />
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Phone Number"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <div className="input-with-icon">
              <MapPin size={20} />
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Address"
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
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div className="form-group">
            <div className="input-with-icon">
              <Lock size={20} />
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm Password"
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div className="terms-agreement">
            <input type="checkbox" id="terms" required />
            <label htmlFor="terms">
              I agree to the Terms of Service and Privacy Policy
            </label>
          </div>

          <button type="submit" className="register-btn" disabled={loading}>
            <UserPlus size={20} />
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>

          <p className="login-link">
            Already have an account?{' '}
            <Link to="/login">Sign in here</Link>
          </p>

          <Link to="/auth" className="back-to-auth">
            ← Back to role selection
          </Link>
        </form>
      </div>
    </div>
  );
};

export default Register;