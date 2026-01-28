// src/components/admin/AdminProtectedRoute.jsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { Loader } from 'lucide-react';

const AdminProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAdminAuth();
  const location = useLocation();

  // Optional: Show loading state
  if (isAuthenticated === undefined) {
    return (
      <div className="admin-loading">
        <Loader className="spinner" size={40} />
        <p>Verifying admin access...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to admin login with return URL
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return children;
};

export default AdminProtectedRoute;