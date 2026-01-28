// src/components/admin/AdminLayout.jsx
import React, { useState } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { 
  LogOut, Home, Cake, ShoppingCart, Users, Package, 
  Award, Bell, Search, Menu, X, ChevronDown, Settings, Shield
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import './AdminLayout.css';

const AdminLayout = ({ children }) => {
  const { admin, logoutAdmin } = useAuth();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [openSubmenu, setOpenSubmenu] = useState(null);

  const handleLogout = () => {
    logoutAdmin();
    toast.success('Admin logged out successfully');
    navigate('/login');
  };

  const toggleSubmenu = (menu) => {
    setOpenSubmenu(openSubmenu === menu ? null : menu);
  };

  // ... rest of your AdminLayout component (similar to AdminDashboard sidebar/topbar)

  return (
    <div className="admin-layout">
      {/* Sidebar and Topbar similar to AdminDashboard */}
      <Outlet />
    </div>
  );
};

export default AdminLayout;