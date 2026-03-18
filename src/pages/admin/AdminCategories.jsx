import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import { categoriesApi } from '../../api/api';
import {
  Add, Edit, Delete, Close, Search,
  Image as ImageIcon, Save, Cancel,
} from '@mui/icons-material';
import './AdminDashboard.css';

const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', image: '' });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // ─── Fetch categories ──────────────────────────────────────
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const data = await categoriesApi.getAll();
      setCategories(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // ─── Form handlers ─────────────────────────────────────────
  const openAddForm = () => {
    setEditingId(null);
    setFormData({ name: '', description: '', image: '' });
    setFormError('');
    setShowForm(true);
  };

  const openEditForm = (cat) => {
    setEditingId(cat._id);
    setFormData({ name: cat.name, description: cat.description || '', image: cat.image || '' });
    setFormError('');
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ name: '', description: '', image: '' });
    setFormError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError('Category name is required');
      return;
    }
    setSaving(true);
    setFormError('');

    try {
      if (editingId) {
        const updated = await categoriesApi.update(editingId, formData);
        setCategories(prev => prev.map(c => c._id === editingId ? { ...c, ...updated } : c));
      } else {
        const created = await categoriesApi.create(formData);
        setCategories(prev => [created, ...prev]);
      }
      closeForm();
    } catch (err) {
      setFormError(err.message || 'Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  // ─── Delete handlers ───────────────────────────────────────
  const handleDelete = async (force = false) => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      if (force) {
        await categoriesApi.forceDelete(deleteTarget._id);
      } else {
        await categoriesApi.delete(deleteTarget._id);
      }
      setCategories(prev => prev.filter(c => c._id !== deleteTarget._id));
      setDeleteTarget(null);
    } catch (err) {
      // If server says products exist, show force option
      if (err.message?.includes('Cannot delete')) {
        setDeleteTarget(prev => ({ ...prev, hasProducts: true, productCount: err.productCount || '?', errorMsg: err.message }));
      } else {
        alert(err.message || 'Failed to delete');
      }
    } finally {
      setDeleting(false);
    }
  };

  // ─── Filter ────────────────────────────────────────────────
  const filtered = search
    ? categories.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
    : categories;

  // ─── Styles for modal ──────────────────────────────────────
  const modalOverlay = {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000,
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
  };
  const modalBox = {
    background: 'var(--admin-card-bg, #1C1C28)', borderRadius: 'var(--admin-radius, 14px)',
    border: '1px solid var(--admin-border, rgba(255,255,255,0.06))', width: '100%', maxWidth: 520,
    overflow: 'hidden', animation: 'adminFadeIn 0.2s ease',
  };
  const modalHeader = {
    padding: '20px 24px', borderBottom: '1px solid var(--admin-border)',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  };
  const inputStyle = {
    width: '100%', padding: '11px 14px', borderRadius: 'var(--admin-radius-sm, 10px)',
    border: '1px solid var(--admin-border, rgba(255,255,255,0.1))',
    background: 'rgba(255,255,255,0.04)', color: 'var(--admin-text-primary, #fff)',
    fontSize: 14, outline: 'none', transition: 'border-color 0.2s',
  };
  const labelStyle = {
    fontSize: 12, fontWeight: 500, color: 'var(--admin-text-secondary, #888)',
    display: 'block', marginBottom: 6,
  };

  return (
    <AdminLayout>
      {/* ─── Page Header ──────────────────────────────────────── */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Categories</h1>
          <p className="admin-page-subtitle">Organize your product catalog ({categories.length} categories)</p>
        </div>
        <button className="admin-btn admin-btn-primary" onClick={openAddForm}>
          <Add fontSize="small" /> Add Category
        </button>
      </div>

      {/* ─── Table ────────────────────────────────────────────── */}
      <div className="admin-table-container admin-animate-in">
        <div className="admin-table-header">
          <div className="admin-search">
            <span className="admin-search-icon"><Search /></span>
            <input placeholder="Search categories..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <span style={{ fontSize: 13, color: 'var(--admin-text-muted)' }}>{filtered.length} categories</span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Image', 'Name', 'Description', 'Products', 'Created', 'Actions'].map(h => (
                  <th key={h} style={{
                    padding: '12px 20px', textAlign: 'left', fontSize: 12, fontWeight: 600,
                    textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--admin-text-secondary)',
                    borderBottom: '1px solid var(--admin-border)',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ padding: 48, textAlign: 'center', color: 'var(--admin-text-muted)' }}>Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: 48, textAlign: 'center', color: 'var(--admin-text-muted)' }}>
                  {search ? 'No categories match your search' : 'No categories yet. Click "Add Category" to create one.'}
                </td></tr>
              ) : filtered.map((cat) => (
                <tr key={cat._id}
                  style={{ borderBottom: '1px solid var(--admin-border)', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '10px 20px' }}>
                    {cat.image ? (
                      <img src={cat.image} alt={cat.name}
                        style={{ width: 44, height: 44, borderRadius: 10, objectFit: 'cover', border: '1px solid var(--admin-border)' }} />
                    ) : (
                      <div style={{
                        width: 44, height: 44, borderRadius: 10, background: 'var(--admin-accent-bg)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--admin-accent)',
                      }}>
                        <ImageIcon fontSize="small" />
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '14px 20px', fontSize: 14, fontWeight: 600 }}>{cat.name}</td>
                  <td style={{ padding: '14px 20px', fontSize: 13, color: 'var(--admin-text-secondary)', maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {cat.description || '—'}
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <span className={`admin-badge admin-badge-${(cat.productCount || 0) > 0 ? 'info' : 'warning'}`}>
                      {cat.productCount || 0}
                    </span>
                  </td>
                  <td style={{ padding: '14px 20px', fontSize: 13, color: 'var(--admin-text-secondary)' }}>
                    {cat.createdAt ? new Date(cat.createdAt).toLocaleDateString() : '—'}
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="admin-btn admin-btn-outline" style={{ padding: 7 }} onClick={() => openEditForm(cat)} title="Edit">
                        <Edit style={{ fontSize: 16 }} />
                      </button>
                      <button className="admin-btn admin-btn-danger" style={{ padding: 7 }} onClick={() => setDeleteTarget(cat)} title="Delete">
                        <Delete style={{ fontSize: 16 }} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Add / Edit Modal ─────────────────────────────────── */}
      {showForm && (
        <div style={modalOverlay} onClick={closeForm}>
          <div style={modalBox} onClick={e => e.stopPropagation()}>
            <div style={modalHeader}>
              <span style={{ fontSize: 17, fontWeight: 600 }}>
                {editingId ? 'Edit Category' : 'Add New Category'}
              </span>
              <button onClick={closeForm} style={{ background: 'none', border: 'none', color: 'var(--admin-text-muted)', cursor: 'pointer', display: 'flex' }}>
                <Close />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: 24 }}>
              {formError && (
                <div style={{
                  padding: '10px 14px', borderRadius: 'var(--admin-radius-sm)', marginBottom: 16,
                  background: 'var(--admin-danger-bg)', color: 'var(--admin-danger)', fontSize: 13,
                }}>
                  {formError}
                </div>
              )}

              <div style={{ marginBottom: 18 }}>
                <label style={labelStyle}>Category Name *</label>
                <input
                  style={inputStyle}
                  value={formData.name}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Birthday Cakes"
                  autoFocus
                />
              </div>

              <div style={{ marginBottom: 18 }}>
                <label style={labelStyle}>Description</label>
                <textarea
                  style={{ ...inputStyle, minHeight: 80, resize: 'vertical', fontFamily: 'inherit' }}
                  value={formData.description}
                  onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of the category"
                />
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={labelStyle}>Image URL</label>
                <input
                  style={inputStyle}
                  value={formData.image}
                  onChange={e => setFormData(prev => ({ ...prev, image: e.target.value }))}
                  placeholder="https://example.com/image.jpg"
                />
                {formData.image && (
                  <img src={formData.image} alt="Preview"
                    style={{ marginTop: 10, width: 80, height: 80, borderRadius: 10, objectFit: 'cover', border: '1px solid var(--admin-border)' }}
                    onError={e => e.target.style.display = 'none'} />
                )}
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" className="admin-btn admin-btn-outline" onClick={closeForm}>
                  <Cancel fontSize="small" /> Cancel
                </button>
                <button type="submit" className="admin-btn admin-btn-primary" disabled={saving}>
                  <Save fontSize="small" /> {saving ? 'Saving...' : editingId ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Delete Confirmation Modal ────────────────────────── */}
      {deleteTarget && (
        <div style={modalOverlay} onClick={() => setDeleteTarget(null)}>
          <div style={{ ...modalBox, maxWidth: 440 }} onClick={e => e.stopPropagation()}>
            <div style={modalHeader}>
              <span style={{ fontSize: 17, fontWeight: 600, color: 'var(--admin-danger)' }}>Delete Category</span>
              <button onClick={() => setDeleteTarget(null)} style={{ background: 'none', border: 'none', color: 'var(--admin-text-muted)', cursor: 'pointer', display: 'flex' }}>
                <Close />
              </button>
            </div>
            <div style={{ padding: 24 }}>
              <p style={{ fontSize: 14, color: 'var(--admin-text-secondary)', marginBottom: 8, lineHeight: 1.6 }}>
                Are you sure you want to delete <strong style={{ color: 'var(--admin-text-primary)' }}>"{deleteTarget.name}"</strong>?
              </p>

              {deleteTarget.productCount > 0 && (
                <div style={{
                  padding: '12px 14px', borderRadius: 'var(--admin-radius-sm)',
                  background: 'var(--admin-warning-bg)', color: 'var(--admin-warning)',
                  fontSize: 13, marginBottom: 16, lineHeight: 1.5,
                }}>
                  ⚠️ This category contains <strong>{deleteTarget.productCount}</strong> product(s).
                  {deleteTarget.hasProducts
                    ? ' Clicking "Delete Anyway" will move them to "Uncategorized".'
                    : ' Products in this category must be handled.'}
                </div>
              )}

              {deleteTarget.hasProducts && deleteTarget.errorMsg && (
                <div style={{
                  padding: '10px 14px', borderRadius: 'var(--admin-radius-sm)',
                  background: 'var(--admin-danger-bg)', color: 'var(--admin-danger)',
                  fontSize: 13, marginBottom: 16,
                }}>
                  {deleteTarget.errorMsg}
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
                <button className="admin-btn admin-btn-outline" onClick={() => setDeleteTarget(null)}>
                  Cancel
                </button>
                {deleteTarget.hasProducts ? (
                  <button className="admin-btn admin-btn-danger" disabled={deleting} onClick={() => handleDelete(true)}>
                    <Delete fontSize="small" /> {deleting ? 'Deleting...' : 'Delete Anyway'}
                  </button>
                ) : (
                  <button className="admin-btn admin-btn-danger" disabled={deleting} onClick={() => handleDelete(false)}>
                    <Delete fontSize="small" /> {deleting ? 'Deleting...' : 'Delete'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminCategories;
