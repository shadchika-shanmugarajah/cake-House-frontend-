import React, { useEffect, useMemo, useState } from 'react';
import AdminLayout from './AdminLayout';
import { inventoryApi } from '../../api/api';
import { Search, Edit, WarningAmber, Inventory2 } from '@mui/icons-material';
import { toast } from 'react-toastify';
import './AdminDashboard.css';

const getStatusBadge = (status) => {
  if (status === 'out-of-stock') return 'danger';
  if (status === 'low-stock') return 'warning';
  return 'success';
};

const toTitle = (value = '') => value
  .split('-')
  .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
  .join(' ');

const calcSummary = (items = []) => ({
  totalProducts: items.length,
  lowStockItems: items.filter((item) => item.stockStatus === 'low-stock').length,
  outOfStockItems: items.filter((item) => item.stockStatus === 'out-of-stock').length,
});

const AdminInventory = () => {
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState({ totalProducts: 0, lowStockItems: 0, outOfStockItems: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [stockTarget, setStockTarget] = useState(null);
  const [stockValue, setStockValue] = useState('0');
  const [thresholdValue, setThresholdValue] = useState('10');
  const [savingStock, setSavingStock] = useState(false);

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const data = await inventoryApi.getProductInventory();
        const inventoryItems = Array.isArray(data) ? data : (data.items || []);
        setItems(inventoryItems);
        setSummary(data.summary || calcSummary(inventoryItems));
      } catch (err) {
        console.error(err);
        toast.error('Failed to load inventory');
      } finally {
        setLoading(false);
      }
    };

    fetchInventory();
  }, []);

  const filtered = useMemo(() => items.filter((item) => {
    if (search && !(item.productName || '').toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== 'all' && item.stockStatus !== statusFilter) return false;
    return true;
  }), [items, search, statusFilter]);

  const openStockEditor = (item) => {
    setStockTarget(item);
    setStockValue(String(item.currentStock ?? 0));
    setThresholdValue(String(item.lowStockThreshold ?? 10));
  };

  const closeStockEditor = () => {
    setStockTarget(null);
    setStockValue('0');
    setThresholdValue('10');
    setSavingStock(false);
  };

  const handleStockUpdate = async () => {
    if (!stockTarget) return;

    const nextStock = Number.parseInt(stockValue, 10);
    const nextThreshold = Number.parseInt(thresholdValue, 10);

    if (!Number.isFinite(nextStock) || nextStock < 0) {
      toast.error('Stock must be a non-negative number');
      return;
    }

    if (!Number.isFinite(nextThreshold) || nextThreshold < 0) {
      toast.error('Low stock threshold must be a non-negative number');
      return;
    }

    setSavingStock(true);
    try {
      const response = await inventoryApi.updateProductStock(stockTarget.id || stockTarget._id, {
        stockQuantity: nextStock,
        lowStockThreshold: nextThreshold,
      });

      const updatedItem = response.item || response;
      const nextItems = items.map((item) => (
        (item.id || item._id) === (updatedItem.id || updatedItem._id) ? updatedItem : item
      ));

      setItems(nextItems);
      setSummary(calcSummary(nextItems));
      toast.success('Stock updated');
      closeStockEditor();
    } catch (err) {
      toast.error(err.message || 'Failed to update stock');
      setSavingStock(false);
    }
  };

  const totalNeedsRestock = summary.lowStockItems + summary.outOfStockItems;

  return (
    <AdminLayout>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Inventory Management</h1>
          <p className="admin-page-subtitle">Monitor product stock and low stock alerts</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <span className="admin-badge admin-badge-info">
            <Inventory2 style={{ fontSize: 14, marginRight: 4 }} />
            {summary.totalProducts} Products
          </span>
          <span className="admin-badge admin-badge-warning">
            <WarningAmber style={{ fontSize: 14, marginRight: 4 }} />
            {totalNeedsRestock} Need Restock
          </span>
        </div>
      </div>

      {totalNeedsRestock > 0 && (
        <div className="admin-table-container admin-animate-in" style={{ marginBottom: 16, borderColor: 'rgba(245, 158, 11, 0.35)' }}>
          <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 8, color: '#fbbf24', fontSize: 14, fontWeight: 600 }}>
            <WarningAmber style={{ fontSize: 18 }} />
            Low Stock Alert: {totalNeedsRestock} products are below safe stock level
          </div>
        </div>
      )}

      <div className="admin-table-container admin-animate-in">
        <div className="admin-table-header">
          <div className="admin-search">
            <span className="admin-search-icon"><Search /></span>
            <input
              placeholder="Search product..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="admin-filters">
            {['all', 'in-stock', 'low-stock', 'out-of-stock'].map((status) => (
              <button
                key={status}
                className={`admin-filter-chip${statusFilter === status ? ' active' : ''}`}
                onClick={() => setStatusFilter(status)}
              >
                {status === 'all' ? 'All' : toTitle(status)}
              </button>
            ))}
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Product Name', 'Current Stock', 'Low Stock Status', 'Threshold', 'Update Stock'].map((header) => (
                  <th
                    key={header}
                    style={{
                      padding: '12px 20px',
                      textAlign: 'left',
                      fontSize: 12,
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      color: 'var(--admin-text-secondary)',
                      borderBottom: '1px solid var(--admin-border)',
                    }}
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ padding: 48, textAlign: 'center', color: 'var(--admin-text-muted)' }}>Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: 48, textAlign: 'center', color: 'var(--admin-text-muted)' }}>No products found</td></tr>
              ) : filtered.map((item) => (
                <tr
                  key={item._id || item.id}
                  style={{ borderBottom: '1px solid var(--admin-border)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <td style={{ padding: '14px 20px', fontSize: 14, fontWeight: 600 }}>{item.productName}</td>
                  <td style={{ padding: '14px 20px', fontSize: 14, fontWeight: 600 }}>{item.currentStock}</td>
                  <td style={{ padding: '14px 20px' }}>
                    <span className={`admin-badge admin-badge-${getStatusBadge(item.stockStatus)}`}>
                      {toTitle(item.stockStatus)}
                    </span>
                  </td>
                  <td style={{ padding: '14px 20px', fontSize: 13 }}>{item.lowStockThreshold}</td>
                  <td style={{ padding: '14px 20px' }}>
                    <button
                      className="admin-btn admin-btn-outline"
                      style={{ padding: 6 }}
                      onClick={() => openStockEditor(item)}
                    >
                      <Edit fontSize="small" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {stockTarget && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            zIndex: 1200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
          onClick={closeStockEditor}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 420,
              background: '#111827',
              border: '1px solid var(--admin-border)',
              borderRadius: 12,
              padding: 20,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: 0, marginBottom: 12 }}>Update Stock</h3>
            <p style={{ margin: 0, marginBottom: 16, color: 'var(--admin-text-secondary)' }}>{stockTarget.productName}</p>

            <div style={{ display: 'grid', gap: 12 }}>
              <label style={{ display: 'grid', gap: 6, fontSize: 13 }}>
                Current Stock
                <input
                  type="number"
                  min="0"
                  value={stockValue}
                  onChange={(e) => setStockValue(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--admin-border)',
                    background: '#1f2937',
                    color: '#ffffff',
                  }}
                />
              </label>

              <label style={{ display: 'grid', gap: 6, fontSize: 13 }}>
                Low Stock Threshold
                <input
                  type="number"
                  min="0"
                  value={thresholdValue}
                  onChange={(e) => setThresholdValue(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--admin-border)',
                    background: '#1f2937',
                    color: '#ffffff',
                  }}
                />
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 18 }}>
              <button className="admin-btn admin-btn-outline" onClick={closeStockEditor} disabled={savingStock}>Cancel</button>
              <button className="admin-btn admin-btn-primary" onClick={handleStockUpdate} disabled={savingStock}>
                {savingStock ? 'Updating...' : 'Update Stock'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminInventory;

