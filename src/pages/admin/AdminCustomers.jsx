// src/pages/admin/AdminCustomers.jsx (CORRECTED)
import React, { useState, useMemo } from 'react';
import { Users, Mail, Phone, Calendar, MapPin, Eye, ShoppingBag, DollarSign, LogIn } from 'lucide-react';
import { useOrders } from '../../context/OrderContext';
import AdminBackHeader from '../../components/admin/AdminBackHeader';
import { toast } from 'react-toastify';
import './AdminCustomers.css'; // Import separate CSS

const AdminCustomers = () => {
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { orders, bulkOrders } = useOrders();

  const { customers, stats } = useMemo(() => {
    const customerMap = new Map();
    const addFromOrders = (orderList, isBulk = false) => {
      orderList.forEach(o => {
        const email = o.customer?.email || o.customerEmail;
        if (!email) return;
        const key = email.toLowerCase();
        if (!customerMap.has(key)) {
          customerMap.set(key, {
            id: key,
            name: o.customer?.name || 'Guest',
            email,
            phone: o.customer?.phone || o.customerPhone || '—',
            address: o.address || o.deliveryAddress || '—',
            joinDate: o.createdAt ? new Date(o.createdAt).toLocaleDateString() : '—',
            orders: 0,
            totalSpent: 0,
            lastOrder: o.createdAt ? new Date(o.createdAt).toLocaleDateString() : '—',
            status: 'active',
            orderIds: [],
            orderDetails: [],
          });
        }
        const c = customerMap.get(key);
        c.orders += 1;
        c.totalSpent += (o.total || 0);
        if (o.createdAt && (!c.lastOrder || new Date(o.createdAt) > new Date(c.lastOrder))) {
          c.lastOrder = new Date(o.createdAt).toLocaleDateString();
        }
        c.orderIds.push(o.id);
        c.orderDetails.push({ id: o.id, total: o.total, items: o.items, date: o.createdAt, isBulk });
      });
    };
    addFromOrders(orders);
    addFromOrders(bulkOrders, true);
    const registeredUsers = JSON.parse(localStorage.getItem('cakeHouseRegisteredUsers') || '[]');
    registeredUsers.forEach(u => {
      const key = (u.email || '').toLowerCase();
      if (!key) return;
      if (!customerMap.has(key)) {
        customerMap.set(key, {
          id: key,
          name: u.name || u.email?.split('@')[0] || 'Customer',
          email: u.email,
          phone: u.phone || '—',
          address: u.address || '—',
          joinDate: '—',
          orders: 0,
          totalSpent: 0,
          lastOrder: '—',
          status: 'active',
          orderIds: [],
          orderDetails: [],
          loginEmail: u.email,
        });
      } else {
        const c = customerMap.get(key);
        c.name = c.name || u.name || u.email?.split('@')[0];
        c.phone = c.phone === '—' ? (u.phone || '—') : c.phone;
        c.address = c.address === '—' ? (u.address || '—') : c.address;
      }
    });
    const userAuth = localStorage.getItem('userAuth');
    if (userAuth) {
      try {
        const u = JSON.parse(userAuth);
        const key = (u.email || '').toLowerCase();
        if (key && !customerMap.has(key)) {
          customerMap.set(key, {
            id: key,
            name: u.name || u.email?.split('@')[0] || 'Customer',
            email: u.email,
            phone: u.phone || '—',
            address: u.address || '—',
            joinDate: '—',
            orders: 0,
            totalSpent: 0,
            lastOrder: '—',
            status: 'active',
            orderIds: [],
            orderDetails: [],
            loginEmail: u.email,
          });
        } else if (key) {
          const c = customerMap.get(key);
          c.name = c.name || u.name || u.email?.split('@')[0];
          c.phone = c.phone === '—' ? (u.phone || '—') : c.phone;
          c.address = c.address === '—' ? (u.address || '—') : c.address;
        }
      } catch (e) { /* skip */ }
    }
    const custList = Array.from(customerMap.values()).map(c => ({
      ...c,
      totalSpent: `$${c.totalSpent.toFixed(2)}`,
    }));
    const totalRevenue = custList.reduce((s, c) => s + parseFloat(String(c.totalSpent).replace(/[^0-9.]/g, '')) || 0, 0);
    return {
      customers: custList,
      stats: {
        total: custList.length,
        newThisMonth: custList.filter(c => {
          const d = c.joinDate;
          if (d === '—') return false;
          const m = new Date().getMonth();
          const y = new Date().getFullYear();
          return new Date(d).getMonth() === m && new Date(d).getFullYear() === y;
        }).length,
        revenue: `$${totalRevenue.toFixed(2)}`,
      },
    };
  }, [orders, bulkOrders]);

  const displayCustomers = customers.length > 0 ? customers : [
    { id: '1', name: 'Sample Customer', email: 'customer@example.com', phone: '—', address: '—', joinDate: '—', orders: 0, totalSpent: '$0.00', lastOrder: '—', status: 'active', orderDetails: [] },
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
    <div className="customers-page">
      <AdminBackHeader />
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
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Total Customers</div>
        </div>
        
        <div className="customer-stat-card">
          <div className="stat-icon-wrapper">
            <Calendar size={24} />
          </div>
          <div className="stat-value">{stats.newThisMonth}</div>
          <div className="stat-label">New This Month</div>
        </div>
        
        <div className="customer-stat-card">
          <div className="stat-icon-wrapper">
            <DollarSign size={24} />
          </div>
          <div className="stat-value">{stats.revenue}</div>
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
            {displayCustomers.map((customer) => (
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

            {/* Login & Contact Information */}
            <div className="modal-section">
              <h3 className="modal-section-title">
                <LogIn size={18} className="modal-info-icon" />
                Login & Contact Information
              </h3>
              
              <div className="modal-info-grid">
                <div className="modal-info-item">
                  <Mail size={18} className="modal-info-icon" />
                  <div>
                    <div className="modal-info-label">Email (Login)</div>
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
                    <div className="modal-info-label">First Order / Joined</div>
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

            {/* Order History */}
            {selectedCustomer.orderDetails && selectedCustomer.orderDetails.length > 0 && (
              <div className="modal-section">
                <h3 className="modal-section-title">
                  <ShoppingBag size={18} className="modal-info-icon" />
                  Order History
                </h3>
                <div className="modal-order-list">
                  {selectedCustomer.orderDetails.map((ord, idx) => (
                    <div key={idx} className="modal-order-item">
                      <div><strong>{ord.id}</strong> {ord.isBulk && <span className="bulk-tag">Bulk</span>}</div>
                      <div>${ord.total?.toFixed(2)} • {new Date(ord.date).toLocaleDateString()}</div>
                      {ord.items?.length > 0 && (
                        <div className="modal-order-items">
                          {ord.items.slice(0, 3).map((i, iidx) => (
                            <span key={iidx}>{i.name} x{i.quantity}</span>
                          ))}
                          {ord.items.length > 3 && <span>+{ord.items.length - 3} more</span>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

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