import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import { usersApi } from '../../api/api';
import { Search, People } from '@mui/icons-material';
import './AdminDashboard.css';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await usersApi.getAll();
        setUsers(Array.isArray(data) ? data : (data.users || []));
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  const filtered = search
    ? users.filter(u => (u.name || u.email || '').toLowerCase().includes(search.toLowerCase()))
    : users;

  return (
    <AdminLayout>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Users</h1>
          <p className="admin-page-subtitle">Manage registered customers and admins</p>
        </div>
      </div>

      <div className="admin-table-container admin-animate-in">
        <div className="admin-table-header">
          <div className="admin-search">
            <span className="admin-search-icon"><Search /></span>
            <input placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <span style={{ fontSize: 13, color: 'var(--admin-text-muted)' }}>{filtered.length} users</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Name','Email','Phone','Role','Joined'].map(h => (
                  <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--admin-text-secondary)', borderBottom: '1px solid var(--admin-border)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ padding: 48, textAlign: 'center', color: 'var(--admin-text-muted)' }}>Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: 48, textAlign: 'center', color: 'var(--admin-text-muted)' }}>No users found</td></tr>
              ) : filtered.map((u, i) => (
                <tr key={u._id || i} style={{ borderBottom: '1px solid var(--admin-border)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '14px 20px', fontSize: 14, fontWeight: 500 }}>{u.name || '—'}</td>
                  <td style={{ padding: '14px 20px', fontSize: 14, color: 'var(--admin-text-secondary)' }}>{u.email}</td>
                  <td style={{ padding: '14px 20px', fontSize: 14 }}>{u.phone || '—'}</td>
                  <td style={{ padding: '14px 20px' }}>
                    <span className={`admin-badge admin-badge-${u.role === 'admin' ? 'info' : 'success'}`}>{u.role || 'user'}</span>
                  </td>
                  <td style={{ padding: '14px 20px', fontSize: 13, color: 'var(--admin-text-secondary)' }}>{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminUsers;
