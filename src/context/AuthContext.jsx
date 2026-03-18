// src/context/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import { authApi } from '../api/api';

const AuthContext = createContext({});
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [admin, setAdmin] = useState(null);

  const loadUserFromStorage = () => {
    const userData = localStorage.getItem('userAuth');
    if (userData) setUser(JSON.parse(userData));
  };

  useEffect(() => {
    const userData = localStorage.getItem('userAuth');
    const adminData = localStorage.getItem('adminAuth');
    if (userData) setUser(JSON.parse(userData));
    if (adminData) setAdmin(JSON.parse(adminData));
  }, []);

  const loginUser = async (email, password) => {
    try {
      const cleanEmail = String(email || '').trim().toLowerCase();
      const cleanPassword = String(password || '');

      if (!EMAIL_REGEX.test(cleanEmail)) {
        throw new Error('Please enter a valid email address');
      }
      if (!cleanPassword.trim()) {
        throw new Error('Password is required');
      }

      const res = await authApi.userLogin({ email: cleanEmail, password: cleanPassword });
      localStorage.setItem('userAuth', JSON.stringify(res.data));
      setUser(res.data);
      return res;
    } catch (err) {
      throw new Error(err.message || 'Invalid user credentials');
    }
  };

  const loginAdmin = async (email, password) => {
    try {
      const cleanEmail = String(email || '').trim().toLowerCase();
      const cleanPassword = String(password || '');

      if (!EMAIL_REGEX.test(cleanEmail)) {
        throw new Error('Please enter a valid email address');
      }
      if (!cleanPassword.trim()) {
        throw new Error('Password is required');
      }

      const res = await authApi.adminLogin({ email: cleanEmail, password: cleanPassword });
      localStorage.setItem('adminAuth', JSON.stringify(res.data));
      setAdmin(res.data);
      return res;
    } catch (err) {
      throw new Error(err.message || 'Invalid admin credentials');
    }
  };

  const logoutUser = () => {
    localStorage.removeItem('userAuth');
    setUser(null);
  };

  const logoutAdmin = () => {
    localStorage.removeItem('adminAuth');
    setAdmin(null);
  };

  const value = {
    user,
    admin,
    loginUser,
    loginAdmin,
    logoutUser,
    logoutAdmin,
    loadUserFromStorage,
    isUserAuthenticated: !!user,
    isAdminAuthenticated: !!admin,
    logout: () => {
      logoutUser();
      logoutAdmin();
    }
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Export AuthContext as a named export
export { AuthContext }; // Add this line
