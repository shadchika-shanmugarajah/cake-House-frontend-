// src/pages/admin/AdminProducts.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import AdminBackHeader from '../../components/admin/AdminBackHeader';
import './AdminProducts.css';
import { Plus, Edit, Trash2, Eye, Filter, Search, Download, Cake } from 'lucide-react';
import { toast } from 'react-toastify';
import { useProducts } from '../../context/ProductContext';

const AdminProducts = () => {
  const { products, addProduct, deleteProduct } = useProducts();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    category: 'Birthday',
    price: '',
    stock: '',
    image: '',
  });

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      deleteProduct(id);
      toast.success('Product deleted successfully');
    }
  };

  const handleAddProduct = () => {
    if (!newProduct.name?.trim()) {
      toast.error('Please enter product name');
      return;
    }
    if (!newProduct.price) {
      toast.error('Please enter price');
      return;
    }
    addProduct({
      name: newProduct.name.trim(),
      description: newProduct.description || '',
      price: Number(newProduct.price) || 0,
      category: newProduct.category || 'Custom',
      stock: Number(newProduct.stock) || 0,
      image: newProduct.image || undefined,
    });
    toast.success('Product added! It will appear on the client store.');
    setIsAddModalOpen(false);
    setNewProduct({ name: '', description: '', category: 'Birthday', price: '', stock: '', image: '' });
  };

  const filteredProducts = products.filter(
    p =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="admin-page">
      <AdminBackHeader />
      <div className="page-header">
        <div className="header-left">
          <Cake size={24} />
          <h1>Cakes Management</h1>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)}>
            <Plus size={18} />
            <span>Add New Cake</span>
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="filters-section">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search cakes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="filter-actions">
          <button className="btn-icon">
            <Filter size={18} />
            <span>Filter</span>
          </button>
          <button className="btn-icon">
            <Download size={18} />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="table-card">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Cake Name</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((product) => {
              const status = (product.stock || 0) <= 5 ? 'Low Stock' : 'In Stock';
              return (
                <tr key={product.id}>
                  <td>#{product.id}</td>
                  <td>{product.name}</td>
                  <td>{product.category}</td>
                  <td>Rs {product.price}</td>
                  <td>{product.stock ?? 0}</td>
                  <td>
                    <span className={`status-badge ${status === 'In Stock' ? 'status-completed' : 'status-pending'}`}>
                      {status}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <Link to={`/product/${product.id}`} className="btn-icon" title="View">
                        <Eye size={16} />
                      </Link>
                      <button className="btn-icon" title="Edit">
                        <Edit size={16} />
                      </button>
                      <button
                        className="btn-icon danger"
                        title="Delete"
                        onClick={() => handleDelete(product.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filteredProducts.length === 0 && (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
            No products found. Add a new cake to get started.
          </div>
        )}
      </div>

      {/* Add Product Modal */}
      {isAddModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setIsAddModalOpen(false)}>×</button>
            <h2 style={{ marginBottom: '1rem' }}>Add New Cake</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label>Cake Name *</label>
                <input
                  type="text"
                  placeholder="e.g., Red Velvet Dream"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px' }}
                />
              </div>
              <div>
                <label>Description</label>
                <textarea
                  placeholder="Describe your cake..."
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                  rows={2}
                  style={{ width: '100%', padding: '8px 12px' }}
                />
              </div>
              <div>
                <label>Category</label>
                <select
                  value={newProduct.category}
                  onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px' }}
                >
                  <option value="Birthday">Birthday</option>
                  <option value="Wedding">Wedding</option>
                  <option value="Custom">Custom</option>
                  <option value="Seasonal">Seasonal</option>
                  <option value="Cupcakes">Cupcakes</option>
                </select>
              </div>
              <div>
                <label>Price (Rs) *</label>
                <input
                  type="number"
                  placeholder="e.g., 459"
                  value={newProduct.price}
                  onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px' }}
                />
              </div>
              <div>
                <label>Stock</label>
                <input
                  type="number"
                  placeholder="e.g., 10"
                  min="0"
                  value={newProduct.stock}
                  onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px' }}
                />
              </div>
              <div>
                <label>Image URL (optional)</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={newProduct.image}
                  onChange={(e) => setNewProduct({ ...newProduct, image: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button className="btn btn-secondary" onClick={() => setIsAddModalOpen(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleAddProduct}>
                  <Plus size={16} /> Add Cake
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;
