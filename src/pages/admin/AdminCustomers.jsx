// src/pages/admin/AdminCustomers.jsx (CORRECTED)
import React, { useState } from 'react';
import { Users, Mail, Phone, Calendar, MapPin, Eye, ShoppingBag, DollarSign, Search, Filter, Plus } from 'lucide-react';
import { toast } from 'react-toastify';
import './AdminCustomers.css'; // Import separate CSS

const AdminCustomers = () => {
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const customers = [
    { 
      id: 1, 
      name: 'John Doe', 
      email: 'john@example.com', 
      phone: '077 2346 890', 
      address: '123 Main St',
      joinDate: 'Jan 15, 2024', 
      orders: 12, 
      totalSpent: 'Rs 5,280',
      lastOrder: '2024-12-15',
      status: 'active'
    },
    { 
      id: 2, 
      name: 'Jane Smith', 
      email: 'jane@example.com', 
      phone: '077 2346 891', 
      address: '456 Oak Ave',
      joinDate: 'Feb 20, 2024', 
      orders: 8, 
      totalSpent: 'Rs 3,450',
      lastOrder: '2024-12-10',
      status: 'active'
    },
    { 
      id: 3, 
      name: 'Bob Johnson', 
      email: 'bob@example.com', 
      phone: '077 2346 892', 
      address: '789 Pine Rd',
      joinDate: 'Mar 10, 2024', 
      orders: 15, 
      totalSpent: 'Rs 7,890',
      lastOrder: '2024-12-12',
      status: 'active'
    },
    { 
      id: 4, 
      name: 'Alice Brown', 
      email: 'alice@example.com', 
      phone: '077 2346 893', 
      address: '321 Elm St',
      joinDate: 'Apr 5, 2024', 
      orders: 5, 
      totalSpent: 'Rs 2,150',
      lastOrder: '2024-11-28',
      status: 'active'
    },
    { 
      id: 5, 
      name: 'Charlie Wilson', 
      email: 'charlie@example.com', 
      phone: '077 2346 894', 
      address: '654 Maple Dr',
      joinDate: 'May 18, 2024', 
      orders: 20, 
      totalSpent: 'Rs 9,850',
      lastOrder: '2024-12-14',
      status: 'vip'
    },
    { 
      id: 6, 
      name: 'Emma Davis', 
      email: 'emma@example.com', 
      phone: '077 2346 894', 
      address: '987 Cedar Ln',
      joinDate: 'Jun 22, 2024', 
      orders: 7, 
      totalSpent: 'Rs 3,120',
      lastOrder: '2024-12-08',
      status: 'active'
    },
  ];

  const handleViewCustomer = (customer) => {
    setSelectedCustomer(customer);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedCustomer(null);
  };

  const sendMessage = (email) => {
    toast.info(`Sending message to ${email}...`);
  };

  return (
    <div className="customers-page"> {/* Changed from admin-page to customers-page */}
      {/* Page Header */}
      <div className="customers-header">
        <div className="header-left">
          <div className="header-icon">
            <Users size={24} />
          </div>
          <h1>Customers Management</h1>
        </div>
        
      </div>

   
      {/* Stats Grid */}
      <div className="customers-stats">
        <div className="customer-stat-card">
          <div className="stat-icon-wrapper">
            <Users size={24} />
          </div>
          <div className="stat-value">6</div>
          <div className="stat-label">Total Customers</div>
        </div>
        
        <div className="customer-stat-card">
          <div className="stat-icon-wrapper">
            <Calendar size={24} />
          </div>
          <div className="stat-value">28</div>
          <div className="stat-label">New This Month</div>
        </div>
        
        <div className="customer-stat-card">
          <div className="stat-icon-wrapper">
            <DollarSign size={24} />
          </div>
          <div className="stat-value">Rs 89,450</div>
          <div className="stat-label">Total Revenue</div>
        </div>
        
      
      </div>

      {/* Customers Table */}
      <div className="customers-table-container">
        <h3 className="table-title">
          <Users size={18} />
          All Customers
        </h3>
        
        <table className="customers-table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Contact</th>
              <th>Orders</th>
              <th>Total Spent</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr key={customer.id}>
                <td>
                  <div className="customer-cell">
                    <div className="customer-avatar">
                      {customer.name.charAt(0)}
                    </div>
                    <div className="customer-info">
                      <div className="customer-name">{customer.name}</div>
                      <div className="customer-email">
                        <Mail size={12} />
                        {customer.email}
                      </div>
                    </div>
                  </div>
                </td>
                <td>
                  <div style={{display: 'flex', alignItems: 'center', gap: '6px'}}>
                    <Phone size={14} />
                    {customer.phone}
                  </div>
                </td>
                <td>{customer.orders}</td>
                <td>{customer.totalSpent}</td>
                <td>
                  <span className={`status-badge status-${customer.status}`}>
                    {customer.status === 'vip' ? 'VIP' : 'Active'}
                  </span>
                </td>
                <td>
                  <button 
                    className="view-btn"
                    onClick={() => handleViewCustomer(customer)}
                  >
                    <Eye size={14} />
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Customer Details Modal */}
      {isModalOpen && selectedCustomer && (
        <div className="modal-overlay">
          <div className="modal-content">
            {/* Close Button */}
            <button 
              onClick={closeModal}
              className="modal-close"
            >
              ×
            </button>

            {/* Customer Avatar and Name */}
            <div className="modal-header">
              <div className="modal-avatar">
                {selectedCustomer.name.charAt(0)}
              </div>
              <div>
                <h2 className="modal-title">{selectedCustomer.name}</h2>
                <span className={`modal-badge status-${selectedCustomer.status}`}>
                  {selectedCustomer.status === 'vip' ? 'VIP' : 'Active'} Customer
                </span>
              </div>
            </div>

            {/* Customer Details */}
            <div className="modal-section">
              <h3 className="modal-section-title">Contact Information</h3>
              
              <div className="modal-info-grid">
                <div className="modal-info-item">
                  <Mail size={18} className="modal-info-icon" />
                  <div>
                    <div className="modal-info-label">Email</div>
                    <div className="modal-info-value">{selectedCustomer.email}</div>
                  </div>
                </div>
                
                <div className="modal-info-item">
                  <Phone size={18} className="modal-info-icon" />
                  <div>
                    <div className="modal-info-label">Phone</div>
                    <div className="modal-info-value">{selectedCustomer.phone}</div>
                  </div>
                </div>
                
                <div className="modal-info-item">
                  <MapPin size={18} className="modal-info-icon" />
                  <div>
                    <div className="modal-info-label">Address</div>
                    <div className="modal-info-value">{selectedCustomer.address}</div>
                  </div>
                </div>
                
                <div className="modal-info-item">
                  <Calendar size={18} className="modal-info-icon" />
                  <div>
                    <div className="modal-info-label">Joined</div>
                    <div className="modal-info-value">{selectedCustomer.joinDate}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Purchase Stats */}
            <div className="modal-stats-grid">
              <div className="modal-stat-card">
                <ShoppingBag size={24} className="modal-stat-icon" />
                <div className="modal-stat-value">{selectedCustomer.orders}</div>
                <div className="modal-stat-label">Total Orders</div>
              </div>
              
              <div className="modal-stat-card">
                <DollarSign size={24} style={{ color: 'var(--success)' }} />
                <div className="modal-stat-value">{selectedCustomer.totalSpent}</div>
                <div className="modal-stat-label">Total Spent</div>
              </div>
            </div>

            {/* Last Order Info */}
            <div className="modal-section">
              <div className="modal-info-label">Last Order Date</div>
              <div className="modal-info-value" style={{fontSize: '16px', fontWeight: '500'}}>
                {selectedCustomer.lastOrder}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="modal-actions">
           
              
              <button
                onClick={closeModal}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: 'var(--bg-main)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'var(--bg-main)'}
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

export default AdminCustomers;