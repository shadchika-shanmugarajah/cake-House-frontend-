import React, { useEffect, useMemo, useState } from 'react';
import AdminLayout from './AdminLayout';
import { analyticsApi } from '../../api/api';
import {
  Today,
  DateRange,
  AttachMoney,
  HourglassTop,
  CheckCircle,
  LocalShipping,
  WarningAmber,
  ShoppingCart,
} from '@mui/icons-material';
import './AdminDashboard.css';

const formatCurrency = (value) => `Rs. ${Number(value || 0).toLocaleString()}`;

const StatCard = ({ icon, iconBg, iconColor, value, label }) => (
  <div className="admin-stat-card admin-animate-in">
    <div className="admin-stat-card-header">
      <div className="admin-stat-icon" style={{ background: iconBg, color: iconColor }}>
        {icon}
      </div>
    </div>
    <div className="admin-stat-value">{value}</div>
    <div className="admin-stat-label">{label}</div>
  </div>
);

const RevenueBars = ({ data }) => {
  const maxRevenue = useMemo(
    () => Math.max(...(data || []).map((item) => item.revenue || 0), 0),
    [data],
  );

  return (
    <div className="admin-analytics-bars">
      {(data || []).map((item, idx) => {
        const heightPct = maxRevenue > 0 ? Math.max(((item.revenue || 0) / maxRevenue) * 100, 6) : 6;
        const showLabel = idx % 2 === 0 || idx === data.length - 1;
        return (
          <div className="admin-analytics-bar-col" key={item.date}>
            <div
              className="admin-analytics-bar"
              style={{ height: `${heightPct}%` }}
              title={`${item.date}: ${formatCurrency(item.revenue || 0)} (${item.orders || 0} orders)`}
            />
            <span className="admin-analytics-bar-label">{showLabel ? item.date.slice(5) : ''}</span>
          </div>
        );
      })}
    </div>
  );
};

