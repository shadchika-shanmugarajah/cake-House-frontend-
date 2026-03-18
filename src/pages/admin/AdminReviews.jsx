import React, { useCallback, useEffect, useMemo, useState } from 'react';
import AdminLayout from './AdminLayout';
import { reviewsApi } from '../../api/api';
import { Delete, Search, StarRate } from '@mui/icons-material';
import { toast } from 'react-toastify';
import './AdminDashboard.css';

const renderStars = (rating) => {
  const total = Math.max(Math.min(Math.round(Number(rating) || 0), 5), 0);
  return `${'*'.repeat(total)}${'-'.repeat(5 - total)}`;
};

const AdminReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState('');

  const loadReviews = useCallback(async () => {
    setLoading(true);
    try {
      const response = await reviewsApi.getAll({ limit: 200 });
      const list = Array.isArray(response) ? response : (response.reviews || []);
      setReviews(list);
    } catch (err) {
      toast.error(err.message || 'Failed to load reviews');
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const filteredReviews = useMemo(() => {
    if (!search) return reviews;
    const q = search.toLowerCase();
    return reviews.filter((review) => (
      (review.productId?.productName || '').toLowerCase().includes(q)
      || (review.userId?.name || '').toLowerCase().includes(q)
      || (review.userId?.email || '').toLowerCase().includes(q)
      || (review.comment || '').toLowerCase().includes(q)
    ));
  }, [reviews, search]);

  const handleDelete = async (reviewId) => {
    const confirmed = window.confirm('Delete this review as spam/inappropriate?');
    if (!confirmed) return;

    setDeletingId(reviewId);
    try {
      await reviewsApi.delete(reviewId);
      setReviews((prev) => prev.filter((review) => review._id !== reviewId));
      toast.success('Review deleted');
    } catch (err) {
      toast.error(err.message || 'Failed to delete review');
    } finally {
      setDeletingId('');
    }
  };

  return (
    <AdminLayout>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Ratings & Reviews</h1>
          <p className="admin-page-subtitle">Moderate product reviews and remove spam comments</p>
        </div>
      </div>

      <div className="admin-table-container admin-animate-in">
        <div className="admin-table-header">
          <div className="admin-search">
            <span className="admin-search-icon"><Search /></span>
            <input
              placeholder="Search by product, customer, or comment"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Product', 'Customer', 'Rating', 'Comment', 'Date', 'Actions'].map((header) => (
                  <th
                    key={header}
                    style={{
                      padding: '12px 20px',
                      textAlign: 'left',
                      fontSize: 12,
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      color: 'var(--admin-text-secondary)',
                      borderBottom: '1px solid var(--admin-border)',
                    }}
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ padding: 48, textAlign: 'center', color: 'var(--admin-text-muted)' }}>Loading reviews...</td></tr>
              ) : filteredReviews.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: 48, textAlign: 'center', color: 'var(--admin-text-muted)' }}>No reviews found</td></tr>
              ) : filteredReviews.map((review) => (
                <tr key={review._id} style={{ borderBottom: '1px solid var(--admin-border)' }}>
                  <td style={{ padding: '14px 20px', fontSize: 14, fontWeight: 600 }}>
                    {review.productId?.productName || 'Deleted product'}
                  </td>
                  <td style={{ padding: '14px 20px', fontSize: 13 }}>
                    <div>{review.userId?.name || 'Unknown user'}</div>
                    <div style={{ color: 'var(--admin-text-secondary)' }}>{review.userId?.email || ''}</div>
                  </td>
                  <td style={{ padding: '14px 20px', fontSize: 13 }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <StarRate style={{ fontSize: 16, color: '#f59e0b' }} />
                      <span>{Number(review.rating || 0).toFixed(1)}</span>
                      <span style={{ color: 'var(--admin-text-secondary)' }}>{renderStars(review.rating)}</span>
                    </div>
                    {review.isVerifiedPurchase && (
                      <div style={{ marginTop: 4 }}>
                        <span className="admin-badge admin-badge-success">Verified Purchase</span>
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '14px 20px', fontSize: 13, maxWidth: 360 }}>
                    {review.comment || 'No comment'}
                  </td>
                  <td style={{ padding: '14px 20px', fontSize: 13 }}>
                    {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : '—'}
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <button
                      className="admin-btn admin-btn-danger"
                      style={{ padding: '8px 10px' }}
                      onClick={() => handleDelete(review._id)}
                      disabled={deletingId === review._id}
                    >
                      <Delete style={{ fontSize: 16 }} />
                      {deletingId === review._id ? 'Deleting...' : 'Delete'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminReviews;

