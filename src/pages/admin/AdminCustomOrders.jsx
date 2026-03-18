import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Search, Visibility } from '@mui/icons-material';
import { toast } from 'react-toastify';
import AdminLayout from './AdminLayout';
import { customOrdersApi } from '../../api/api';
import './AdminDashboard.css';

const statusColors = {
  awaiting_admin_quote: 'warning',
  awaiting_user_confirmation: 'warning',
  awaiting_user_acceptance: 'info',
  awaiting_user_payment: 'info',
  in_progress: 'info',
  ready: 'info',
  out_for_delivery: 'info',
  delivered: 'success',
  rejected: 'danger',
  cancelled: 'danger',
};

const customStatusTransitions = {
  awaiting_admin_quote: ['awaiting_user_acceptance', 'rejected'],
  awaiting_user_confirmation: ['awaiting_admin_quote', 'rejected'],
  awaiting_user_acceptance: ['awaiting_user_payment', 'rejected'],
  awaiting_user_payment: ['rejected'],
  price_accepted: ['awaiting_user_payment', 'rejected'],
  in_progress: ['ready', 'rejected'],
  ready: ['out_for_delivery', 'rejected'],
  out_for_delivery: ['delivered'],
  delivered: [],
  rejected: [],
  cancelled: [],
};

const adminQuickStatusActions = ['ready', 'out_for_delivery', 'delivered', 'rejected'];

const formatStatus = (value) => String(value || 'unknown').replaceAll('_', ' ');
const formatCurrency = (value) => `Rs. ${Number(value || 0).toLocaleString()}`;

const AdminCustomOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [form, setForm] = useState({
    editedDescription: '',
    quotedPrice: '',
    preparationDays: '',
    quoteNotes: '',
    notes: '',
    rejectionReason: '',
    message: '',
  });

  const loadOrders = useCallback(async (opts = {}) => {
    const nextPage = Number(opts.page || 1);
    setLoading(true);
    try {
      const response = await customOrdersApi.getAdminAll({
        page: nextPage,
        limit: 20,
        status: statusFilter,
        search: search.trim(),
      });
      setOrders(Array.isArray(response?.items) ? response.items : []);
      setPagination(response?.pagination || { page: nextPage, limit: 20, total: 0, totalPages: 1 });
      setPage(nextPage);
    } catch (err) {
      toast.error(err.message || 'Failed to load custom orders');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    loadOrders({ page: 1 });
  }, [search, statusFilter, loadOrders]);

  const selectedId = selectedOrder?.requestId || selectedOrder?._id || '';
  const selectedNormalized = useMemo(() => {
    if (!selectedOrder) return null;
    return orders.find((item) => item.requestId === selectedOrder.requestId) || selectedOrder;
  }, [orders, selectedOrder]);
  const selectedCurrentStatus = String(selectedNormalized?.status || '').trim();
  const selectedAdminDecision = String(selectedNormalized?.adminReview?.decision || '').trim().toLowerCase();
  const isStatusLocked = ['delivered', 'rejected', 'cancelled'].includes(selectedCurrentStatus);
  const canShowApproveReject = !['approved', 'rejected'].includes(selectedAdminDecision);
  const allowedNextStatuses = useMemo(
    () => customStatusTransitions[selectedCurrentStatus] || [],
    [selectedCurrentStatus]
  );
  const statusDropdownOptions = useMemo(() => {
    const values = [selectedCurrentStatus, ...allowedNextStatuses].filter(Boolean);
    return Array.from(new Set(values));
  }, [allowedNextStatuses, selectedCurrentStatus]);

  const openOrder = async (order) => {
    try {
      const response = await customOrdersApi.getAdminById(order.requestId);
      const item = response?.item || order;
      setSelectedOrder(item);
      setForm({
        editedDescription: item?.adminReview?.editedDescription || item?.aiResult?.description || '',
        quotedPrice: item?.adminQuote?.quotedPrice ?? '',
        preparationDays: item?.adminQuote?.preparationDays ?? '',
        quoteNotes: item?.adminQuote?.quoteNotes || '',
        notes: item?.adminReview?.notes || '',
        rejectionReason: item?.adminReview?.rejectionReason || '',
        message: '',
      });
    } catch (err) {
      toast.error(err.message || 'Failed to load custom order details');
    }
  };

  const mergeUpdatedItem = (item) => {
    if (!item) return;
    setOrders((prev) => prev.map((order) => (order.requestId === item.requestId ? item : order)));
    setSelectedOrder(item);
  };

  const withAction = async (fn) => {
    setActionLoading(true);
    try {
      await fn();
    } finally {
      setActionLoading(false);
    }
  };

  const handleReviewSave = () => withAction(async () => {
    if (!selectedId) return;
    const response = await customOrdersApi.review(selectedId, {
      editedDescription: form.editedDescription,
      quotedPrice: form.quotedPrice === '' ? undefined : Number(form.quotedPrice),
      preparationDays: form.preparationDays === '' ? undefined : Number(form.preparationDays),
      quoteNotes: form.quoteNotes,
      notes: form.notes,
    });
    mergeUpdatedItem(response?.item);
    toast.success('Custom order review saved');
  });

  const handleApprove = () => withAction(async () => {
    if (!selectedId) return;
    const quotedPrice = Number(form.quotedPrice);
    if (!Number.isFinite(quotedPrice) || quotedPrice <= 0) {
      toast.error('Please set a valid quoted price before approval');
      return;
    }

    const response = await customOrdersApi.approve(selectedId, {
      editedDescription: form.editedDescription,
      quotedPrice,
      preparationDays: form.preparationDays === '' ? undefined : Number(form.preparationDays),
      quoteNotes: form.quoteNotes,
      notes: form.notes,
      message: form.message,
    });
    mergeUpdatedItem(response?.item);
    toast.success('Custom order approved and quote sent');
  });

  const handleReject = () => withAction(async () => {
    if (!selectedId) return;
    if (!String(form.rejectionReason || '').trim()) {
      toast.error('Rejection reason is required');
      return;
    }
    const response = await customOrdersApi.reject(selectedId, {
      reason: form.rejectionReason,
      notes: form.notes,
    });
    mergeUpdatedItem(response?.item);
    toast.success('Custom order rejected');
  });

  const handleSendMessage = () => withAction(async () => {
    if (!selectedId) return;
    if (!String(form.message || '').trim()) {
      toast.error('Message cannot be empty');
      return;
    }
    await customOrdersApi.sendMessage(selectedId, {
      title: 'Message from Cake House',
      message: form.message,
    });
    setForm((prev) => ({ ...prev, message: '' }));
    toast.success('Message sent to customer');
  });

  const handleStatusUpdate = async (nextStatus) => {
    if (!selectedId || !nextStatus) return;
    if (isStatusLocked) return;
    if (nextStatus === selectedCurrentStatus) return;
    setStatusUpdating(true);
    try {
      const response = await customOrdersApi.updateStatus(selectedId, nextStatus);
      mergeUpdatedItem(response?.item);
      toast.success(`Custom order status updated to ${formatStatus(nextStatus)}`);
    } catch (err) {
      toast.error(err.message || 'Failed to update custom order status');
    } finally {
      setStatusUpdating(false);
    }
  };

  const imageUrl = useMemo(() => {
    const raw = selectedNormalized?.imageUrl || '';
    if (!raw) return '';
    if (raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('blob:') || raw.startsWith('data:')) return raw;
    return `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${raw}`;
  }, [selectedNormalized]);

  const userDetails = selectedNormalized?.userConfirmation?.details || {};
  const filterOptions = [
    'all',
    'awaiting_admin_quote',
    'awaiting_user_confirmation',
    'awaiting_user_acceptance',
    'awaiting_user_payment',
    'in_progress',
    'ready',
    'out_for_delivery',
    'delivered',
    'rejected',
  ];

  return (
    <AdminLayout>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Custom Orders</h1>
          <p className="admin-page-subtitle">Review AI requests, edit details, set price, and approve or reject custom cake orders</p>
        </div>
      </div>

      <div className="admin-table-container admin-animate-in">
        <div className="admin-table-header">
          <div className="admin-search">
            <span className="admin-search-icon"><Search /></span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by custom order ID"
            />
          </div>

          <div className="admin-filters">
            {filterOptions.map((status) => (
              <button
                key={status}
                className={`admin-filter-chip${statusFilter === status ? ' active' : ''}`}
                onClick={() => setStatusFilter(status)}
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
                {['Request ID', 'Customer', 'Status', 'Quoted Price', 'Created', 'Actions'].map((heading) => (
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
                <tr>
                  <td colSpan={6} style={{ padding: 48, textAlign: 'center', color: 'var(--admin-text-muted)' }}>
                    Loading custom orders...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: 48, textAlign: 'center', color: 'var(--admin-text-muted)' }}>
                    No custom orders found
                  </td>
                </tr>
              ) : orders.map((order) => (
                <tr key={order.requestId} style={{ borderBottom: '1px solid var(--admin-border)' }}>
                  <td style={{ padding: '14px 20px', color: 'var(--admin-accent)', fontWeight: 600 }}>{order.requestId}</td>
                  <td style={{ padding: '14px 20px' }}>
                    <div>{order.customer?.name || 'Customer'}</div>
                    <div style={{ fontSize: 12, color: 'var(--admin-text-secondary)' }}>{order.customer?.email || '-'}</div>
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <span className={`admin-badge admin-badge-${statusColors[order.status] || 'info'}`}>
                      {formatStatus(order.status)}
                    </span>
                  </td>
                  <td style={{ padding: '14px 20px', fontWeight: 600 }}>
                    {order.adminQuote?.quotedPrice ? formatCurrency(order.adminQuote.quotedPrice) : '-'}
                  </td>
                  <td style={{ padding: '14px 20px', color: 'var(--admin-text-secondary)' }}>
                    {order.createdAt ? new Date(order.createdAt).toLocaleString() : '-'}
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <button
                      className="admin-btn admin-btn-outline"
                      style={{ padding: '6px 12px', fontSize: 12 }}
                      onClick={() => openOrder(order)}
                    >
                      <Visibility style={{ fontSize: 16, marginRight: 6 }} />
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="admin-table-header" style={{ borderTop: '1px solid var(--admin-border)' }}>
          <span style={{ fontSize: 13, color: 'var(--admin-text-secondary)' }}>
            Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="admin-btn admin-btn-outline"
              onClick={() => loadOrders({ page: Math.max(1, page - 1) })}
              disabled={loading || page <= 1}
            >
              Previous
            </button>
            <button
              className="admin-btn admin-btn-outline"
              onClick={() => loadOrders({ page: Math.min(pagination.totalPages || 1, page + 1) })}
              disabled={loading || page >= (pagination.totalPages || 1)}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {selectedNormalized && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(8, 8, 12, 0.72)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1200,
          padding: 20,
        }}
        >
          <div style={{
            width: 'min(1100px, 96vw)',
            maxHeight: '90vh',
            overflow: 'auto',
            borderRadius: 14,
            border: '1px solid var(--admin-border)',
            background: 'var(--admin-card-bg)',
            boxShadow: 'var(--admin-shadow)',
          }}
          >
            <div className="admin-table-header">
              <div>
                <div className="admin-table-title">Custom Order Details</div>
                <div style={{ fontSize: 12, color: 'var(--admin-text-secondary)', marginTop: 4 }}>
                  {selectedNormalized.requestId} | {selectedNormalized.customer?.email || '-'}
                </div>
              </div>
              <button className="admin-btn admin-btn-outline" onClick={() => setSelectedOrder(null)}>Close</button>
            </div>

            <div style={{ padding: 20, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 18 }}>
              <div style={{ display: 'grid', gap: 14 }}>
                <div>
                  <strong>Uploaded Reference Image</strong>
                  <div style={{ marginTop: 8 }}>
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt="Custom cake reference"
                        style={{ width: '100%', maxHeight: 330, objectFit: 'cover', borderRadius: 10, border: '1px solid var(--admin-border)' }}
                      />
                    ) : (
                      <div style={{ border: '1px dashed var(--admin-border)', borderRadius: 10, padding: 20, color: 'var(--admin-text-secondary)' }}>
                        No image uploaded
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <strong>AI Generated Description</strong>
                  <p style={{ marginTop: 8, color: 'var(--admin-text-secondary)' }}>{selectedNormalized.aiResult?.description || '-'}</p>
                </div>

                <div>
                  <strong>User Confirmed Details</strong>
                  <div style={{ marginTop: 8, color: 'var(--admin-text-secondary)', fontSize: 14, display: 'grid', gap: 6 }}>
                    <div>Flavor: {userDetails.flavor || '-'}</div>
                    <div>Weight: {userDetails.weightKg ? `${userDetails.weightKg}kg` : '-'}</div>
                    <div>Message on Cake: {userDetails.messageOnCake || '-'}</div>
                    <div>Delivery Date: {userDetails.deliveryDate ? new Date(userDetails.deliveryDate).toLocaleDateString() : '-'}</div>
                    <div>Delivery Slot: {userDetails.deliverySlot || '-'}</div>
                    <div>Special Instructions: {userDetails.specialInstructions || '-'}</div>
                  </div>
                </div>

                {Array.isArray(selectedNormalized.pricingHistory) && selectedNormalized.pricingHistory.length > 0 && (
                  <div>
                    <strong>Pricing History</strong>
                    <div style={{ marginTop: 8, display: 'grid', gap: 6 }}>
                      {selectedNormalized.pricingHistory.slice(0, 6).map((entry, index) => (
                        <div
                          key={`${entry.updatedAt || index}-${index}`}
                          style={{
                            border: '1px solid var(--admin-border)',
                            borderRadius: 8,
                            padding: '8px 10px',
                            color: 'var(--admin-text-secondary)',
                            fontSize: 12,
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                            <span>{entry.source || 'admin update'}</span>
                            <strong style={{ color: 'var(--admin-text-primary)' }}>
                              {entry.quotedPrice ? formatCurrency(entry.quotedPrice) : '-'}
                            </strong>
                          </div>
                          <div style={{ marginTop: 4 }}>
                            {entry.preparationDays ? `${entry.preparationDays} days` : 'No prep time'} | {entry.updatedAt ? new Date(entry.updatedAt).toLocaleString() : '-'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gap: 10 }}>
                <label style={{ fontSize: 13, color: 'var(--admin-text-secondary)' }}>
                  Fulfillment Status
                  <select
                    value={selectedNormalized.status || ''}
                    onChange={(event) => handleStatusUpdate(event.target.value)}
                    disabled={statusUpdating || actionLoading || isStatusLocked}
                    style={{
                      width: '100%',
                      marginTop: 6,
                      padding: 10,
                      borderRadius: 10,
                      border: '1px solid var(--admin-border)',
                      background: '#111827',
                      color: '#ffffff',
                    }}
                  >
                    {statusDropdownOptions.map((value) => (
                      <option key={value} value={value}>{formatStatus(value)}</option>
                    ))}
                  </select>
                </label>
                <div style={{ marginTop: 4 }}>
                  <div style={{ fontSize: 13, color: 'var(--admin-text-secondary)', marginBottom: 6 }}>
                    Quick Status Update
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {adminQuickStatusActions.map((statusValue) => {
                      const canUse = allowedNextStatuses.includes(statusValue);
                      return (
                        <button
                          key={statusValue}
                          className={statusValue === 'rejected' ? 'admin-btn admin-btn-danger' : 'admin-btn admin-btn-outline'}
                          disabled={!canUse || statusUpdating || actionLoading || isStatusLocked}
                          onClick={() => handleStatusUpdate(statusValue)}
                          title={canUse ? `Update to ${formatStatus(statusValue)}` : 'This status is not allowed from current state'}
                        >
                          {formatStatus(statusValue)}
                        </button>
                      );
                    })}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--admin-text-muted)', marginTop: 6 }}>
                    Allowed next statuses: {allowedNextStatuses.length ? allowedNextStatuses.map(formatStatus).join(', ') : 'None'}
                  </div>
                </div>

                <label style={{ fontSize: 13, color: 'var(--admin-text-secondary)' }}>
                  Edit Description
                  <textarea
                    value={form.editedDescription}
                    onChange={(event) => setForm((prev) => ({ ...prev, editedDescription: event.target.value }))}
                    rows={4}
                    style={{ width: '100%', marginTop: 6, padding: 10, borderRadius: 10, border: '1px solid var(--admin-border)', background: 'rgba(255,255,255,0.03)', color: 'var(--admin-text-primary)' }}
                  />
                </label>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <label style={{ fontSize: 13, color: 'var(--admin-text-secondary)' }}>
                    Set Price (LKR)
                    <input
                      type="number"
                      min="0"
                      value={form.quotedPrice}
                      onChange={(event) => setForm((prev) => ({ ...prev, quotedPrice: event.target.value }))}
                      style={{ width: '100%', marginTop: 6, padding: 10, borderRadius: 10, border: '1px solid var(--admin-border)', background: 'rgba(255,255,255,0.03)', color: 'var(--admin-text-primary)' }}
                    />
                  </label>
                  <label style={{ fontSize: 13, color: 'var(--admin-text-secondary)' }}>
                    Preparation Time (Days)
                    <input
                      type="number"
                      min="1"
                      value={form.preparationDays}
                      onChange={(event) => setForm((prev) => ({ ...prev, preparationDays: event.target.value }))}
                      style={{ width: '100%', marginTop: 6, padding: 10, borderRadius: 10, border: '1px solid var(--admin-border)', background: 'rgba(255,255,255,0.03)', color: 'var(--admin-text-primary)' }}
                    />
                  </label>
                </div>

                <label style={{ fontSize: 13, color: 'var(--admin-text-secondary)' }}>
                  Admin Notes
                  <textarea
                    value={form.notes}
                    onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
                    rows={2}
                    style={{ width: '100%', marginTop: 6, padding: 10, borderRadius: 10, border: '1px solid var(--admin-border)', background: 'rgba(255,255,255,0.03)', color: 'var(--admin-text-primary)' }}
                  />
                </label>

                <label style={{ fontSize: 13, color: 'var(--admin-text-secondary)' }}>
                  Quote Notes (Shown to user)
                  <textarea
                    value={form.quoteNotes}
                    onChange={(event) => setForm((prev) => ({ ...prev, quoteNotes: event.target.value }))}
                    rows={2}
                    style={{ width: '100%', marginTop: 6, padding: 10, borderRadius: 10, border: '1px solid var(--admin-border)', background: 'rgba(255,255,255,0.03)', color: 'var(--admin-text-primary)' }}
                  />
                </label>

                <label style={{ fontSize: 13, color: 'var(--admin-text-secondary)' }}>
                  Manual Message To User
                  <textarea
                    value={form.message}
                    onChange={(event) => setForm((prev) => ({ ...prev, message: event.target.value }))}
                    rows={2}
                    placeholder="Optional direct message to user..."
                    style={{ width: '100%', marginTop: 6, padding: 10, borderRadius: 10, border: '1px solid var(--admin-border)', background: 'rgba(255,255,255,0.03)', color: 'var(--admin-text-primary)' }}
                  />
                </label>

                <label style={{ fontSize: 13, color: 'var(--admin-text-secondary)' }}>
                  Rejection Reason
                  <textarea
                    value={form.rejectionReason}
                    onChange={(event) => setForm((prev) => ({ ...prev, rejectionReason: event.target.value }))}
                    rows={2}
                    placeholder="Required when rejecting..."
                    style={{ width: '100%', marginTop: 6, padding: 10, borderRadius: 10, border: '1px solid var(--admin-border)', background: 'rgba(255,255,255,0.03)', color: 'var(--admin-text-primary)' }}
                  />
                </label>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
                  <button className="admin-btn admin-btn-outline" onClick={handleReviewSave} disabled={actionLoading}>Save Review</button>
                  {canShowApproveReject ? (
                    <>
                      <button className="admin-btn admin-btn-primary" onClick={handleApprove} disabled={actionLoading}>Approve Order</button>
                      <button className="admin-btn admin-btn-danger" onClick={handleReject} disabled={actionLoading}>Reject Order</button>
                    </>
                  ) : (
                    <span style={{ fontSize: 12, color: 'var(--admin-text-muted)', alignSelf: 'center' }}>
                      Admin decision already submitted ({selectedAdminDecision || selectedCurrentStatus}).
                    </span>
                  )}
                  <button className="admin-btn admin-btn-outline" onClick={handleSendMessage} disabled={actionLoading}>Message User</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminCustomOrders;

