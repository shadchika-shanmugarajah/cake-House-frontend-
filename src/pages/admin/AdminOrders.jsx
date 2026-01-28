// src/pages/admin/AdminOrders.jsx
import React, { useState } from 'react';
import { 
  Eye, ShoppingCart, Filter, Search, Download, 
  Cake, User, MapPin, Phone, Mail, Calendar, 
  Package, CheckCircle, XCircle, Clock, Truck
} from 'lucide-react';
import { toast } from 'react-toastify';
import './AdminOrders.css'; // Import separate CSS

const AdminOrders = () => {
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const orders = [
    { 
      id: 'ORD-7842', 
      customer: 'John Doe', 
      date: 'Jan 15, 2026', 
      amount: 'Rs 1,299', 
      status: 'completed',
      items: [
        { name: 'Red Velvet Cake', quantity: 1, price: 'Rs 459' },
        { name: 'Chocolate Cupcakes', quantity: 6, price: 'Rs 840' }
      ],
      customerPhone: '+1 234 567 890',
      customerEmail: 'john@example.com',
      deliveryAddress: '123 Main St, New York, NY 10001',
      deliveryType: 'Home Delivery',
      paymentMethod: 'Credit Card',
      specialInstructions: 'Add birthday message: "Happy Birthday!"'
    },
    { 
      id: 'ORD-7841', 
      customer: 'Jane Smith', 
      date: 'Jan 14, 2026', 
      amount: 'Rs 3,450', 
      status: 'processing',
      items: [
        { name: 'Wedding Cake Large', quantity: 1, price: 'Rs 3,450' }
      ],
      customerPhone: '+1 234 567 891',
      customerEmail: 'jane@example.com',
      deliveryAddress: '456 Oak Ave, Los Angeles, CA 90001',
      deliveryType: 'Pickup',
      paymentMethod: 'Cash on Delivery',
      specialInstructions: 'Allergy: No nuts'
    },
    { 
      id: 'ORD-7840', 
      customer: 'Bob Johnson', 
      date: 'Jan 14, 2026', 
      amount: 'Rs 2,255', 
      status: 'pending',
      items: [
        { name: 'Custom Birthday Cake', quantity: 1, price: 'Rs 1,899' },
        { name: 'Assorted Pastries', quantity: 12, price: 'Rs 356' }
      ],
      customerPhone: '+1 234 567 892',
      customerEmail: 'bob@example.com',
      deliveryAddress: '789 Pine Rd, Chicago, IL 60601',
      deliveryType: 'Home Delivery',
      paymentMethod: 'Credit Card',
      specialInstructions: 'Custom design with blue frosting'
    },
    { 
      id: 'ORD-7839', 
      customer: 'Alice Brown', 
      date: 'Jan 13, 2026', 
      amount: 'Rs 625', 
      status: 'completed',
      items: [
        { name: 'Vanilla Berry Cake', quantity: 1, price: 'Rs 489' },
        { name: 'Coffee', quantity: 2, price: 'Rs 136' }
      ],
      customerPhone: '+1 234 567 893',
      customerEmail: 'alice@example.com',
      deliveryAddress: '321 Elm St, Houston, TX 77001',
      deliveryType: 'Pickup',
      paymentMethod: 'Debit Card',
      specialInstructions: 'No cream, extra berries'
    },
    { 
      id: 'ORD-7838', 
      customer: 'Charlie Wilson', 
      date: 'Jan 12, 2026', 
      amount: 'Rs 9,850', 
      status: 'delivered',
      items: [
        { name: 'Premium Wedding Cake', quantity: 1, price: 'Rs 9,850' }
      ],
      customerPhone: '+1 234 567 894',
      customerEmail: 'charlie@example.com',
      deliveryAddress: '654 Maple Dr, Phoenix, AZ 85001',
      deliveryType: 'Home Delivery',
      paymentMethod: 'Bank Transfer',
      specialInstructions: 'Three-tier cake with pink roses'
    },
  ];

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedOrder(null);
  };

  const updateOrderStatus = (orderId, newStatus) => {
    toast.success(`Order ${orderId} status updated to ${newStatus}`);
    closeModal();
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'pending': return <Clock size={16} />;
      case 'processing': return <Package size={16} />;
      case 'completed': return <CheckCircle size={16} />;
      case 'delivered': return <Truck size={16} />;
      case 'cancelled': return <XCircle size={16} />;
      default: return <Clock size={16} />;
    }
  };

  const stats = {
    total: 42,
    pending: 3,
    processing: 8,
    completed: 28,
    revenue: 'Rs 89,450'
  };

  return (
    <div className="orders-page">
      {/* Page Header */}
      <div className="orders-header">
        <div className="orders-header-left">
          <div className="orders-header-icon">
            <ShoppingCart size={24} />
          </div>
          <h1>Orders Management</h1>
        </div>
        <div className="orders-header-stats">
          <div className="order-stat-card">
            <div className="order-stat-label">Total Orders</div>
            <div className="order-stat-value">{stats.total}</div>
          </div>
          <div className="order-stat-card">
            <div className="order-stat-label">Pending</div>
            <div className="order-stat-value">{stats.pending}</div>
          </div>
          <div className="order-stat-card">
            <div className="order-stat-label">Processing</div>
            <div className="order-stat-value">{stats.processing}</div>
          </div>
          <div className="order-stat-card">
            <div className="order-stat-label">Revenue</div>
            <div className="order-stat-value">{stats.revenue}</div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="orders-toolbar">
        <div className="orders-search">
          <Search size={18} />
          <input type="text" placeholder="Search orders by ID, customer..." />
        </div>
        <div className="orders-filter-actions">
          <button className="order-action-btn secondary">
            <Filter size={16} />
            Filter
          </button>
          <button className="order-action-btn secondary">
            <Download size={16} />
            Export
          </button>
          <select className="order-action-btn secondary" style={{padding: '8px 16px'}}>
            <option>All Status</option>
            <option>Pending</option>
            <option>Processing</option>
            <option>Completed</option>
            <option>Cancelled</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="orders-table-container">
        <h3 className="orders-table-title">
          <ShoppingCart size={18} />
          Recent Orders
        </h3>
        
        <table className="orders-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Items</th>
              <th>Date</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td>
                  <div style={{ fontWeight: '600', color: 'var(--primary)' }}>
                    {order.id}
                  </div>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <User size={14} />
                    {order.customer}
                  </div>
                </td>
                <td>
                  <div className="order-items-cell">
                    {order.items.map((item, index) => (
                      <div key={index} className="order-item">
                        <Cake size={14} className="order-item-icon" />
                        <span className="order-item-name">{item.name}</span>
                        <span className="order-item-qty">x{item.quantity}</span>
                      </div>
                    ))}
                  </div>
                </td>
                <td>{order.date}</td>
                <td>
                  <div style={{ fontWeight: '600', color: 'var(--success)' }}>
                    {order.amount}
                  </div>
                </td>
                <td>
                  <span className={`order-status-badge status-${order.status}`}>
                    {getStatusIcon(order.status)}
                    <span style={{ marginLeft: '6px' }}>{order.status}</span>
                  </span>
                </td>
                <td>
                  <div className="order-actions">
                    <button 
                      className="order-action-btn"
                      onClick={() => handleViewOrder(order)}
                    >
                      <Eye size={14} />
                      View
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="orders-pagination">
          <button className="pagination-btn disabled">«</button>
          <button className="pagination-btn active">1</button>
          <button className="pagination-btn">2</button>
          <button className="pagination-btn">3</button>
          <button className="pagination-btn">»</button>
        </div>
      </div>

      {/* Order Details Modal */}
      {isModalOpen && selectedOrder && (
        <div className="modal-overlay">
          <div className="order-modal-content">
            <button onClick={closeModal} className="modal-close">×</button>
            
            <div className="order-modal-header">
              <h2 className="order-modal-title">{selectedOrder.id}</h2>
              <div className="order-total">{selectedOrder.amount}</div>
            </div>

            <div className="order-details-grid">
              {/* Customer Details */}
              <div className="order-detail-section">
                <h3 className="order-detail-title">
                  <User size={18} />
                  Customer Details
                </h3>
                <div className="modal-info-grid">
                  <div className="modal-info-item">
                    <User size={16} />
                    <div>
                      <div className="modal-info-label">Name</div>
                      <div className="modal-info-value">{selectedOrder.customer}</div>
                    </div>
                  </div>
                  <div className="modal-info-item">
                    <Phone size={16} />
                    <div>
                      <div className="modal-info-label">Phone</div>
                      <div className="modal-info-value">{selectedOrder.customerPhone}</div>
                    </div>
                  </div>
                  <div className="modal-info-item">
                    <Mail size={16} />
                    <div>
                      <div className="modal-info-label">Email</div>
                      <div className="modal-info-value">{selectedOrder.customerEmail}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Details */}
              <div className="order-detail-section">
                <h3 className="order-detail-title">
                  <Calendar size={18} />
                  Order Details
                </h3>
                <div className="modal-info-grid">
                  <div className="modal-info-item">
                    <Calendar size={16} />
                    <div>
                      <div className="modal-info-label">Date</div>
                      <div className="modal-info-value">{selectedOrder.date}</div>
                    </div>
                  </div>
                  <div className="modal-info-item">
                    <MapPin size={16} />
                    <div>
                      <div className="modal-info-label">Delivery Type</div>
                      <div className="modal-info-value">{selectedOrder.deliveryType}</div>
                    </div>
                  </div>
                  <div className="modal-info-item">
                    <ShoppingCart size={16} />
                    <div>
                      <div className="modal-info-label">Payment Method</div>
                      <div className="modal-info-value">{selectedOrder.paymentMethod}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Delivery Address */}
            {selectedOrder.deliveryType === 'Home Delivery' && (
              <div className="order-detail-section">
                <h3 className="order-detail-title">
                  <MapPin size={18} />
                  Delivery Address
                </h3>
                <div className="modal-info-item">
                  <MapPin size={16} />
                  <div className="modal-info-value">{selectedOrder.deliveryAddress}</div>
                </div>
              </div>
            )}

            {/* Order Items */}
            <div className="order-detail-section">
              <h3 className="order-detail-title">
                <Cake size={18} />
                Order Items
              </h3>
              <div className="order-items-list">
                {selectedOrder.items.map((item, index) => (
                  <div key={index} className="order-item-card">
                    <div className="order-item-image">
                      <Cake size={24} />
                    </div>
                    <div className="order-item-details">
                      <div className="order-item-name">{item.name}</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span className="order-item-price">{item.price}</span>
                        <span className="order-item-qty">Quantity: {item.quantity}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Special Instructions */}
            {selectedOrder.specialInstructions && (
              <div className="order-detail-section">
                <h3 className="order-detail-title">Special Instructions</h3>
                <p style={{ color: 'var(--text-primary)', margin: 0 }}>
                  {selectedOrder.specialInstructions}
                </p>
              </div>
            )}

            {/* Status Actions */}
            <div className="order-status-actions">
              {selectedOrder.status === 'pending' && (
                <>
                  <button 
                    className="order-action-btn"
                    onClick={() => updateOrderStatus(selectedOrder.id, 'processing')}
                  >
                    <Package size={16} />
                    Start Processing
                  </button>
                  <button 
                    className="order-action-btn secondary"
                    onClick={() => updateOrderStatus(selectedOrder.id, 'cancelled')}
                  >
                    <XCircle size={16} />
                    Cancel Order
                  </button>
                </>
              )}
              
              {selectedOrder.status === 'processing' && (
                <>
                  <button 
                    className="order-action-btn"
                    onClick={() => updateOrderStatus(selectedOrder.id, 'completed')}
                  >
                    <CheckCircle size={16} />
                    Mark as Completed
                  </button>
                  {selectedOrder.deliveryType === 'Home Delivery' && (
                    <button 
                      className="order-action-btn secondary"
                      onClick={() => updateOrderStatus(selectedOrder.id, 'delivered')}
                    >
                      <Truck size={16} />
                      Mark as Delivered
                    </button>
                  )}
                </>
              )}
              
              <button 
                className="order-action-btn secondary"
                onClick={closeModal}
                style={{ flex: 1 }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;