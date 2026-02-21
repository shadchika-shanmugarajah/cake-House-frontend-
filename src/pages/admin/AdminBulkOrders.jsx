import React, { useState } from 'react';
import {
  Package, Eye, CheckCircle, XCircle, Clock, Calendar,
  User, Phone, Mail, MapPin, Search, Filter, Cake, AlertCircle
} from 'lucide-react';
import { useOrders } from '../../context/OrderContext';
import { toast } from 'react-toastify';
import './AdminBulkOrders.css';

const AdminBulkOrders = () => {
  const { bulkOrders, confirmBulkOrder, cancelBulkOrder } = useOrders();
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredOrders = bulkOrders.filter(order => {
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    const matchesSearch = searchQuery === '' ||
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedOrder(null);
  };

  const handleConfirm = (orderId) => {
    confirmBulkOrder(orderId);
    toast.success(`Bulk order ${orderId} confirmed! Customer will be notified.`);
    closeModal();
  };

  const handleCancel = (orderId) => {
    cancelBulkOrder(orderId);
    toast.info(`Bulk order ${orderId} has been cancelled.`);
    closeModal();
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending_approval': return <Clock size={16} />;
      case 'confirmed': return <CheckCircle size={16} />;
      case 'cancelled': return <XCircle size={16} />;
      default: return <Clock size={16} />;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending_approval': return 'Pending Approval';
      case 'confirmed': return 'Confirmed';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  };

  const formatTime = (time) => {
    if (!time) return 'N/A';
    const [h, m] = time.split(':');
    const hour = parseInt(h);
    return `${hour > 12 ? hour - 12 : hour}:${m} ${hour >= 12 ? 'PM' : 'AM'}`;
  };

  const stats = {
    total: bulkOrders.length,
    pending: bulkOrders.filter(o => o.status === 'pending_approval').length,
    confirmed: bulkOrders.filter(o => o.status === 'confirmed').length,
    cancelled: bulkOrders.filter(o => o.status === 'cancelled').length,
  };

  return (
    <div className="bulk-admin-page">
      <div className="bulk-admin-header">
        <div className="bulk-admin-header-left">
          <div className="bulk-admin-header-icon">
            <Package size={24} />
          </div>
          <div>
            <h1>Bulk Orders</h1>
            <p>Review and manage bulk order requests</p>
          </div>
        </div>
        <div className="bulk-admin-stats">
          <div className="bulk-stat-card">
            <div className="bulk-stat-label">Total</div>
            <div className="bulk-stat-value">{stats.total}</div>
          </div>
          <div className="bulk-stat-card pending">
            <div className="bulk-stat-label">Pending</div>
            <div className="bulk-stat-value">{stats.pending}</div>
          </div>
          <div className="bulk-stat-card confirmed">
            <div className="bulk-stat-label">Confirmed</div>
            <div className="bulk-stat-value">{stats.confirmed}</div>
          </div>
          <div className="bulk-stat-card cancelled">
            <div className="bulk-stat-label">Cancelled</div>
            <div className="bulk-stat-value">{stats.cancelled}</div>
          </div>
        </div>
      </div>

      <div className="bulk-admin-toolbar">
        <div className="bulk-admin-search">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search by order ID or customer name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="bulk-admin-filters">
          <Filter size={16} />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="pending_approval">Pending Approval</option>
            <option value="confirmed">Confirmed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="bulk-admin-empty">
          <Package size={60} />
          <h3>No bulk orders found</h3>
          <p>
            {bulkOrders.length === 0
              ? 'Bulk order requests from customers will appear here.'
              : 'No orders match your current filters.'}
          </p>
        </div>
      ) : (
        <div className="bulk-admin-table-container">
          <table className="bulk-admin-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Preferred Date</th>
                <th>Total Qty</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map(order => (
                <tr key={order.id}>
                  <td>
                    <span className="bulk-order-id">{order.id}</span>
                  </td>
                  <td>
                    <div className="bulk-customer-cell">
                      <User size={14} />
                      <span>{order.customer?.name || 'N/A'}</span>
                    </div>
                  </td>
                  <td>
                    <div className="bulk-items-cell">
                      {order.items?.slice(0, 2).map((item, idx) => (
                        <div key={idx} className="bulk-item-tag">
                          <Cake size={12} />
                          {item.name} x{item.quantity}
                        </div>
                      ))}
                      {order.items?.length > 2 && (
                        <span className="bulk-more-items">+{order.items.length - 2} more</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="bulk-date-cell">
                      <Calendar size={14} />
                      <span>{order.preferredDate || order.deliveryDate || 'N/A'}</span>
                    </div>
                  </td>
                  <td>
                    <span className="bulk-qty-badge">{order.totalQuantity} pcs</span>
                  </td>
                  <td>
                    <span className="bulk-amount">${order.total?.toFixed(2)}</span>
                  </td>
                  <td>
                    <span className={`bulk-status-badge status-${order.status}`}>
                      {getStatusIcon(order.status)}
                      {getStatusLabel(order.status)}
                    </span>
                  </td>
                  <td>
                    <div className="bulk-action-buttons">
                      <button
                        className="bulk-action-btn view"
                        onClick={() => handleViewOrder(order)}
                      >
                        <Eye size={14} />
                        View
                      </button>
                      {order.status === 'pending_approval' && (
                        <>
                          <button
                            className="bulk-action-btn confirm"
                            onClick={() => handleConfirm(order.id)}
                          >
                            <CheckCircle size={14} />
                          </button>
                          <button
                            className="bulk-action-btn cancel"
                            onClick={() => handleCancel(order.id)}
                          >
                            <XCircle size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && selectedOrder && (
        <div className="bulk-modal-overlay" onClick={closeModal}>
          <div className="bulk-modal-content" onClick={(e) => e.stopPropagation()}>
            <button onClick={closeModal} className="bulk-modal-close">&times;</button>

            <div className="bulk-modal-header">
              <div>
                <h2>{selectedOrder.id}</h2>
                <span className={`bulk-status-badge status-${selectedOrder.status}`}>
                  {getStatusIcon(selectedOrder.status)}
                  {getStatusLabel(selectedOrder.status)}
                </span>
              </div>
              <div className="bulk-modal-total">${selectedOrder.total?.toFixed(2)}</div>
            </div>

            <div className="bulk-modal-grid">
              <div className="bulk-modal-section">
                <h3><User size={18} /> Customer Details</h3>
                <div className="bulk-modal-info">
                  <div className="bulk-modal-info-item">
                    <User size={16} />
                    <div>
                      <label>Name</label>
                      <span>{selectedOrder.customer?.name}</span>
                    </div>
                  </div>
                  <div className="bulk-modal-info-item">
                    <Mail size={16} />
                    <div>
                      <label>Email</label>
                      <span>{selectedOrder.customer?.email}</span>
                    </div>
                  </div>
                  <div className="bulk-modal-info-item">
                    <Phone size={16} />
                    <div>
                      <label>Phone</label>
                      <span>{selectedOrder.customer?.phone}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bulk-modal-section">
                <h3><Calendar size={18} /> Schedule</h3>
                <div className="bulk-modal-info">
                  <div className="bulk-modal-info-item">
                    <Calendar size={16} />
                    <div>
                      <label>Preferred Date</label>
                      <span>{formatDate(selectedOrder.preferredDate || selectedOrder.deliveryDate)}</span>
                    </div>
                  </div>
                  <div className="bulk-modal-info-item">
                    <Clock size={16} />
                    <div>
                      <label>Preferred Time</label>
                      <span>{formatTime(selectedOrder.preferredTime || selectedOrder.deliveryTime)}</span>
                    </div>
                  </div>
                  {selectedOrder.alternateDate && (
                    <div className="bulk-modal-info-item">
                      <Calendar size={16} />
                      <div>
                        <label>Alternate Date</label>
                        <span>{formatDate(selectedOrder.alternateDate)} at {formatTime(selectedOrder.alternateTime)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bulk-modal-section">
              <h3><Package size={18} /> Delivery</h3>
              <div className="bulk-modal-delivery-row">
                <span><strong>Type:</strong> {selectedOrder.deliveryOption === 'delivery' ? 'Home Delivery' : 'Takeaway'}</span>
                <span><strong>Qty:</strong> {selectedOrder.totalQuantity} pieces</span>
              </div>
              {selectedOrder.address && (
                <div className="bulk-modal-info-item">
                  <MapPin size={16} />
                  <div>
                    <label>Address</label>
                    <span>{selectedOrder.address}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="bulk-modal-section">
              <h3><Cake size={18} /> Order Items</h3>
              <div className="bulk-modal-items">
                {selectedOrder.items?.map((item, idx) => (
                  <div key={idx} className="bulk-modal-item">
                    <img src={item.image} alt={item.name} className="bulk-modal-item-img" />
                    <div className="bulk-modal-item-info">
                      <span className="bulk-modal-item-name">{item.name}</span>
                      <div className="bulk-modal-item-meta">
                        <span>${item.price?.toFixed(2)} each</span>
                        <span>Qty: {item.quantity}</span>
                      </div>
                    </div>
                    <span className="bulk-modal-item-total">
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {(selectedOrder.additionalNotes || selectedOrder.specialInstructions) && (
              <div className="bulk-modal-section">
                <h3><AlertCircle size={18} /> Notes</h3>
                <p className="bulk-modal-notes">
                  {selectedOrder.additionalNotes || selectedOrder.specialInstructions}
                </p>
              </div>
            )}

            <div className="bulk-modal-summary">
              <div className="bulk-modal-summary-row">
                <span>Subtotal</span>
                <span>${selectedOrder.subtotal?.toFixed(2)}</span>
              </div>
              <div className="bulk-modal-summary-row">
                <span>Tax</span>
                <span>${selectedOrder.tax?.toFixed(2)}</span>
              </div>
              <div className="bulk-modal-summary-row">
                <span>Shipping</span>
                <span>${selectedOrder.shipping?.toFixed(2)}</span>
              </div>
              <div className="bulk-modal-summary-row total">
                <span>Total</span>
                <span>${selectedOrder.total?.toFixed(2)}</span>
              </div>
            </div>

            {selectedOrder.status === 'pending_approval' && (
              <div className="bulk-modal-actions">
                <button
                  className="bulk-modal-btn confirm"
                  onClick={() => handleConfirm(selectedOrder.id)}
                >
                  <CheckCircle size={18} />
                  Confirm Order
                </button>
                <button
                  className="bulk-modal-btn cancel"
                  onClick={() => handleCancel(selectedOrder.id)}
                >
                  <XCircle size={18} />
                  Cancel Order
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBulkOrders;
