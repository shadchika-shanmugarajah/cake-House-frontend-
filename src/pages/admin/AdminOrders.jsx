import React, { useCallback, useEffect, useMemo, useState } from 'react';
import AdminLayout from './AdminLayout';
import { ordersApi } from '../../api/api';
import { Search, Visibility, Close } from '@mui/icons-material';
import { toast } from 'react-toastify';
import './AdminDashboard.css';
import './AdminOrders.css';

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'ready', label: 'Ready' },
  { value: 'out_for_delivery', label: 'Out for Delivery' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

const statusColors = {
  pending: 'warning',
  in_progress: 'info',
  ready: 'info',
  out_for_delivery: 'info',
  delivered: 'success',
  cancelled: 'danger',
};

const formatCurrency = (value) => `Rs. ${Number(value || 0).toLocaleString()}`;
const formatDateTime = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString();
};
const formatOrderStatusLabel = (status) => {
  const normalized = String(status || 'pending');
  if (normalized === 'pending') return 'Pending';
  if (normalized === 'packed') return 'Ready';
  return normalized.replaceAll('_', ' ');
};
const formatPaymentMethod = (method) => {
  if (!method) return '—';
  if (method === 'cash_on_delivery') return 'Cash on Delivery';
  if (method === 'online') return 'Online Payment';
  return String(method).replaceAll('_', ' ');
};
const formatAddress = (address = {}) => (
  [address.street, address.city, address.state, address.zipCode, address.country]
    .filter(Boolean)
    .join(', ')
);

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState('');

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const data = await ordersApi.getAll();
      const list = Array.isArray(data) ? data : (data.orders || []);
      setOrders(list);
      setSelectedOrderId((prev) => prev || (list[0] ? (list[0].orderId || list[0].id) : ''));

      try { await ordersApi.markViewed(); } catch { /* ignore */ }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const status = order.status || order.orderStatus;
      if (statusFilter !== 'all' && status !== statusFilter) return false;

      if (!search) return true;
      const q = search.toLowerCase();
      return (
        (order.orderId || order.id || '').toLowerCase().includes(q) ||
        (order.customer?.name || '').toLowerCase().includes(q) ||
        (order.customer?.email || '').toLowerCase().includes(q)
      );
    });
  }, [orders, search, statusFilter]);

  const selectedOrder = useMemo(() => {
    if (!selectedOrderId) return null;
    return orders.find((order) => (order.orderId || order.id) === selectedOrderId) || null;
  }, [orders, selectedOrderId]);

  const openOrderDetails = (orderId) => {
    setSelectedOrderId(orderId);
    setDetailsOpen(true);
  };

  const handleStatusUpdate = async (orderId, nextStatus) => {
    setUpdatingOrderId(orderId);
    try {
      const updated = await ordersApi.updateStatus(orderId, nextStatus);
      setOrders((prev) => prev.map((order) => (
        (order.orderId || order.id) === orderId ? { ...order, ...updated } : order
      )));
      toast.success(`Order ${orderId} updated to ${nextStatus.replaceAll('_', ' ')}`);
    } catch (err) {
      toast.error(err.message || 'Failed to update order status');
    } finally {
      setUpdatingOrderId('');
    }
  };

  return (
    <AdminLayout>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Orders</h1>
          <p className="admin-page-subtitle">View details and manage normal order status updates</p>
        </div>
      </div>

      <div className="admin-table-container admin-animate-in" style={{ marginBottom: 20 }}>
        <div className="admin-table-header">
          <div className="admin-search">
            <span className="admin-search-icon"><Search /></span>
            <input
              placeholder="Search by order ID, customer name, or email"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="admin-filters">
            {['all', 'pending', 'in_progress', 'ready', 'out_for_delivery', 'delivered', 'cancelled'].map((status) => (
              <button
                key={status}
                className={`admin-filter-chip${statusFilter === status ? ' active' : ''}`}
                onClick={() => setStatusFilter(status)}
              >
                {status === 'all'
                  ? 'All'
                  : (status === 'pending'
                    ? 'Pending'
                    : status.replaceAll('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase()))}
              </button>
            ))}
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Order ID', 'Customer', 'Items', 'Total', 'Status', 'Update Status', 'Actions'].map((header) => (
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
                <tr><td colSpan={7} style={{ padding: 48, textAlign: 'center', color: 'var(--admin-text-muted)' }}>Loading orders...</td></tr>
              ) : filteredOrders.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: 48, textAlign: 'center', color: 'var(--admin-text-muted)' }}>No orders found</td></tr>
              ) : filteredOrders.map((order) => {
                const orderId = order.orderId || order.id;
                const status = order.status || order.orderStatus;
                const isUpdating = updatingOrderId === orderId;
                const isDelivered = status === 'delivered';
                const isCancelled = status === 'cancelled';
                const statusLabel = formatOrderStatusLabel(status || 'unknown');
                const cancelledLabel = order.cancelledBy === 'admin'
                  ? 'Canceled by admin'
                  : 'Canceled by customer';

                return (
                  <tr
                    key={order._id || orderId}
                    style={{
                      borderBottom: '1px solid var(--admin-border)',
                      background: selectedOrderId === orderId ? 'rgba(255,255,255,0.02)' : 'transparent',
                    }}
                  >
                    <td style={{ padding: '14px 20px', fontSize: 14, color: 'var(--admin-accent)', fontWeight: 600 }}>{orderId}</td>
                    <td style={{ padding: '14px 20px', fontSize: 14 }}>
                      <div>{order.customer?.name || '—'}</div>
                      <div style={{ fontSize: 12, color: 'var(--admin-text-secondary)' }}>{order.customer?.email || '—'}</div>
                    </td>
                    <td style={{ padding: '14px 20px', fontSize: 14 }}>{order.items?.length || 0}</td>
                    <td style={{ padding: '14px 20px', fontSize: 14, fontWeight: 600 }}>{formatCurrency(order.total || order.totalAmount)}</td>
                    <td style={{ padding: '14px 20px' }}>
                      <span className={`admin-badge admin-badge-${statusColors[status] || 'info'}`}>
                        {statusLabel}
                      </span>
                      {isCancelled && (
                        <div style={{ fontSize: 12, color: '#ef4444', marginTop: 4, fontWeight: 600 }}>
                          {cancelledLabel}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '14px 20px', minWidth: 180 }}>
                      <select
                        value={status}
                        onChange={(e) => handleStatusUpdate(orderId, e.target.value)}
                        disabled={isUpdating || isDelivered || isCancelled}
                        style={{
                          width: '100%',
                          padding: '8px 10px',
                          background: '#111827',
                          color: '#ffffff',
                          border: '1px solid var(--admin-border)',
                          borderRadius: 8,
                          opacity: (isUpdating || isDelivered || isCancelled) ? 0.7 : 1,
                        }}
                      >
                        {STATUS_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <button
                        onClick={() => openOrderDetails(orderId)}
                        style={{
                          border: '1px solid var(--admin-border)',
                          background: 'transparent',
                          color: 'var(--admin-text-primary)',
                          borderRadius: 8,
                          padding: '8px 10px',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        <Visibility style={{ fontSize: 16 }} /> View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {detailsOpen && selectedOrder && (
        <div className="admin-order-modal-overlay" onClick={() => setDetailsOpen(false)}>
          <div className="admin-order-modal" onClick={(event) => event.stopPropagation()}>
            <div className="admin-order-modal-header">
              <div>
                <h3>Order {selectedOrder.orderId || selectedOrder.id}</h3>
                <p>Created: {formatDateTime(selectedOrder.createdAt)}</p>
              </div>
              <button className="admin-order-modal-close" onClick={() => setDetailsOpen(false)} aria-label="Close details">
                <Close />
              </button>
            </div>

            <div className="admin-order-status-line">
              <span className={`admin-badge admin-badge-${statusColors[selectedOrder.status || selectedOrder.orderStatus] || 'info'}`}>
                {formatOrderStatusLabel(selectedOrder.status || selectedOrder.orderStatus)}
              </span>
              <span className="admin-order-status-meta">Last updated: {formatDateTime(selectedOrder.updatedAt)}</span>
            </div>

            <div className="admin-order-detail-grid">
              <section className="admin-order-detail-card">
                <h4>Customer</h4>
                <p><strong>Name:</strong> {selectedOrder.customer?.name || '—'}</p>
                <p><strong>Email:</strong> {selectedOrder.customer?.email || '—'}</p>
                <p><strong>Phone:</strong> {selectedOrder.customer?.phone || '—'}</p>
              </section>

              <section className="admin-order-detail-card">
                <h4>Delivery</h4>
                <p><strong>Date:</strong> {selectedOrder.deliveryDate ? formatDateTime(selectedOrder.deliveryDate) : '—'}</p>
                <p><strong>Slot:</strong> {selectedOrder.deliverySlot || selectedOrder.deliveryTime || '—'}</p>
                <p><strong>Type:</strong> {selectedOrder.deliveryType || 'delivery'}</p>
              </section>

              <section className="admin-order-detail-card">
                <h4>Payment</h4>
                <p><strong>Method:</strong> {formatPaymentMethod(selectedOrder.paymentMethod)}</p>
                <p><strong>Status:</strong> {formatOrderStatusLabel(selectedOrder.paymentStatus || 'pending')}</p>
              </section>

              <section className="admin-order-detail-card">
                <h4>Amount</h4>
                <p><strong>Subtotal:</strong> {formatCurrency(selectedOrder.subtotal)}</p>
                <p><strong>Tax:</strong> {formatCurrency(selectedOrder.tax)}</p>
                <p><strong>Shipping:</strong> {formatCurrency(selectedOrder.shipping)}</p>
                <p><strong>Discount:</strong> {formatCurrency(selectedOrder.discount)}</p>
                <p><strong>Total:</strong> {formatCurrency(selectedOrder.total || selectedOrder.totalAmount)}</p>
              </section>
            </div>

            <section className="admin-order-detail-card">
              <h4>Address</h4>
              <p>{formatAddress(selectedOrder.address) || '—'}</p>
            </section>

            <section className="admin-order-detail-card">
              <h4>Items ({selectedOrder.items?.length || 0})</h4>
              <div className="admin-order-items">
                {(selectedOrder.items || []).map((item) => (
                  <div key={item._id || item.id || `${item.productId}-${item.name}`} className="admin-order-item-row">
                    <div>
                      <strong>{item.name || item.productName || 'Product'}</strong>
                      <p>Qty: {item.quantity || 1}</p>
                    </div>
                    <div className="admin-order-item-price">{formatCurrency((item.price || 0) * (item.quantity || 1))}</div>
                  </div>
                ))}
              </div>
            </section>

            {(selectedOrder.notes || selectedOrder.cancelReason) && (
              <section className="admin-order-detail-card">
                <h4>Additional Details</h4>
                {selectedOrder.notes && <p><strong>Notes:</strong> {selectedOrder.notes}</p>}
                {selectedOrder.cancelReason && <p><strong>Cancel Reason:</strong> {selectedOrder.cancelReason}</p>}
              </section>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminOrders;

