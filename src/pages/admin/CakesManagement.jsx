// src/pages/admin/CakesManagement.jsx
import React, { useState } from 'react';
import { Plus, Edit, Trash2, Eye, Filter, Search, Download } from 'lucide-react';
import { toast } from 'react-toastify';

const CakesManagement = () => {
  const [cakes] = useState([
    { id: 1, name: 'Red Velvet Dream', category: 'Birthday', price: 'Rs 459', stock: 15, status: 'In Stock' },
    { id: 2, name: 'Chocolate Heaven', category: 'Custom', price: 'Rs 599', stock: 8, status: 'Low Stock' },
    { id: 3, name: 'Vanilla Berry Bliss', category: 'Wedding', price: 'Rs 489', stock: 22, status: 'In Stock' },
    // Add more cakes...
  ]);

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1>Cakes Management</h1>
        <button className="btn btn-primary">
          <Plus size={18} />
          Add New Cake
        </button>
      </div>
      
      {/* Add filters, search, and table */}
    </div>
  );
};

export default CakesManagement;