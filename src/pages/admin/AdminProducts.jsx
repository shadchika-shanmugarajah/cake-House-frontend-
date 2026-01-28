// src/pages/admin/AdminProducts.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, Eye, Filter, Search, Download, Cake } from 'lucide-react';
import { toast } from 'react-toastify';

const AdminProducts = () => {
  const products = [
    { id: 1, name: 'Red Velvet Dream', category: 'Birthday', price: 'Rs 459', stock: 15, status: 'In Stock' },
    { id: 2, name: 'Chocolate Heaven', category: 'Custom', price: 'Rs 599', stock: 8, status: 'Low Stock' },
    { id: 3, name: 'Vanilla Berry Bliss', category: 'Wedding', price: 'Rs 489', stock: 22, status: 'In Stock' },
    { id: 4, name: 'Lemon Drizzle', category: 'Cupcakes', price: 'Rs 299', stock: 5, status: 'Low Stock' },
    { id: 5, name: 'Carrot Cake Special', category: 'Birthday', price: 'Rs 429', stock: 12, status: 'In Stock' },
  ];

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      toast.success('Product deleted successfully');
    }
  };

  return (
    <div className="admin-page">
      <div className="page-header">
        <div className="header-left">
          <Cake size={24} />
          <h1>Cakes Management</h1>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary">
            <Plus size={18} />
            <span>Add New Cake</span>
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="filters-section">
        <div className="search-box">
          <Search size={18} />
          <input type="text" placeholder="Search cakes..." />
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
            {products.map((product) => (
              <tr key={product.id}>
                <td>#{product.id}</td>
                <td>{product.name}</td>
                <td>{product.category}</td>
                <td>{product.price}</td>
                <td>{product.stock}</td>
                <td>
                  <span className={`status-badge ${product.status === 'In Stock' ? 'status-completed' : 'status-pending'}`}>
                    {product.status}
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    <button className="btn-icon" title="View">
                      <Eye size={16} />
                    </button>
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
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminProducts;