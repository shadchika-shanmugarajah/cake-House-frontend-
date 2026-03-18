import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Dashboard,
  ShoppingCart,
  LocalShipping,
  Assignment,
  Inventory2,
  Category,
  Warehouse,
  StarRate,
  Notifications,
  People,
  Logout,
  MenuOpen,
  Menu as MenuIcon,
} from '@mui/icons-material';
import './AdminDashboard.css';

const menuItems = [
  { path: '/admin/dashboard',      label: 'Dashboard',        icon: <Dashboard /> },
  { path: '/admin/orders',         label: 'Orders',           icon: <ShoppingCart /> },
  { path: '/admin/bulk-orders',    label: 'Bulk Orders',      icon: <LocalShipping /> },
  { path: '/admin/custom-orders',  label: 'Custom Orders',    icon: <Assignment /> },
  { path: '/admin/products',       label: 'Products',         icon: <Inventory2 /> },
  { path: '/admin/categories',     label: 'Categories',       icon: <Category /> },
  { path: '/admin/inventory',      label: 'Inventory',        icon: <Warehouse /> },
  { path: '/admin/reviews',        label: 'Ratings & Reviews',icon: <StarRate /> },
  { path: '/admin/notifications',  label: 'Notifications',    icon: <Notifications /> },
  { path: '/admin/users',          label: 'Users',            icon: <People /> },
];

const AdminSidebar = ({ collapsed, onToggle, badges = {} }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logoutAdmin } = useAuth();

  const handleLogout = () => {
    logoutAdmin();
    navigate('/admin/login');
  };

  return (
    <aside className={`admin-sidebar${collapsed ? ' collapsed' : ''}`}>
      {/* Header */}
      <div className="admin-sidebar-header">
        <div className="admin-sidebar-logo">
          <span className="admin-sidebar-logo-icon">🍰</span>
          <span>Cake House</span>
        </div>
        <button className="admin-sidebar-toggle" onClick={onToggle} title="Collapse">
          <MenuOpen />
        </button>
      </div>

      {/* Navigation */}
      <nav className="admin-sidebar-nav">
        {menuItems.map((item) => {
          const active = location.pathname === item.path;
          const badge = badges[item.path];
          return (
            <button
              key={item.path}
              className={`admin-nav-item${active ? ' active' : ''}`}
              onClick={() => navigate(item.path)}
              title={collapsed ? item.label : ''}
            >
              <span className="admin-nav-icon">{item.icon}</span>
              <span className="admin-nav-label">{item.label}</span>
              {badge > 0 && <span className="admin-nav-badge">{badge}</span>}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="admin-sidebar-footer">
        <button className="admin-nav-item logout" onClick={handleLogout}>
          <span className="admin-nav-icon"><Logout /></span>
          <span className="admin-nav-label">Logout</span>
        </button>
      </div>
    </aside>
  );
};

const AdminLayout = ({ children, badges = {} }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="admin-layout">
      {/* Mobile overlay */}
      <div
        className={`admin-sidebar-overlay${mobileOpen ? ' visible' : ''}`}
        onClick={() => setMobileOpen(false)}
      />

      {/* Sidebar */}
      <AdminSidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
        badges={badges}
      />

      {/* Main content */}
      <div className="admin-main">
        {/* Mobile menu button */}
        <div style={{
          display: 'none',
          padding: '12px 16px',
          borderBottom: '1px solid var(--admin-border, rgba(255,255,255,0.06))',
        }} className="admin-mobile-header">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            style={{ background: 'none', border: 'none', color: '#fff', fontSize: 24, cursor: 'pointer', display: 'flex' }}
          >
            <MenuIcon />
          </button>
        </div>

        <div className="admin-content">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
export { AdminSidebar };