const StatusBreakdown = ({ rows }) => {
  const total = (rows || []).reduce((sum, row) => sum + (row.count || 0), 0);

  return (
    <div className="admin-status-list">
      {(rows || []).map((row) => {
        const widthPct = total > 0 ? ((row.count || 0) / total) * 100 : 0;
        return (
          <div className="admin-status-row" key={row.status}>
            <div className="admin-status-header">
              <span>{row.label}</span>
              <span>{row.count}</span>
            </div>
            <div className="admin-status-track">
              <span style={{ width: `${widthPct}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

const AdminDashboard = () => {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    const fetchDashboard = async () => {
      try {
        const data = await analyticsApi.getDashboard();
        if (!mounted) return;
        setDashboard(data);
      } catch (err) {
        if (!mounted) return;
        setError(err?.message || 'Failed to load dashboard analytics');
        console.error('Failed to fetch analytics dashboard:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchDashboard();
    return () => {
      mounted = false;
    };
  }, []);

  const summary = dashboard?.summary || {};
  const charts = dashboard?.charts || {};
  const topProducts = dashboard?.topProducts || [];
  const lowStockItems = dashboard?.inventory?.lowStockItems || [];

  const cards = [
    {
      icon: <Today />,
      iconBg: 'var(--admin-success-bg)',
      iconColor: 'var(--admin-success)',
      value: formatCurrency(summary.dailySales),
      label: 'Daily Sales',
    },
    {
      icon: <DateRange />,
      iconBg: 'var(--admin-info-bg)',
      iconColor: 'var(--admin-info)',
      value: formatCurrency(summary.weeklySales),
      label: 'Weekly Sales',
    },
    {
      icon: <AttachMoney />,
      iconBg: 'var(--admin-accent-bg)',
      iconColor: 'var(--admin-accent)',
      value: formatCurrency(summary.monthlyRevenue),
      label: 'Monthly Revenue',
    },
    {
      icon: <HourglassTop />,
      iconBg: 'var(--admin-warning-bg)',
      iconColor: 'var(--admin-warning)',
      value: summary.pendingOrders ?? 0,
      label: 'Pending Orders',
    },
    {
      icon: <CheckCircle />,
      iconBg: 'rgba(16, 185, 129, 0.15)',
      iconColor: '#10B981',
      value: summary.deliveredOrders ?? 0,
      label: 'Delivered Orders',
    },
    {
      icon: <WarningAmber />,
      iconBg: 'var(--admin-danger-bg)',
      iconColor: 'var(--admin-danger)',
      value: summary.lowStockItems ?? 0,
      label: 'Low Stock Items',
    },
    {
      icon: <LocalShipping />,
      iconBg: 'rgba(250, 204, 21, 0.12)',
      iconColor: '#EAB308',
      value: summary.bulkOrdersCount ?? 0,
      label: 'Bulk Orders Count',
    },
    {
      icon: <ShoppingCart />,
      iconBg: 'rgba(56, 189, 248, 0.12)',
      iconColor: '#38BDF8',
      value: summary.totalOrders ?? 0,
      label: 'Total Orders',
    },
  ];

  return (
    <AdminLayout badges={{ '/admin/orders': summary.unreadOrders, '/admin/bulk-orders': summary.pendingBulkOrders }}>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Analytics Dashboard</h1>
          <p className="admin-page-subtitle">Sales, orders, inventory, and product performance at a glance.</p>
        </div>
      </div>

      {error && <div className="admin-dashboard-error">{error}</div>}

      <div className="admin-stats-grid">
        {cards.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>

      <div className="admin-analytics-grid">
        <div className="admin-table-container admin-animate-in">
          <div className="admin-table-header">
            <span className="admin-table-title">Daily Sales Trend (Last 14 Days)</span>
          </div>
          <div className="admin-analytics-panel">
            {loading ? <p className="admin-analytics-empty">Loading chart...</p> : <RevenueBars data={charts.dailySales || []} />}
          </div>
        </div>

        <div className="admin-table-container admin-animate-in">
          <div className="admin-table-header">
            <span className="admin-table-title">Order Status Distribution</span>
          </div>
          <div className="admin-analytics-panel">
            {loading ? <p className="admin-analytics-empty">Loading status...</p> : <StatusBreakdown rows={charts.orderStatus || []} />}
          </div>
        </div>
      </div>

      <div className="admin-analytics-grid admin-analytics-grid-bottom">
        <div className="admin-table-container admin-animate-in">
          <div className="admin-table-header">
            <span className="admin-table-title">Top-Selling Products</span>
          </div>
          <div className="admin-analytics-table-wrap">
            <table className="admin-analytics-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Qty Sold</th>
                  <th>Orders</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {!loading && topProducts.length === 0 && (
                  <tr>
                    <td colSpan="4" className="admin-analytics-empty-cell">No product sales data yet.</td>
                  </tr>
                )}
                {(topProducts || []).map((item) => (
                  <tr key={`${item.productId || item.productName}`}>
                    <td>{item.productName}</td>
                    <td>{item.totalQuantity || 0}</td>
                    <td>{item.orderCount || 0}</td>
                    <td>{formatCurrency(item.totalRevenue || 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="admin-table-container admin-animate-in">
          <div className="admin-table-header">
            <span className="admin-table-title">Low Stock Alert</span>
          </div>
          <div className="admin-low-stock-list">
            {loading && <p className="admin-analytics-empty">Loading stock insights...</p>}
            {!loading && lowStockItems.length === 0 && (
              <p className="admin-analytics-empty">All products are currently above threshold.</p>
            )}
            {lowStockItems.map((item) => (
              <div className="admin-low-stock-item" key={item._id}>
                <div>
                  <p className="admin-low-stock-name">{item.productName}</p>
                  <p className="admin-low-stock-sub">Threshold: {item.lowStockThreshold}</p>
                </div>
                <span className={`admin-low-stock-pill ${item.status}`}>{item.stockQuantity} left</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
