// src/context/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import { toast } from 'react-toastify';
import { authApi } from '../api/api';

const AuthContext = createContext({});

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

  const login = async (email, password) => {
    try {
      const res = await authApi.login({ email, password });
      if (res.type === 'admin') {
        localStorage.setItem('adminAuth', JSON.stringify(res.data));
        setAdmin(res.data);
        return res;
      }
      localStorage.setItem('userAuth', JSON.stringify(res.data));
      setUser(res.data);
      return res;
    } catch (err) {
      throw new Error(err.message || 'Invalid credentials');
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
    login,
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