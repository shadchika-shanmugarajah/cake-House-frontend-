import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  LogOut, Home, Cake, ShoppingCart, Users, Package, 
  Award, Bell, Search, Menu, Plus, Eye, 
  BarChart, Calendar, DollarSign, Camera, Upload, 
  Tag, Info, BookOpen, Hash, AlertCircle, CheckCircle, 
  Image, Filter, Download, ChevronDown, Settings, Shield,
  User, Mail, Phone, Calendar as CalendarIcon, Key
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { admin, logoutAdmin } = useAuth();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [openSubmenu, setOpenSubmenu] = useState(null);
  const [showAdminDetails, setShowAdminDetails] = useState(false);
  const [isAddCakeOpen, setIsAddCakeOpen] = useState(false);

  // Sample Data
  const ordersData = [
    { id: 'ORD-7842', customer: 'aaa', date: 'Jan 15, 2026', amount: 'Rs 1299', status: 'completed' },
    { id: 'ORD-7841', customer: 'bbb', date: 'Jan 14, 2026', amount: 'Rs 80', status: 'processing' },
    { id: 'ORD-7840', customer: 'ccc', date: 'Jan 14, 2026', amount: 'Rs 2255', status: 'pending' },
    { id: 'ORD-7839', customer: 'ddd', date: 'Jan 13, 2026', amount: 'Rs 625', status: 'completed' },
    { id: 'ORD-7838', customer: 'eee', date: 'Jan 12, 2026', amount: 'Rs 180', status: 'cancelled' }
  ];

  const topCakesData = [
    { name: 'Red Velvet Dream', category: 'Birthday Cakes', sales: 42, price: 'Rs 459' },
    { name: 'Chocolate Heaven', category: 'Custom Cakes', sales: 38, price: 'Rs 599' },
    { name: 'Vanilla Berry Bliss', category: 'Wedding Cakes', sales: 35, price: 'Rs 489' },
    { name: 'Lemon Drizzle', category: 'Cupcakes', sales: 28, price: 'Rs 299' },
    { name: 'Carrot Cake Special', category: 'Birthday Cakes', sales: 25, price: 'Rs 429' },
    { name: 'Strawberry Delight', category: 'Custom Cakes', sales: 22, price: 'Rs 559' }
  ];

  const [newCake, setNewCake] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
    discountPrice: '',
    ingredients: '',
    allergens: '',
    weight: '',
    servings: '',
    preparationTime: '',
    isAvailable: true,
    isFeatured: false,
    tags: '',
    images: []
  });

  const statsData = {
    revenue: { value: 'Rs 12,450' },
    orders: { value: '142' },
    customers: { value: '324' },
    cakes: { value: '42'}
  };

  const handleLogout = () => {
    logoutAdmin();
    toast.success('Admin logged out successfully');
    navigate('/login');
  };

  const toggleSubmenu = (menu) => {
    setOpenSubmenu(openSubmenu === menu ? null : menu);
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    if (!isDarkMode) {
      document.documentElement.classList.add('dark-theme');
    } else {
      document.documentElement.classList.remove('dark-theme');
    }
  };

  const viewOrder = (orderId) => {
    toast.info(`Viewing order: ${orderId}`);
  };

  const handleAddNewCake = () => {
    setIsAddCakeOpen(true);
  };

  const viewAllOrders = () => {
    toast.info('Showing all orders');
  };

  const handleAdminAvatarClick = () => {
    setShowAdminDetails(!showAdminDetails);
  };

  // Menu items
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <BarChart size={20} />, path: '/admin/dashboard' },
    { 
      id: 'cakes', 
      label: 'Cakes', 
      icon: <Cake size={20} />,
      submenu: [
        { label: 'All Cakes', path: '/admin/cakes' },
        { label: 'Wedding Cakes', path: '/admin/cakes/wedding' },
        { label: 'Birthday Cakes', path: '/admin/cakes/birthday' },
        { label: 'Custom Cakes', path: '/admin/cakes/custom' }
      ]
    },
    { id: 'orders', label: 'Orders', icon: <ShoppingCart size={20} />, path: '/admin/orders' },
    { id: 'customers', label: 'Customers', icon: <Users size={20} />, path: '/admin/customers' },
    { id: 'inventory', label: 'Inventory', icon: <Package size={20} />, path: '/admin/inventory' },
    { id: 'loyalty', label: 'Loyalty Program', icon: <Award size={20} />, path: '/admin/loyalty' },
    { id: 'settings', label: 'Settings', icon: <Settings size={20} />, path: '/admin/settings' },
  ];

  // Check if admin is logged in
  if (!admin) {
    return (
      <div className="admin-error">
        <Shield size={48} />
        <h2>Access Denied</h2>
        <p>Please login as admin first.</p>
        <Link to="/login" className="login-link">Go to Login</Link>
      </div>
    );
  }

  return (
    <div className={`admin-layout ${isDarkMode ? 'dark-theme' : ''}`}>
      {/* Sidebar */}
      <aside className={`sidebar ${isSidebarOpen ? 'active' : ''}`}>
        <div className="sidebar-header">
          <div className="logo">
            <Cake size={24} />
            <span>Cake House </span>
          </div>
          <div 
            className="admin-info clickable"
            onClick={handleAdminAvatarClick}
            style={{ cursor: 'pointer' }}
          >
            <div className="admin-avatar">
              {admin?.email?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className="admin-details">
              <span className="admin-name">{admin?.email?.split('@')[0] || 'Admin'}</span>
              <span className="admin-role">{admin?.role || 'Super Admin'}</span>
            </div>
          </div>
        </div>

        <nav className="menu">
          {menuItems.map((item) => (
            <div key={item.id} className="menu-item">
              {item.submenu ? (
                <>
                  <button 
                    className={`menu-link ${activeMenu === item.id ? 'active' : ''}`}
                    onClick={() => toggleSubmenu(item.id)}
                  >
                    <span className="menu-icon">{item.icon}</span>
                    <span className="menu-text">{item.label}</span>
                    <ChevronDown size={16} className={`chevron ${openSubmenu === item.id ? 'open' : ''}`} />
                  </button>
                  {openSubmenu === item.id && (
                    <div className="submenu">
                      {item.submenu.map((sub) => (
                        <Link
                          key={sub.label}
                          to={sub.path}
                          className="submenu-link"
                          onClick={() => setIsSidebarOpen(false)}
                        >
                          {sub.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <Link
                  to={item.path || '#'}
                  className={`menu-link ${activeMenu === item.id ? 'active' : ''}`}
                  onClick={() => {
                    setActiveMenu(item.id);
                    setIsSidebarOpen(false);
                  }}
                >
                  <span className="menu-icon">{item.icon}</span>
                  <span className="menu-text">{item.label}</span>
                </Link>
              )}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button onClick={toggleDarkMode} className="theme-toggle">
            {isDarkMode ? '🌙 Dark Mode' : '☀️ Light Mode'}
          </button>
          <button onClick={handleLogout} className="logout-btn">
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Admin Details Modal */}
      {showAdminDetails && (
        <div className="modal-overlay" onClick={() => setShowAdminDetails(false)}>
          <div className="admin-details-modal" onClick={(e) => e.stopPropagation()}>
            <button 
              className="modal-close"
              onClick={() => setShowAdminDetails(false)}
            >
              ×
            </button>
            
            <div className="admin-details-header">
              <div className="admin-details-avatar">
                {admin?.email?.charAt(0).toUpperCase() || 'A'}
              </div>
              <div className="admin-details-title">
                <h3>{admin?.email?.split('@')[0] || 'Admin'}</h3>
                <p>{admin?.role || 'Super Admin'}</p>
              </div>
            </div>

            <div className="admin-details-content">
              <div className="admin-details-info">
                <div className="admin-details-item">
                  <div className="admin-details-icon">
                    <Mail size={16} />
                  </div>
                  <div>
                    <div className="admin-details-label">Email</div>
                    <div className="admin-details-value">{admin?.email || 'admin@example.com'}</div>
                  </div>
                </div>
              </div>

              <div className="admin-details-actions">
                <button className="admin-details-btn">
                  <User size={16} />
                  <span>Edit Profile</span>
                </button>
                <button className="admin-details-btn">
                  <Key size={16} />
                  <span>Change Password</span>
                </button>
                <button 
                  className="admin-details-btn logout"
                  onClick={handleLogout}
                >
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Cake Modal */}
      {isAddCakeOpen && (
        <div className="modal-overlay" onClick={() => setIsAddCakeOpen(false)}>
          <div className="cake-modal-content" onClick={(e) => e.stopPropagation()}>
            <button 
              className="modal-close"
              onClick={() => setIsAddCakeOpen(false)}
            >
              ×
            </button>
            
            <h2 className="cake-modal-title">Add New Cake</h2>
            
            <div className="cake-form">
              {/* Form Tabs */}
           
              <div className="form-content">
                {/* Basic Information Section */}
                <div className="form-section">
                  <h3>
                    <Info size={18} />
                    Basic Information
                  </h3>
                  <div className="form-row">
                    <div className="form-group full-width">
                      <label>Cake Name *</label>
                      <input 
                        type="text" 
                        placeholder="e.g., Red Velvet Dream"
                        value={newCake.name}
                        onChange={(e) => setNewCake({...newCake, name: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group full-width">
                      <label>Description</label>
                      <textarea 
                        placeholder="Describe your cake... (e.g., Layers of moist red velvet cake with cream cheese frosting)"
                        value={newCake.description}
                        onChange={(e) => setNewCake({...newCake, description: e.target.value})}
                        rows="3"
                      />
                    </div>
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label>Category *</label>
                      <select 
                        value={newCake.category}
                        onChange={(e) => setNewCake({...newCake, category: e.target.value})}
                      >
                        <option value="">Select Category</option>
                        <option value="birthday">Birthday Cakes</option>
                        <option value="wedding">Wedding Cakes</option>
                        <option value="anniversary">Anniversary Cakes</option>
                        <option value="custom">Custom Cakes</option>
                        <option value="cupcakes">Cupcakes</option>
                        <option value="desserts">Desserts</option>
                      </select>
                    </div>
                    
                    <div className="form-group">
                      <label>Weight (kg)</label>
                      <input 
                        type="number" 
                        step="0.1"
                        placeholder="e.g., 1.5"
                        value={newCake.weight}
                        onChange={(e) => setNewCake({...newCake, weight: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label>Servings</label>
                      <input 
                        type="number"
                        placeholder="e.g., 8-10"
                        value={newCake.servings}
                        onChange={(e) => setNewCake({...newCake, servings: e.target.value})}
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Preparation Time</label>
                      <select 
                        value={newCake.preparationTime}
                        onChange={(e) => setNewCake({...newCake, preparationTime: e.target.value})}
                      >
                        <option value="">Select Time</option>
                        <option value="24h">24 Hours</option>
                        <option value="48h">48 Hours</option>
                        <option value="72h">72 Hours</option>
                        <option value="1week">1 Week</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                {/* Pricing Section */}
                <div className="form-section">
                  <h3>
                    <DollarSign size={18} />
                    Pricing
                  </h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Base Price (Rs) *</label>
                      <input 
                        type="number"
                        step="0.01"
                        placeholder="e.g., 1499"
                        value={newCake.price}
                        onChange={(e) => setNewCake({...newCake, price: e.target.value})}
                        required
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Discounted Price (Rs)</label>
                      <input 
                        type="number"
                        step="0.01"
                        placeholder="e.g., 1299"
                        value={newCake.discountPrice}
                        onChange={(e) => setNewCake({...newCake, discountPrice: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div className="pricing-info">
                    <div className="info-item">
                      <span>Profit Margin:</span>
                      <strong>45%</strong>
                    </div>
                    <div className="info-item">
                      <span>Tax Included:</span>
                      <strong>18% GST</strong>
                    </div>
                  </div>
                </div>
                
                {/* Ingredients & Allergens */}
                <div className="form-section">
                  <h3>
                    <BookOpen size={18} />
                    Ingredients & Allergens
                  </h3>
                  <div className="form-row">
                    <div className="form-group full-width">
                      <label>Ingredients *</label>
                      <textarea 
                        placeholder="List ingredients (comma separated) e.g., Flour, Sugar, Eggs, Cocoa, Cream Cheese"
                        value={newCake.ingredients}
                        onChange={(e) => setNewCake({...newCake, ingredients: e.target.value})}
                        rows="3"
                      />
                    </div>
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group full-width">
                      <label>Allergens & Dietary Info</label>
                      <textarea 
                        placeholder="e.g., Contains: Gluten, Dairy, Eggs. Suitable for vegetarians."
                        value={newCake.allergens}
                        onChange={(e) => setNewCake({...newCake, allergens: e.target.value})}
                        rows="2"
                      />
                    </div>
                  </div>
                  
                  <div className="tags-section">
                    <label>
                      <Tag size={16} />
                      Tags
                    </label>
                    <div className="tags-input">
                      <input 
                        type="text"
                        placeholder="Add tags (press enter)"
                        value={newCake.tags}
                        onChange={(e) => setNewCake({...newCake, tags: e.target.value})}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                          }
                        }}
                      />
                      <div className="tag-suggestions">
                        <span className="tag-suggestion">vegetarian</span>
                        <span className="tag-suggestion">best-seller</span>
                        <span className="tag-suggestion">seasonal</span>
                        <span className="tag-suggestion">gluten-free</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Images Section */}
                <div className="form-section">
                  <h3>
                    <Image size={18} />
                    Images
                  </h3>
                  <div className="image-upload-area">
                    <div className="upload-box">
                      <Upload size={32} />
                      <p>Drag & drop images here</p>
                      <span>or</span>
                      <button className="upload-btn">
                        <Camera size={16} />
                        Browse Files
                      </button>
                      <small>Recommended: 800×800px, Max 5 images</small>
                    </div>
                    
                    <div className="image-preview-grid">
                      <div className="image-preview">
                        <div className="image-placeholder">
                          <Cake size={24} />
                        </div>
                        <button className="remove-image">×</button>
                      </div>
                      <div className="image-preview">
                        <div className="image-placeholder">
                          <Plus size={24} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Availability & Features */}
                <div className="form-section">
                  <div className="toggle-section">
                    <div className="toggle-item">
                      <label>Available for Order</label>
                      <label className="switch">
                        <input 
                          type="checkbox" 
                          checked={newCake.isAvailable}
                          onChange={(e) => setNewCake({...newCake, isAvailable: e.target.checked})}
                        />
                        <span className="slider"></span>
                      </label>
                    </div>
                    
                    <div className="toggle-item">
                      <label>Featured Product</label>
                      <label className="switch">
                        <input 
                          type="checkbox" 
                          checked={newCake.isFeatured}
                          onChange={(e) => setNewCake({...newCake, isFeatured: e.target.checked})}
                        />
                        <span className="slider"></span>
                      </label>
                    </div>
                  </div>
                  
                  <div className="stock-section">
                    <div className="form-group">
                      <label>Initial Stock Quantity</label>
                      <input 
                        type="number"
                        placeholder="e.g., 10"
                        min="0"
                      />
                      <small>Set to 0 for made-to-order</small>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="form-actions">
                <button 
                  className="btn btn-secondary"
                  onClick={() => setIsAddCakeOpen(false)}
                >
                  Cancel
                </button>
                <button 
                  className="btn btn-primary"
                  onClick={() => {
                    toast.success('Cake added successfully!');
                    setIsAddCakeOpen(false);
                    // Reset form
                    setNewCake({
                      name: '',
                      description: '',
                      category: '',
                      price: '',
                      discountPrice: '',
                      ingredients: '',
                      allergens: '',
                      weight: '',
                      servings: '',
                      preparationTime: '',
                      isAvailable: true,
                      isFeatured: false,
                      tags: '',
                      images: []
                    });
                  }}
                >
                  <CheckCircle size={18} />
                  Add Cake
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div className="overlay" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Main Content */}
      <div className="main-content">
        {/* SIMPLIFIED Topbar - Only Search, Notification, Visit Store */}
        <header className="topbar">
          <div className="topbar-content">
            <div className="search-box">
              <Search size={18} />
              <input type="text" placeholder="Search orders, customers..." />
            </div>
            
            <button className="notification-btn">
              <Bell size={20} />
            </button>
            
            <Link to="/" className="store-link">
              <Home size={20} />
              <span>Visit Store</span>
            </Link>
          </div>
        </header>

        {/* Content Area */}
        <main className="content-area">
          {/* Dashboard Header */}
          <div className="dashboard-header">
            <h1>Dashboard Overview</h1>
            <p>Welcome back, {admin?.email?.split('@')[0] || 'Admin'}!</p>
          </div>

          {/* Dashboard Stats */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-header">
                <div className="stat-icon revenue">
                  <DollarSign size={24} />
                </div>
                <div>
                  <div className="stat-title">Total Revenue</div>
                  <div className="stat-value">{statsData.revenue.value}</div>
                  <div className="stat-trend">{statsData.revenue.trend}</div>
                </div>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-header">
                <div className="stat-icon orders">
                  <ShoppingCart size={24} />
                </div>
                <div>
                  <div className="stat-title">Total Orders</div>
                  <div className="stat-value">{statsData.orders.value}</div>
                  <div className="stat-trend">{statsData.orders.trend}</div>
                </div>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-header">
                <div className="stat-icon customers">
                  <Users size={24} />
                </div>
                <div>
                  <div className="stat-title">Total Customers</div>
                  <div className="stat-value">{statsData.customers.value}</div>
                  <div className="stat-trend">{statsData.customers.trend}</div>
                </div>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-header">
                <div className="stat-icon cakes">
                  <Cake size={24} />
                </div>
                <div>
                  <div className="stat-title">Total Cakes</div>
                  <div className="stat-value">{statsData.cakes.value}</div>
                  <div className="stat-trend">{statsData.cakes.trend}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Orders */}
          <div className="section-card">
            <div className="section-header">
              <h3 className="section-title">Recent Orders</h3>
              <div className="section-actions">
                <button className="btn-icon">
                  <Filter size={18} />
                  <span>Filter</span>
                </button>
                <button className="btn-icon">
                  <Download size={18} />
                  <span>Export</span>
                </button>
                <button className="btn btn-primary" onClick={viewAllOrders}>
                  View All
                </button>
              </div>
            </div>
            
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {ordersData.map((order) => (
                    <tr key={order.id}>
                      <td>{order.id}</td>
                      <td>{order.customer}</td>
                      <td>{order.date}</td>
                      <td>{order.amount}</td>
                      <td>
                        <span className={`status-badge status-${order.status}`}>
                          {order.status}
                        </span>
                      </td>
                      <td>
                        <button 
                          className="btn btn-sm" 
                          onClick={() => viewOrder(order.id)}
                        >
                          <Eye size={16} />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top Selling Cakes */}
          <div className="section-card">
            <div className="section-header">
              <h3 className="section-title">Top Selling Cakes</h3>
              <button className="btn btn-primary" onClick={handleAddNewCake}>
                <Plus size={18} />
                <span>Add New Cake</span>
              </button>
            </div>
            
            <div className="cakes-grid">
              {topCakesData.map((cake, index) => (
                <div key={index} className="cake-card">
                  <div className="cake-img">
                    <Cake size={40} />
                  </div>
                  <div className="cake-info">
                    <div className="cake-name">{cake.name}</div>
                    <div className="cake-category">{cake.category}</div>
                    <div className="cake-stats">
                      <span className="cake-sales">{cake.sales} sold</span>
                      <span className="cake-price">{cake.price}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>

        
      </div>
    </div>
  );
};

export default AdminDashboard;