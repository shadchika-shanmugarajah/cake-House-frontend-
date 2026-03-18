import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Dashboard as DashboardIcon,
  ShoppingCart as OrdersIcon,
  Inventory as ProductsIcon,
  Category as CategoryIcon,
  People as CustomersIcon,
  LocalShipping as BulkIcon,
  Warehouse as InventoryIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  Analytics as AnalyticsIcon,
} from '@mui/icons-material';

const menuItems = [
  { path: '/admin/dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
  { path: '/admin/orders', label: 'Orders', icon: <OrdersIcon /> },
  { path: '/admin/products', label: 'Products', icon: <ProductsIcon /> },
  { path: '/admin/categories', label: 'Categories', icon: <CategoryIcon /> },
  { path: '/admin/bulk-orders', label: 'Bulk Orders', icon: <BulkIcon /> },
  { path: '/admin/customers', label: 'Customers', icon: <CustomersIcon /> },
  { path: '/admin/inventory', label: 'Inventory', icon: <InventoryIcon /> },
  { path: '/admin/settings', label: 'Settings', icon: <SettingsIcon /> },
];

/**
 * Reusable admin sidebar navigation.
 *
 * Props:
 *   collapsed  - Boolean, collapse to icon-only mode
 *   onToggle   - Callback when collapse toggle is clicked
 */
const AdminSidebar = ({ collapsed = false, onToggle }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logoutAdmin } = useAuth();

  const handleLogout = () => {
    logoutAdmin();
    navigate('/admin/login');
  };

  const styles = {
    sidebar: {
      width: collapsed ? 72 : 260,
      minHeight: '100vh',
      background: 'var(--sidebar-bg, #13131A)',
      borderRight: '1px solid var(--border-color, rgba(255,255,255,0.06))',
      display: 'flex',
      flexDirection: 'column',
      transition: 'width 0.3s ease',
      overflow: 'hidden',
      position: 'sticky',
      top: 0,
    },
    header: {
      padding: collapsed ? '20px 12px' : '20px 20px',
      borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.06))',
      display: 'flex',
      alignItems: 'center',
      justifyContent: collapsed ? 'center' : 'space-between',
      gap: 8,
    },
    logo: {
      fontSize: collapsed ? 20 : 18,
      fontWeight: 700,
      color: 'var(--text-primary, #fff)',
      whiteSpace: 'nowrap',
    },
    toggleBtn: {
      background: 'none',
      border: 'none',
      color: 'var(--text-secondary, #888)',
      cursor: 'pointer',
      fontSize: 18,
      padding: 4,
    },
    nav: {
      flex: 1,
      padding: '12px 8px',
      display: 'flex',
      flexDirection: 'column',
      gap: 2,
    },
    menuItem: (active) => ({
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: collapsed ? '12px' : '12px 16px',
      borderRadius: '10px',
      color: active ? '#6C63FF' : 'var(--text-secondary, #aaa)',
      background: active ? 'rgba(108, 99, 255, 0.1)' : 'transparent',
      fontWeight: active ? 600 : 400,
      fontSize: 14,
      cursor: 'pointer',
      border: 'none',
      width: '100%',
      textAlign: 'left',
      transition: 'all 0.2s ease',
      justifyContent: collapsed ? 'center' : 'flex-start',
      whiteSpace: 'nowrap',
    }),
    footer: {
      padding: '16px 8px',
      borderTop: '1px solid var(--border-color, rgba(255,255,255,0.06))',
    },
  };

  return (
    <div style={styles.sidebar}>
      <div style={styles.header}>
        {!collapsed && <span style={styles.logo}>🍰 Cake House</span>}
        {collapsed && <span style={styles.logo}>🍰</span>}
        {onToggle && !collapsed && (
          <button style={styles.toggleBtn} onClick={onToggle} title="Collapse sidebar">
            ◀
          </button>
        )}
        {onToggle && collapsed && (
          <button style={{ ...styles.toggleBtn, marginTop: 8 }} onClick={onToggle} title="Expand sidebar">
            ▶
          </button>
        )}
      </div>

      <nav style={styles.nav}>
        {menuItems.map((item) => {
          const active = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              style={styles.menuItem(active)}
              onMouseEnter={(e) => {
                if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
              }}
              onMouseLeave={(e) => {
                if (!active) e.currentTarget.style.background = 'transparent';
              }}
              title={collapsed ? item.label : ''}
            >
              <span style={{ fontSize: 20, display: 'flex' }}>{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      <div style={styles.footer}>
        <button
          onClick={handleLogout}
          style={{
            ...styles.menuItem(false),
            color: '#f87171',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(248,113,113,0.08)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <span style={{ fontSize: 20, display: 'flex' }}><LogoutIcon /></span>
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );
};

export default AdminSidebar;
