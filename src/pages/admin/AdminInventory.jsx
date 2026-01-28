import React, { useState } from 'react';
import { 
  Package, Search, Filter, Download, Plus, Edit, 
  Trash2, AlertCircle, CheckCircle, XCircle, 
  TrendingUp, TrendingDown, BarChart3, RefreshCw
} from 'lucide-react';
import { toast } from 'react-toastify';
import './AdminInventory.css';


const AdminInventory = () => {
  const [selectedItem, setSelectedItem] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  

  const inventoryItems = [
    { 
      id: 'INV-001', 
      name: 'All-Purpose Flour', 
      category: 'Dry Ingredients',
      sku: 'FLR-AP-5KG',
      stock: 42,
      unit: 'kg',
      minStock: 20,
      maxStock: 100,
      price: 'Rs 120',
      supplier: 'Bakery Supplies Co.',
      lastRestock: 'Jan 15, 2026',
      status: 'in-stock',
      location: 'Aisle 1, Shelf B'
    },
    { 
      id: 'INV-002', 
      name: 'Granulated Sugar', 
      category: 'Dry Ingredients',
      sku: 'SGR-GR-10KG',
      stock: 15,
      unit: 'kg',
      minStock: 25,
      maxStock: 80,
      price: 'Rs 95',
      supplier: 'Sweetness Inc.',
      lastRestock: 'Jan 12, 2026',
      status: 'low-stock',
      location: 'Aisle 1, Shelf C'
    },
    { 
      id: 'INV-003', 
      name: 'Unsalted Butter', 
      category: 'Dairy',
      sku: 'BTR-UN-1KG',
      stock: 68,
      unit: 'kg',
      minStock: 30,
      maxStock: 150,
      price: 'Rs 650',
      supplier: 'Fresh Dairy Co.',
      lastRestock: 'Jan 14, 2026',
      status: 'in-stock',
      location: 'Fridge 2'
    },
    { 
      id: 'INV-004', 
      name: 'Fresh Eggs', 
      category: 'Dairy',
      sku: 'EGG-FR-30CT',
      stock: 8,
      unit: 'cartons',
      minStock: 15,
      maxStock: 50,
      price: 'Rs 320',
      supplier: 'Farm Fresh Eggs',
      lastRestock: 'Jan 13, 2026',
      status: 'out-of-stock',
      location: 'Fridge 1'
    },
    { 
      id: 'INV-005', 
      name: 'Vanilla Extract', 
      category: 'Flavorings',
      sku: 'VNL-EX-500ML',
      stock: 120,
      unit: 'ml',
      minStock: 10,
      maxStock: 200,
      price: 'Rs 450',
      supplier: 'Flavor Masters',
      lastRestock: 'Jan 10, 2026',
      status: 'in-stock',
      location: 'Aisle 3, Shelf A'
    },
    { 
      id: 'INV-006', 
      name: 'Chocolate Chips', 
      category: 'Add-ins',
      sku: 'CHO-CH-2KG',
      stock: 22,
      unit: 'kg',
      minStock: 20,
      maxStock: 60,
      price: 'Rs 850',
      supplier: 'Chocolate World',
      lastRestock: 'Jan 16, 2026',
      status: 'in-stock',
      location: 'Aisle 4, Shelf B'
    },
    { 
      id: 'INV-007', 
      name: 'Baking Powder', 
      category: 'Leavening Agents',
      sku: 'BPW-500G',
      stock: 5,
      unit: 'kg',
      minStock: 8,
      maxStock: 30,
      price: 'Rs 180',
      supplier: 'Bakery Supplies Co.',
      lastRestock: 'Jan 5, 2026',
      status: 'low-stock',
      location: 'Aisle 2, Shelf A'
    },
    { 
      id: 'INV-008', 
      name: 'Heavy Cream', 
      category: 'Dairy',
      sku: 'CRM-HV-1L',
      stock: 0,
      unit: 'liters',
      minStock: 12,
      maxStock: 40,
      price: 'Rs 380',
      supplier: 'Fresh Dairy Co.',
      lastRestock: 'Jan 3, 2026',
      status: 'out-of-stock',
      location: 'Fridge 3'
    },
  ];

  const stats = {
    totalItems: 156,
    lowStock: 8,
    outOfStock: 3,
    totalValue: 'Rs 45,820',
    categories: 12
  };

  const handleViewItem = (item) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleEditItem = (item) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleDeleteItem = (itemId) => {
    if (window.confirm(`Are you sure you want to delete item ${itemId}?`)) {
      toast.success(`Item ${itemId} deleted successfully`);
    }
  };

  const handleRestock = (item) => {
    const quantity = prompt(`Enter quantity to restock ${item.name}:`, item.minStock);
    if (quantity) {
      toast.success(`Restocked ${quantity} ${item.unit} of ${item.name}`);
    }
  };

  const getStatusBadge = (status, stock, minStock) => {
    let badgeClass = '';
    let icon = null;
    let text = '';
    
    if (status === 'out-of-stock' || stock === 0) {
      badgeClass = 'status-out-of-stock';
      icon = <XCircle size={12} />;
      text = 'Out of Stock';
    } else if (status === 'low-stock' || stock <= minStock) {
      badgeClass = 'status-low-stock';
      icon = <AlertCircle size={12} />;
      text = 'Low Stock';
    } else {
      badgeClass = 'status-in-stock';
      icon = <CheckCircle size={12} />;
      text = 'In Stock';
    }
    
    return (
      <span className={`inventory-status-badge ${badgeClass}`}>
        {icon}
        <span style={{ marginLeft: '4px' }}>{text}</span>
      </span>
    );
  };

  const getStockProgress = (stock, minStock, maxStock) => {
    const percentage = (stock / maxStock) * 100;
    let color = '#10B981'; // Green
    
    if (stock <= minStock) {
      color = stock === 0 ? '#EF4444' : '#F59E0B'; // Red for out, Orange for low
    } else if (stock > maxStock * 0.8) {
      color = '#3B82F6'; // Blue for high stock
    }
    
    return (
      <div className="stock-progress">
        <div 
          className="stock-progress-bar" 
          style={{ 
            width: `${Math.min(percentage, 100)}%`,
            backgroundColor: color
          }}
        />
        <div className="stock-progress-text">
          {stock} / {maxStock} {selectedItem?.unit}
        </div>
      </div>
    );
  };

  return (
    <div className="inventory-page">
      {/* Page Header */}
      <div className="inventory-header">
        <div className="inventory-header-left">
          <div className="inventory-header-icon">
            <Package size={24} />
          </div>
          <h1>Inventory Management</h1>
        </div>
        <div className="inventory-header-stats">
          <div className="inventory-stat-card">
            <div className="inventory-stat-label">Total Items</div>
            <div className="inventory-stat-value">{stats.totalItems}</div>
          </div>
          <div className="inventory-stat-card">
            <div className="inventory-stat-label">Low Stock</div>
            <div className="inventory-stat-value" style={{ color: '#F59E0B' }}>
              {stats.lowStock}
            </div>
          </div>
          <div className="inventory-stat-card">
            <div className="inventory-stat-label">Out of Stock</div>
            <div className="inventory-stat-value" style={{ color: '#EF4444' }}>
              {stats.outOfStock}
            </div>
          </div>
          <div className="inventory-stat-card">
            <div className="inventory-stat-label">Total Value</div>
            <div className="inventory-stat-value" style={{ color: '#10B981' }}>
              {stats.totalValue}
            </div>
          </div>
        </div>
      </div>


      {/* Toolbar */}
      <div className="inventory-toolbar">
        <div className="inventory-search">
          <Search size={18} />
          <input type="text" placeholder="Search by name, SKU, category..." />
        </div>
        <div className="inventory-actions">
          <button className="inventory-btn secondary">
            <Filter size={16} />
            Filter
          </button>
          <button className="inventory-btn secondary">
            <Download size={16} />
            Export
          </button>
          <select className="inventory-btn secondary" style={{padding: '8px 16px'}}>
            <option>All Categories</option>
            <option>Dry Ingredients</option>
            <option>Dairy</option>
            <option>Flavorings</option>
            <option>Add-ins</option>
          </select>
          <button 
            className="inventory-btn primary"
            onClick={() => setIsAddModalOpen(true)}
          >
            <Plus size={16} />
            Add New Item
          </button>
        </div>
      </div>

   

      {/* Inventory Table */}
      <div className="inventory-table-container">
        <h3 className="inventory-table-title">
          <Package size={18} />
          Current Inventory
        </h3>
        
        <table className="inventory-table">
          <thead>
            <tr>
              <th>Item ID</th>
              <th>Product Name</th>
              <th>Category</th>
              <th>SKU</th>
              <th>Current Stock</th>
              <th>Min/Max</th>
              <th>Price</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {inventoryItems.map((item) => (
              <tr key={item.id}>
                <td>
                  <div style={{ fontWeight: '600', color: 'var(--primary)' }}>
                    {item.id}
                  </div>
                </td>
                <td>
                  <div className="inventory-item-name">
                    <div style={{ fontWeight: '600' }}>{item.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      Supplier: {item.supplier}
                    </div>
                  </div>
                </td>
                <td>
                  <span className="category-badge">
                    {item.category}
                  </span>
                </td>
                <td>{item.sku}</td>
                <td>
                  <div className="stock-info">
                    <div style={{ fontWeight: '600', fontSize: '16px' }}>
                      {item.stock} {item.unit}
                    </div>
                    <div className="stock-trend">
                      {item.stock > item.minStock * 1.5 ? (
                        <TrendingUp size={12} color="#10B981" />
                      ) : (
                        <TrendingDown size={12} color="#EF4444" />
                      )}
                      <span style={{ 
                        fontSize: '12px', 
                        color: item.stock > item.minStock * 1.5 ? '#10B981' : '#EF4444',
                        marginLeft: '4px'
                      }}>
                        {item.lastRestock}
                      </span>
                    </div>
                  </div>
                </td>
                <td>
                  <div className="stock-limits">
                    <div>Min: {item.minStock}</div>
                    <div>Max: {item.maxStock}</div>
                  </div>
                </td>
                <td>
                  <div style={{ fontWeight: '600', color: 'var(--success)' }}>
                    {item.price}
                  </div>
                </td>
                <td>
                  {getStatusBadge(item.status, item.stock, item.minStock)}
                </td>
                <td>
                  <div className="inventory-actions-cell">
                    <button 
                      className="inventory-action-btn"
                      onClick={() => handleViewItem(item)}
                      title="View Details"
                    >
                      <Eye size={14} />
                    </button>
                    <button 
                      className="inventory-action-btn secondary"
                      onClick={() => handleEditItem(item)}
                      title="Edit"
                    >
                      <Edit size={14} />
                    </button>
                    <button 
                      className="inventory-action-btn danger"
                      onClick={() => handleDeleteItem(item.id)}
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                    {item.status === 'low-stock' || item.status === 'out-of-stock' ? (
                      <button 
                        className="inventory-action-btn primary"
                        onClick={() => handleRestock(item)}
                        title="Restock"
                      >
                        <RefreshCw size={14} />
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="inventory-pagination">
          <button className="pagination-btn disabled">«</button>
          <button className="pagination-btn active">1</button>
          <button className="pagination-btn">2</button>
          <button className="pagination-btn">3</button>
          <button className="pagination-btn">»</button>
        </div>
      </div>

      {/* Item Details Modal */}
      {isModalOpen && selectedItem && (
        <div className="modal-overlay">
          <div className="inventory-modal-content">
            <button onClick={() => setIsModalOpen(false)} className="modal-close">×</button>
            
            <div className="inventory-modal-header">
              <h2 className="inventory-modal-title">{selectedItem.name}</h2>
              {getStatusBadge(selectedItem.status, selectedItem.stock, selectedItem.minStock)}
            </div>

            <div className="inventory-details-grid">
              {/* Basic Info */}
              <div className="inventory-detail-section">
                <h3 className="inventory-detail-title">
                  <Package size={18} />
                  Basic Information
                </h3>
                <div className="inventory-info-grid">
                  <div className="inventory-info-item">
                    <div className="inventory-info-label">Item ID</div>
                    <div className="inventory-info-value">{selectedItem.id}</div>
                  </div>
                  <div className="inventory-info-item">
                    <div className="inventory-info-label">SKU</div>
                    <div className="inventory-info-value">{selectedItem.sku}</div>
                  </div>
                  <div className="inventory-info-item">
                    <div className="inventory-info-label">Category</div>
                    <div className="inventory-info-value">{selectedItem.category}</div>
                  </div>
                  <div className="inventory-info-item">
                    <div className="inventory-info-label">Unit</div>
                    <div className="inventory-info-value">{selectedItem.unit}</div>
                  </div>
                </div>
              </div>

              {/* Stock Information */}
              <div className="inventory-detail-section">
                <h3 className="inventory-detail-title">
                  <BarChart3 size={18} />
                  Stock Information
                </h3>
                <div className="stock-details">
                  <div className="stock-numbers">
                    <div className="stock-number">
                      <div className="stock-number-label">Current Stock</div>
                      <div className="stock-number-value">{selectedItem.stock} {selectedItem.unit}</div>
                    </div>
                    <div className="stock-number">
                      <div className="stock-number-label">Minimum Stock</div>
                      <div className="stock-number-value" style={{ color: '#F59E0B' }}>
                        {selectedItem.minStock} {selectedItem.unit}
                      </div>
                    </div>
                    <div className="stock-number">
                      <div className="stock-number-label">Maximum Stock</div>
                      <div className="stock-number-value" style={{ color: '#3B82F6' }}>
                        {selectedItem.maxStock} {selectedItem.unit}
                      </div>
                    </div>
                  </div>
                  <div className="stock-progress-container">
                    <div className="stock-progress-label">Stock Level</div>
                    {getStockProgress(selectedItem.stock, selectedItem.minStock, selectedItem.maxStock)}
                  </div>
                </div>
              </div>

              {/* Supplier & Location */}
              <div className="inventory-detail-section">
                <h3 className="inventory-detail-title">Supplier & Location</h3>
                <div className="inventory-info-grid">
                  <div className="inventory-info-item">
                    <div className="inventory-info-label">Supplier</div>
                    <div className="inventory-info-value">{selectedItem.supplier}</div>
                  </div>
                  <div className="inventory-info-item">
                    <div className="inventory-info-label">Location</div>
                    <div className="inventory-info-value">{selectedItem.location}</div>
                  </div>
                  <div className="inventory-info-item">
                    <div className="inventory-info-label">Last Restock</div>
                    <div className="inventory-info-value">{selectedItem.lastRestock}</div>
                  </div>
                  <div className="inventory-info-item">
                    <div className="inventory-info-label">Price</div>
                    <div className="inventory-info-value" style={{ color: 'var(--success)', fontWeight: '600' }}>
                      {selectedItem.price}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="inventory-modal-actions">
              <button 
                className="inventory-btn secondary"
                onClick={() => handleEditItem(selectedItem)}
              >
                <Edit size={16} />
                Edit Item
              </button>
              <button 
                className="inventory-btn primary"
                onClick={() => handleRestock(selectedItem)}
                disabled={selectedItem.stock >= selectedItem.maxStock}
              >
               
                Restock Item
              </button>
              <button 
                className="inventory-btn danger"
                onClick={() => handleDeleteItem(selectedItem.id)}
              >
                <Trash2 size={16} />
                Delete Item
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Item Modal (Basic Structure) */}
    {/* Add Item Modal */}
{isAddModalOpen && (
  <div className="modal-overlay">
    <div className="inventory-modal-content">
      <button onClick={() => setIsAddModalOpen(false)} className="modal-close">×</button>
      
      <div className="inventory-modal-header">
        <h2 className="inventory-modal-title">
          <Plus size={24} />
          Add New Inventory Item
        </h2>
      </div>

      <form 
        className="add-item-form"
        onSubmit={(e) => {
          e.preventDefault();
          toast.success('New item added successfully!');
          setIsAddModalOpen(false);
        }}
      >
        <div className="form-section">
          <h3 className="form-section-title">Basic Information</h3>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="itemName">Item Name *</label>
              <input
                type="text"
                id="itemName"
                placeholder="e.g., All-Purpose Flour"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="category">Category *</label>
              <select id="category" required>
                <option value="">Select Category</option>
                <option value="Dry Ingredients">Dry Ingredients</option>
                <option value="Dairy">Dairy</option>
                <option value="Flavorings">Flavorings</option>
                <option value="Add-ins">Add-ins</option>
                <option value="Leavening Agents">Leavening Agents</option>
                <option value="Toppings">Toppings</option>
                <option value="Packaging">Packaging</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="sku">SKU (Stock Keeping Unit) *</label>
              <input
                type="text"
                id="sku"
                placeholder="e.g., FLR-AP-5KG"
                required
              />
              <small className="form-hint">Unique identifier for this item</small>
            </div>

            <div className="form-group">
              <label htmlFor="unit">Unit of Measurement *</label>
              <select id="unit" required>
                <option value="">Select Unit</option>
                <option value="kg">Kilograms (kg)</option>
                <option value="g">Grams (g)</option>
                <option value="liters">Liters (L)</option>
                <option value="ml">Milliliters (ml)</option>
                <option value="cartons">Cartons</option>
                <option value="pieces">Pieces</option>
                <option value="boxes">Boxes</option>
                <option value="packs">Packs</option>
              </select>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3 className="form-section-title">Stock Information</h3>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="initialStock">Initial Stock Quantity</label>
              <input
                type="number"
                id="initialStock"
                placeholder="e.g., 50"
                min="0"
                defaultValue="0"
              />
            </div>

            <div className="form-group">
              <label htmlFor="minStock">Minimum Stock Level *</label>
              <input
                type="number"
                id="minStock"
                placeholder="e.g., 20"
                min="0"
                required
              />
              <small className="form-hint">Alert when stock falls below this</small>
            </div>

            <div className="form-group">
              <label htmlFor="maxStock">Maximum Stock Level *</label>
              <input
                type="number"
                id="maxStock"
                placeholder="e.g., 100"
                min="0"
                required
              />
              <small className="form-hint">Maximum storage capacity</small>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3 className="form-section-title">Pricing & Supplier</h3>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="price">Price per Unit *</label>
              <div className="price-input">
                <span className="currency">Rs</span>
                <input
                  type="number"
                  id="price"
                  placeholder="e.g., 120"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="supplier">Supplier</label>
              <input
                type="text"
                id="supplier"
                placeholder="e.g., Bakery Supplies Co."
              />
            </div>

            <div className="form-group">
              <label htmlFor="location">Storage Location</label>
              <input
                type="text"
                id="location"
                placeholder="e.g., Aisle 1, Shelf B"
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3 className="form-section-title">Additional Information</h3>
          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              placeholder="Add any notes or descriptions about this item..."
              rows="3"
            />
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="inventory-btn secondary"
            onClick={() => setIsAddModalOpen(false)}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="inventory-btn primary"
          >
            <Plus size={16} />
            Add Item
          </button>
        </div>
      </form>
    </div>
  </div>
)}
    </div>
  );
};

// Add missing import
import { Eye } from 'lucide-react';

export default AdminInventory;