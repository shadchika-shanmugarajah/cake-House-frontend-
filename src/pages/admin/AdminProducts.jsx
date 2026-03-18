import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import { productsApi, categoriesApi } from '../../api/api';
import {
  Add, Edit, Delete, Close, Search, Save, Cancel,
  Image as ImageIcon, Inventory2, Star, CloudUpload,
} from '@mui/icons-material';
import './AdminDashboard.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    productName: '', categoryId: '', price: '', description: '',
    stockQuantity: '0', featured: false, weight: '', preparationTime: '', image: '',
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  // Stock modal
  const [stockTarget, setStockTarget] = useState(null);
  const [stockValue, setStockValue] = useState('');

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // ─── Fetch data ────────────────────────────────────────────
  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      const data = await productsApi.getAll({ limit: 100 });
      setProducts(Array.isArray(data) ? data : (data.products || []));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchCategories = async () => {
    try {
      const data = await categoriesApi.getAll();
      setCategories(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
  };

  // ─── Filter ────────────────────────────────────────────────
  const filtered = products.filter(p => {
    if (catFilter !== 'all') {
      const catId = (p.categoryId?._id || p.categoryId || '').toString();
      if (catId !== catFilter) return false;
    }
    if (search) {
      const q = search.toLowerCase();
      return (p.productName || p.name || '').toLowerCase().includes(q);
    }
    return true;
  });

  // ─── Helpers ───────────────────────────────────────────────
  const getCategoryName = (p) => {
    if (typeof p.categoryId === 'object' && p.categoryId?.name) return p.categoryId.name;
    const cat = categories.find(c => c._id === p.categoryId);
    return cat?.name || p.category || '—';
  };

  const getImageUrl = (img) => {
    if (!img) return '';
    if (img.startsWith('http')) return img;
    return `${API_BASE}${img}`;
  };

  // ─── Form handlers ─────────────────────────────────────────
  const openAddForm = () => {
    setEditingId(null);
    setFormData({
      productName: '', categoryId: categories[0]?._id || '', price: '', description: '',
      stockQuantity: '0', featured: false, weight: '', preparationTime: '', image: '',
    });
    setImageFile(null); setImagePreview(''); setFormError('');
    setShowForm(true);
  };

  const openEditForm = (p) => {
    setEditingId(p._id);
    setFormData({
      productName: p.productName || p.name || '',
      categoryId: (p.categoryId?._id || p.categoryId || '').toString(),
      price: String(p.price || ''),
      description: p.description || '',
      stockQuantity: String(p.stockQuantity ?? p.stock ?? 0),
      featured: !!p.featured,
      weight: p.weight || '',
      preparationTime: p.preparationTime || '',
      image: p.image || '',
    });
    setImageFile(null);
    setImagePreview(getImageUrl(p.image));
    setFormError('');
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false); setEditingId(null); setFormError('');
    setImageFile(null); setImagePreview('');
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.productName.trim()) return setFormError('Product name is required');
    if (!formData.categoryId) return setFormError('Category is required');
    if (!formData.price || parseFloat(formData.price) <= 0) return setFormError('Price must be greater than 0');

    setSaving(true); setFormError('');

    try {
      // Build FormData for multipart upload
      const fd = new FormData();
      fd.append('productName', formData.productName.trim());
      fd.append('categoryId', formData.categoryId);
      fd.append('price', formData.price);
      fd.append('description', formData.description);
      fd.append('stockQuantity', formData.stockQuantity || '0');
      fd.append('featured', formData.featured);
      if (formData.weight) fd.append('weight', formData.weight);
      if (formData.preparationTime) fd.append('preparationTime', formData.preparationTime);

      if (imageFile) {
        fd.append('image', imageFile);
      } else if (formData.image) {
        fd.append('image', formData.image);
      }

      // Get admin token
      const adminAuth = JSON.parse(localStorage.getItem('adminAuth') || '{}');
      const headers = {};
      if (adminAuth?.token) headers['Authorization'] = `Bearer ${adminAuth.token}`;

      const url = editingId
        ? `${API_BASE}/api/products/${editingId}`
        : `${API_BASE}/api/products`;

      const res = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers,
        body: fd,
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to save product');

      if (editingId) {
        setProducts(prev => prev.map(p => p._id === editingId ? result : p));
      } else {
        setProducts(prev => [result, ...prev]);
      }
      closeForm();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // ─── Stock update ──────────────────────────────────────────
  const handleStockUpdate = async () => {
    if (!stockTarget || stockValue === '') return;
    try {
      const adminAuth = JSON.parse(localStorage.getItem('adminAuth') || '{}');
      const res = await fetch(`${API_BASE}/api/products/${stockTarget._id}/stock`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(adminAuth?.token ? { 'Authorization': `Bearer ${adminAuth.token}` } : {}),
        },
        body: JSON.stringify({ stockQuantity: parseInt(stockValue) }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed');
      setProducts(prev => prev.map(p => p._id === stockTarget._id ? result : p));
      setStockTarget(null);
    } catch (err) { alert(err.message); }
  };

  // ─── Delete ────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await productsApi.delete(deleteTarget._id);
      setProducts(prev => prev.filter(p => p._id !== deleteTarget._id));
      setDeleteTarget(null);
    } catch (err) { alert(err.message); }
    finally { setDeleting(false); }
  };

  // ─── Styles ────────────────────────────────────────────────
  const modalOverlay = {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000,
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    overflowY: 'auto',
  };
  const modalBox = {
    background: 'var(--admin-card-bg, #1C1C28)', borderRadius: 'var(--admin-radius, 14px)',
    border: '1px solid var(--admin-border)', width: '100%', maxWidth: 600,
    overflow: 'hidden', animation: 'adminFadeIn 0.2s ease', margin: 'auto',
  };
  const modalHeader = {
    padding: '20px 24px', borderBottom: '1px solid var(--admin-border)',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  };
  const inputStyle = {
    width: '100%', padding: '11px 14px', borderRadius: 'var(--admin-radius-sm, 10px)',
    border: '1px solid var(--admin-border)', background: 'rgba(255,255,255,0.04)',
    color: 'var(--admin-text-primary)', fontSize: 14, outline: 'none',
  };
  const labelStyle = {
    fontSize: 12, fontWeight: 500, color: 'var(--admin-text-secondary)',
    display: 'block', marginBottom: 6,
  };
  const row2 = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 18 };

  return (
    <AdminLayout>
      {/* ─── Header ───────────────────────────────────────────── */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Products</h1>
          <p className="admin-page-subtitle">Manage your cake catalog ({products.length} products)</p>
        </div>
        <button className="admin-btn admin-btn-primary" onClick={openAddForm}>
          <Add fontSize="small" /> Add Product
        </button>
      </div>

      {/* ─── Table ────────────────────────────────────────────── */}
      <div className="admin-table-container admin-animate-in">
        <div className="admin-table-header" style={{ flexWrap: 'wrap', gap: 12 }}>
          <div className="admin-search">
            <span className="admin-search-icon"><Search /></span>
            <input placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="admin-filters">
            <button className={`admin-filter-chip${catFilter === 'all' ? ' active' : ''}`} onClick={() => setCatFilter('all')}>All</button>
            {categories.map(c => (
              <button key={c._id} className={`admin-filter-chip${catFilter === c._id ? ' active' : ''}`} onClick={() => setCatFilter(c._id)}>
                {c.name}
              </button>
            ))}
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Image', 'Product Name', 'Category', 'Price', 'Stock', 'Rating', 'Featured', 'Actions'].map(h => (
                  <th key={h} style={{
                    padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600,
                    textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--admin-text-secondary)',
                    borderBottom: '1px solid var(--admin-border)',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ padding: 48, textAlign: 'center', color: 'var(--admin-text-muted)' }}>Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} style={{ padding: 48, textAlign: 'center', color: 'var(--admin-text-muted)' }}>
                  {search ? 'No products match your search' : 'No products yet.'}
                </td></tr>
              ) : filtered.map(p => {
                const stock = p.stockQuantity ?? p.stock ?? 0;
                return (
                  <tr key={p._id} style={{ borderBottom: '1px solid var(--admin-border)', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '8px 16px' }}>
                      {p.image ? (
                        <img src={getImageUrl(p.image)} alt="" style={{ width: 48, height: 48, borderRadius: 10, objectFit: 'cover', border: '1px solid var(--admin-border)' }} />
                      ) : (
                        <div style={{ width: 48, height: 48, borderRadius: 10, background: 'var(--admin-accent-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--admin-accent)' }}>
                          <ImageIcon fontSize="small" />
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 14, fontWeight: 600, maxWidth: 200 }}>{p.productName || p.name}</td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--admin-text-secondary)' }}>{getCategoryName(p)}</td>
                    <td style={{ padding: '14px 16px', fontSize: 14, fontWeight: 600 }}>Rs. {(p.price || 0).toLocaleString()}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <span
                        className={`admin-badge admin-badge-${stock > 10 ? 'success' : stock > 0 ? 'warning' : 'danger'}`}
                        style={{ cursor: 'pointer' }}
                        onClick={() => { setStockTarget(p); setStockValue(String(stock)); }}
                        title="Click to update stock"
                      >
                        {stock} <Inventory2 style={{ fontSize: 12, marginLeft: 2 }} />
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 14 }}>
                      <Star style={{ fontSize: 14, color: '#FBBF24', verticalAlign: 'middle' }} /> {(p.averageRating || p.rating || 0).toFixed(1)}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      {p.featured ? <span className="admin-badge admin-badge-info">Featured</span> : <span style={{ color: 'var(--admin-text-muted)', fontSize: 13 }}>—</span>}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="admin-btn admin-btn-outline" style={{ padding: 7 }} onClick={() => openEditForm(p)} title="Edit"><Edit style={{ fontSize: 16 }} /></button>
                        <button className="admin-btn admin-btn-danger" style={{ padding: 7 }} onClick={() => setDeleteTarget(p)} title="Delete"><Delete style={{ fontSize: 16 }} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Add / Edit Modal ─────────────────────────────────── */}
      {showForm && (
        <div style={modalOverlay} onClick={closeForm}>
          <div style={modalBox} onClick={e => e.stopPropagation()}>
            <div style={modalHeader}>
              <span style={{ fontSize: 17, fontWeight: 600 }}>{editingId ? 'Edit Product' : 'Add New Product'}</span>
              <button onClick={closeForm} style={{ background: 'none', border: 'none', color: 'var(--admin-text-muted)', cursor: 'pointer', display: 'flex' }}><Close /></button>
            </div>
            <form onSubmit={handleSubmit} style={{ padding: 24, maxHeight: '70vh', overflowY: 'auto' }}>
              {formError && (
                <div style={{ padding: '10px 14px', borderRadius: 'var(--admin-radius-sm)', marginBottom: 16, background: 'var(--admin-danger-bg)', color: 'var(--admin-danger)', fontSize: 13 }}>
                  {formError}
                </div>
              )}

              {/* Name */}
              <div style={{ marginBottom: 18 }}>
                <label style={labelStyle}>Product Name *</label>
                <input style={inputStyle} value={formData.productName} onChange={e => setFormData(p => ({ ...p, productName: e.target.value }))} placeholder="e.g. Chocolate Truffle Cake" autoFocus />
              </div>

              {/* Category + Price */}
              <div style={row2}>
                <div>
                  <label style={labelStyle}>Category *</label>
                  <select style={inputStyle} value={formData.categoryId} onChange={e => setFormData(p => ({ ...p, categoryId: e.target.value }))}>
                    <option value="">Select category</option>
                    {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Price (Rs.) *</label>
                  <input style={inputStyle} type="number" min="0" step="0.01" value={formData.price} onChange={e => setFormData(p => ({ ...p, price: e.target.value }))} placeholder="0.00" />
                </div>
              </div>

              {/* Description */}
              <div style={{ marginBottom: 18 }}>
                <label style={labelStyle}>Description</label>
                <textarea style={{ ...inputStyle, minHeight: 80, resize: 'vertical', fontFamily: 'inherit' }} value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} placeholder="Describe your product..." />
              </div>

              {/* Stock + Featured */}
              <div style={row2}>
                <div>
                  <label style={labelStyle}>Stock Quantity</label>
                  <input style={inputStyle} type="number" min="0" value={formData.stockQuantity} onChange={e => setFormData(p => ({ ...p, stockQuantity: e.target.value }))} />
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 2 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 14, color: 'var(--admin-text-primary)' }}>
                    <input type="checkbox" checked={formData.featured} onChange={e => setFormData(p => ({ ...p, featured: e.target.checked }))}
                      style={{ width: 18, height: 18, accentColor: 'var(--admin-accent)' }} />
                    Featured Product
                  </label>
                </div>
              </div>

              {/* Weight + Prep Time */}
              <div style={row2}>
                <div>
                  <label style={labelStyle}>Weight</label>
                  <input style={inputStyle} value={formData.weight} onChange={e => setFormData(p => ({ ...p, weight: e.target.value }))} placeholder="e.g. 1kg" />
                </div>
                <div>
                  <label style={labelStyle}>Preparation Time</label>
                  <input style={inputStyle} value={formData.preparationTime} onChange={e => setFormData(p => ({ ...p, preparationTime: e.target.value }))} placeholder="e.g. 2 hours" />
                </div>
              </div>

              {/* Image Upload */}
              <div style={{ marginBottom: 24 }}>
                <label style={labelStyle}>Product Image</label>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <label style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    width: 120, height: 120, borderRadius: 12, border: '2px dashed var(--admin-border)',
                    cursor: 'pointer', color: 'var(--admin-text-muted)', fontSize: 12, gap: 6,
                    transition: 'border-color 0.2s', flexShrink: 0,
                  }}>
                    <CloudUpload style={{ fontSize: 28 }} />
                    <span>Upload</span>
                    <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
                  </label>
                  {imagePreview && (
                    <img src={imagePreview} alt="Preview" style={{ width: 120, height: 120, borderRadius: 12, objectFit: 'cover', border: '1px solid var(--admin-border)' }} />
                  )}
                  <div style={{ flex: 1 }}>
                    <input style={inputStyle} value={formData.image} onChange={e => { setFormData(p => ({ ...p, image: e.target.value })); if (e.target.value) setImagePreview(e.target.value); }} placeholder="...or paste image URL" />
                    <span style={{ fontSize: 11, color: 'var(--admin-text-muted)', marginTop: 4, display: 'block' }}>Upload a file or enter a URL. Max 5MB.</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" className="admin-btn admin-btn-outline" onClick={closeForm}><Cancel fontSize="small" /> Cancel</button>
                <button type="submit" className="admin-btn admin-btn-primary" disabled={saving}><Save fontSize="small" /> {saving ? 'Saving...' : editingId ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Stock Update Modal ────────────────────────────────── */}
      {stockTarget && (
        <div style={modalOverlay} onClick={() => setStockTarget(null)}>
          <div style={{ ...modalBox, maxWidth: 380 }} onClick={e => e.stopPropagation()}>
            <div style={modalHeader}>
              <span style={{ fontSize: 17, fontWeight: 600 }}>Update Stock</span>
              <button onClick={() => setStockTarget(null)} style={{ background: 'none', border: 'none', color: 'var(--admin-text-muted)', cursor: 'pointer', display: 'flex' }}><Close /></button>
            </div>
            <div style={{ padding: 24 }}>
              <p style={{ fontSize: 14, color: 'var(--admin-text-secondary)', marginBottom: 16 }}>
                <strong style={{ color: 'var(--admin-text-primary)' }}>{stockTarget.productName || stockTarget.name}</strong>
              </p>
              <label style={labelStyle}>New Stock Quantity</label>
              <input style={inputStyle} type="number" min="0" value={stockValue} onChange={e => setStockValue(e.target.value)} autoFocus />
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
                <button className="admin-btn admin-btn-outline" onClick={() => setStockTarget(null)}>Cancel</button>
                <button className="admin-btn admin-btn-primary" onClick={handleStockUpdate}>
                  <Save fontSize="small" /> Update
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Delete Confirmation Modal ────────────────────────── */}
      {deleteTarget && (
        <div style={modalOverlay} onClick={() => setDeleteTarget(null)}>
          <div style={{ ...modalBox, maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <div style={modalHeader}>
              <span style={{ fontSize: 17, fontWeight: 600, color: 'var(--admin-danger)' }}>Delete Product</span>
              <button onClick={() => setDeleteTarget(null)} style={{ background: 'none', border: 'none', color: 'var(--admin-text-muted)', cursor: 'pointer', display: 'flex' }}><Close /></button>
            </div>
            <div style={{ padding: 24 }}>
              <p style={{ fontSize: 14, color: 'var(--admin-text-secondary)', marginBottom: 6, lineHeight: 1.6 }}>
                Are you sure you want to delete <strong style={{ color: 'var(--admin-text-primary)' }}>"{deleteTarget.productName || deleteTarget.name}"</strong>?
              </p>
              <p style={{ fontSize: 13, color: 'var(--admin-text-muted)', marginBottom: 20 }}>This action cannot be undone.</p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button className="admin-btn admin-btn-outline" onClick={() => setDeleteTarget(null)}>Cancel</button>
                <button className="admin-btn admin-btn-danger" disabled={deleting} onClick={handleDelete}>
                  <Delete fontSize="small" /> {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminProducts;
