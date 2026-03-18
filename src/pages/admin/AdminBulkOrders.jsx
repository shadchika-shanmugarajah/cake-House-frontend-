import React, { useCallback, useEffect, useMemo, useState } from 'react';
import AdminLayout from './AdminLayout';
import { bulkOrdersApi } from '../../api/api';
import { Search } from '@mui/icons-material';
import { toast } from 'react-toastify';
import './AdminDashboard.css';

const statusColors = {
  awaiting_admin_acceptance: 'warning',
  awaiting_user_payment: 'info',
  in_progress: 'info',
  ready: 'info',
  out_for_delivery: 'info',
  delivered: 'success',
  rejected: 'danger',
};

const normalizeStatus = (order) => {
  const raw = String(order.approvalStatus || order.status || 'awaiting_admin_acceptance').toLowerCase();
  if (raw === 'pending' || raw === 'pending_approval') return 'awaiting_admin_acceptance';
  if (raw === 'approved') return 'awaiting_user_payment';
  if (raw === 'completed') return 'delivered';
  return raw;
};
const formatStatus = (value) => String(value || '').replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());

const AdminBulkOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState('');

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const data = await bulkOrdersApi.getAll();
      setOrders(Array.isArray(data) ? data : (data.orders || []));
    } catch (err) {
      toast.error(err.message || 'Failed to load bulk orders');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    const poller = setInterval(() => {
      loadOrders();
    }, 5000);

    return () => clearInterval(poller);
  }, [loadOrders]);

  const filtered = useMemo(() => {
    return orders.filter((order) => {
      const status = normalizeStatus(order);
      const matchesFilter = filter === 'all' || status === filter;

      if (!matchesFilter) return false;
      if (!search.trim()) return true;

      const query = search.toLowerCase();
      return (
        (order.bulkOrderId || order.id || '').toLowerCase().includes(query)
        || (order.customer?.name || order.customerName || '').toLowerCase().includes(query)
        || (order.customer?.email || order.customerEmail || '').toLowerCase().includes(query)
      );
    });
  }, [orders, filter, search]);

  const applyOrderUpdate = (updatedOrder) => {
    const normalized = updatedOrder?.order || updatedOrder;
    setOrders((prev) => prev.map((order) => {
      const id = order.bulkOrderId || order.id;
      const updatedId = normalized.bulkOrderId || normalized.id;
      return id === updatedId ? { ...order, ...normalized } : order;
    }));
  };

  const handleApprove = async (orderId) => {
    setUpdatingId(orderId);
    try {
      const response = await bulkOrdersApi.approve(orderId);
      applyOrderUpdate(response);
      toast.success('Bulk order approved');
    } catch (err) {
      toast.error(err.message || 'Failed to approve bulk order');
    } finally {
      setUpdatingId('');
    }
  };

  const handleReject = async (orderId) => {
    setUpdatingId(orderId);
    try {
      const response = await bulkOrdersApi.reject(orderId);
      applyOrderUpdate(response);
      toast.success('Bulk order rejected');
    } catch (err) {
      toast.error(err.message || 'Failed to reject bulk order');
    } finally {
      setUpdatingId('');
    }
  };

  const handleStatusUpdate = async (orderId, status, successMessage = 'Bulk order status updated') => {
    setUpdatingId(orderId);
    try {
      const response = await bulkOrdersApi.updateStatus(orderId, status);
      applyOrderUpdate(response);
      toast.success(successMessage);
    } catch (err) {
      toast.error(err.message || 'Failed to update bulk order status');
    } finally {
      setUpdatingId('');
    }
  };

  return (
    <AdminLayout>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Bulk Orders</h1>
          <p className="admin-page-subtitle">Review and manage bulk order requests</p>
        </div>
      </div>

      <div className="admin-table-container admin-animate-in">
        <div className="admin-table-header">
          <div className="admin-search">
            <span className="admin-search-icon"><Search /></span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by bulk ID, customer name, or email"
            />
          </div>

          <div className="admin-filters">
            {['all', 'awaiting_admin_acceptance', 'awaiting_user_payment', 'in_progress', 'ready', 'out_for_delivery', 'delivered', 'rejected'].map((status) => (
              <button
                key={status}
                className={`admin-filter-chip${filter === status ? ' active' : ''}`}
                onClick={() => setFilter(status)}
              >
                {status === 'all' ? 'All' : formatStatus(status)}
              </button>
            ))}
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Bulk ID', 'Customer', 'Qty', 'Total', 'Delivery Date', 'Payment', 'Status', 'Actions'].map((heading) => (
                  <th
                    key={heading}
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
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ padding: 48, textAlign: 'center', color: 'var(--admin-text-muted)' }}>Loading bulk orders...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} style={{ padding: 48, textAlign: 'center', color: 'var(--admin-text-muted)' }}>No bulk orders found</td></tr>
              ) : filtered.map((order) => {
                const orderId = order.bulkOrderId || order.id;
                const status = normalizeStatus(order);
                const isUpdating = updatingId === orderId;
                const isAwaitingAdminAcceptance = status === 'awaiting_admin_acceptance';
                const isAwaitingUserPayment = status === 'awaiting_user_payment';
                const isInProgress = status === 'in_progress';
                const isReady = status === 'ready';
                const isOutForDelivery = status === 'out_for_delivery';
                const canReject = ['awaiting_admin_acceptance', 'awaiting_user_payment', 'in_progress', 'ready'].includes(status);

                return (
                  <tr key={order._id || orderId} style={{ borderBottom: '1px solid var(--admin-border)' }}>
                    <td style={{ padding: '14px 20px', color: 'var(--admin-accent)', fontWeight: 600 }}>{orderId}</td>
                    <td style={{ padding: '14px 20px' }}>
                      <div>{order.customer?.name || order.customerName || '-'}</div>
                      <div style={{ fontSize: 12, color: 'var(--admin-text-secondary)' }}>{order.customer?.email || order.customerEmail || '-'}</div>
                    </td>
                    <td style={{ padding: '14px 20px' }}>{order.totalQuantity || 0}</td>
                    <td style={{ padding: '14px 20px', fontWeight: 600 }}>Rs. {Number(order.totalAmount || order.total || 0).toLocaleString()}</td>
                    <td style={{ padding: '14px 20px', color: 'var(--admin-text-secondary)' }}>
                      {order.requestedDeliveryDate ? new Date(order.requestedDeliveryDate).toLocaleDateString() : order.preferredDate || '-'}
                    </td>
                    <td style={{ padding: '14px 20px', color: 'var(--admin-text-secondary)' }}>
                      <div>{order.paymentMethod ? order.paymentMethod.replace(/_/g, ' ') : 'Not selected'}</div>
                      <div style={{ fontSize: 12 }}>{order.paymentStatus || 'pending'}</div>
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <span className={`admin-badge admin-badge-${statusColors[status] || 'info'}`}>
                        {formatStatus(status)}
                      </span>
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      {isAwaitingAdminAcceptance ? (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            className="admin-btn admin-btn-primary"
                            style={{ padding: '6px 14px', fontSize: 12 }}
                            onClick={() => handleApprove(orderId)}
                            disabled={isUpdating}
                          >
                            Approve
                          </button>
                          <button
                            className="admin-btn admin-btn-danger"
                            style={{ padding: '6px 14px', fontSize: 12 }}
                            onClick={() => handleReject(orderId)}
                            disabled={isUpdating}
                          >
                            Reject
                          </button>
                        </div>
                      ) : isAwaitingUserPayment ? (
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <span style={{ color: 'var(--admin-text-secondary)', fontSize: 12 }}>
                            Waiting for user payment
                          </span>
                          {canReject && (
                            <button
                              className="admin-btn admin-btn-danger"
                              style={{ padding: '6px 14px', fontSize: 12 }}
                              onClick={() => handleReject(orderId)}
                              disabled={isUpdating}
                            >
                              Reject
                            </button>
                          )}
                        </div>
                      ) : isInProgress ? (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            className="admin-btn admin-btn-primary"
                            style={{ padding: '6px 14px', fontSize: 12 }}
                            onClick={() => handleStatusUpdate(orderId, 'ready', 'Bulk order marked as ready')}
                            disabled={isUpdating}
                          >
                            Ready
                          </button>
                          {canReject && (
                            <button
                              className="admin-btn admin-btn-danger"
                              style={{ padding: '6px 14px', fontSize: 12 }}
                              onClick={() => handleReject(orderId)}
                              disabled={isUpdating}
                            >
                              Reject
                            </button>
                          )}
                        </div>
                      ) : isReady ? (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            className="admin-btn admin-btn-primary"
                            style={{ padding: '6px 14px', fontSize: 12 }}
                            onClick={() => handleStatusUpdate(orderId, 'out_for_delivery', 'Bulk order is out for delivery')}
                            disabled={isUpdating}
                          >
                            Out for Delivery
                          </button>
                          {canReject && (
                            <button
                              className="admin-btn admin-btn-danger"
                              style={{ padding: '6px 14px', fontSize: 12 }}
                              onClick={() => handleReject(orderId)}
                              disabled={isUpdating}
                            >
                              Reject
                            </button>
                          )}
                        </div>
                      ) : isOutForDelivery ? (
                        <button
                          className="admin-btn admin-btn-primary"
                          style={{ padding: '6px 14px', fontSize: 12 }}
                          onClick={() => handleStatusUpdate(orderId, 'delivered', 'Bulk order marked as delivered')}
                          disabled={isUpdating}
                        >
                          Delivered
                        </button>
                      ) : (
                        <span style={{ color: 'var(--admin-text-secondary)', fontSize: 12 }}>No actions</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminBulkOrders;
