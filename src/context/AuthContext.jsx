// src/context/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import { toast } from 'react-toastify';

// Create the context
const AuthContext = createContext({}); // This line creates AuthContext

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [admin, setAdmin] = useState(null);

  // Check for existing auth on mount
  useEffect(() => {
    const userData = localStorage.getItem('userAuth');
    const adminData = localStorage.getItem('adminAuth');
    
    if (userData) {
      setUser(JSON.parse(userData));
    }
    if (adminData) {
      setAdmin(JSON.parse(adminData));
    }
  }, []);

  // Demo admin credentials
  const demoAdmins = [
    { email: 'admin@example.com', password: 'admin123', role: 'superadmin' },
    { email: 'manager@example.com', password: 'manager123', role: 'manager' }
  ];

  // Demo regular users (for demo)
  const demoUsers = [
    { email: 'user@example.com', password: 'user123', name: 'Demo User' },
    { email: 'john@example.com', password: 'john123', name: 'John Doe' }
  ];

  const login = (email, password) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // First check if it's an admin
        const foundAdmin = demoAdmins.find(
          admin => admin.email === email && admin.password === password
        );
        
        if (foundAdmin) {
          const adminData = {
            email: foundAdmin.email,
            role: foundAdmin.role,
            isAuthenticated: true,
            token: `demo-admin-token-${Date.now()}`
          };
          
          localStorage.setItem('adminAuth', JSON.stringify(adminData));
          setAdmin(adminData);
          resolve({ type: 'admin', data: adminData });
        } 
        // Check if it's a regular user
        else {
          const foundUser = demoUsers.find(
            user => user.email === email && user.password === password
          );
          
          if (foundUser) {
            const userData = {
              email: foundUser.email,
              name: foundUser.name,
              isAuthenticated: true,
              token: `demo-user-token-${Date.now()}`
            };
            
            localStorage.setItem('userAuth', JSON.stringify(userData));
            setUser(userData);
            resolve({ type: 'user', data: userData });
          } 
          else {
            reject(new Error('Invalid credentials'));
          }
        }
      }, 500);
    });
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