import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ShoppingBag, Plus, Minus, ArrowLeft, Star, Heart, Truck, Shield, Clock } from 'lucide-react';
import { CartContext } from '../../context/CartContext';
import { productsApi } from '../../api/api';
import ProductCard from '../../components/client/ProductCard';
import { toast } from 'react-toastify';
import './ProductDetail.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const getImageUrl = (img) => {
  if (!img) return '';
  if (img.startsWith('http')) return img;
  return `${API_BASE}${img}`;
};

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useContext(CartContext);

  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);

  // ─── Fetch product, reviews, related ───────────────────────
  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [prod, revs, rel] = await Promise.all([
          productsApi.getById(id),
          productsApi.getReviews(id).catch(() => []),
          productsApi.getRelated(id).catch(() => []),
        ]);
        setProduct(prod);
        setReviews(Array.isArray(revs) ? revs : []);
        setRelated(Array.isArray(rel) ? rel : []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
    window.scrollTo(0, 0);
  }, [id]);

  if (loading) {
    return (
      <div className="product-detail-page">
        <div className="product-detail-container">
          <div style={{ textAlign: 'center', padding: '120px 20px', color: 'var(--cake-text-sec)' }}>Loading...</div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="product-detail-page">
        <div className="product-detail-container">
          <button onClick={() => navigate(-1)} className="back-btn"><ArrowLeft size={20} /> Back</button>
          <div className="pd-empty">
            <h2>Product not found</h2>
            <p>The product you're looking for doesn't exist or has been removed.</p>
            <Link to="/products" className="pd-btn-primary">Browse All Cakes</Link>
          </div>
        </div>
      </div>
    );
  }

  // ─── Derived data ──────────────────────────────────────────
  const name = product.productName || product.name || 'Cake';
  const category = typeof product.categoryId === 'object' ? product.categoryId?.name : (product.category || '');
  const rating = product.averageRating || product.rating || 0;
  const reviewCount = product.reviewCount || reviews.length || 0;
  const stock = product.stockQuantity ?? product.stock ?? 0;
  const image = getImageUrl(product.image);

  const handleAddToCart = async () => {
    if (stock <= 0) return;
    try {
      await addToCart(product, quantity);
      toast.success(`${name} added to cart!`);
    } catch (err) {
      toast.error(err.message || 'Failed to add item to cart');
    }
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (!reviewForm.comment.trim()) return toast.error('Please write a comment');
    setSubmittingReview(true);
    try {
      await productsApi.addReview(id, reviewForm);
      toast.success('Review submitted!');
      setReviewForm({ rating: 5, comment: '' });
      // Refresh reviews
      const newReviews = await productsApi.getReviews(id);
      setReviews(Array.isArray(newReviews) ? newReviews : []);
      // Refresh product for updated rating
      const updatedProd = await productsApi.getById(id);
      setProduct(updatedProd);
    } catch (err) {
      toast.error(err.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const renderStars = (r, size = 16) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(<Star key={i} size={size} fill={i <= Math.round(r) ? '#FFD700' : 'none'} color={i <= Math.round(r) ? '#FFD700' : '#E0D5CC'} />);
    }
    return stars;
  };

  const renderInteractiveStars = (selected, onChange) => (
    <div className="pd-star-select">
      {[1, 2, 3, 4, 5].map(i => (
        <button key={i} type="button" onClick={() => onChange(i)} className={`pd-star-btn ${i <= selected ? 'active' : ''}`}>
          <Star size={22} fill={i <= selected ? '#FFD700' : 'none'} color={i <= selected ? '#FFD700' : '#ccc'} />
        </button>
      ))}
    </div>
  );

  return (
    <div className="product-detail-page">
      <div className="product-detail-container">

        {/* Breadcrumb */}
        <nav className="pd-breadcrumb">
          <Link to="/">Home</Link> / <Link to="/products">Cakes</Link> / {category && <><Link to={`/products?category=${product.categoryId?._id || ''}`}>{category}</Link> / </>}<span>{name}</span>
        </nav>

        {/* ═══ PRODUCT DETAIL GRID ════════════════════════════ */}
        <div className="product-detail">
          {/* Image */}
          <div className="product-images">
            <div className="main-image">
              <img src={image} alt={name} />
              {product.featured && <span className="pd-featured-badge">★ Featured</span>}
              <button className="pd-wishlist-btn" onClick={() => toast.info('Wishlist coming soon!')}><Heart size={20} /></button>
            </div>
          </div>

          {/* Info */}
          <div className="product-info">
            {category && <span className="product-category-tag">{category}</span>}
            <h1 className="pd-title">{name}</h1>

            <div className="pd-rating-row">
              <div className="pd-stars">{renderStars(rating, 18)}</div>
              <span className="pd-rating-text">{rating.toFixed(1)} ({reviewCount} reviews)</span>
            </div>

            <div className="pd-price">Rs. {(product.price || 0).toLocaleString()}</div>

            <p className="pd-description">{product.description || 'Delicious handcrafted cake made with premium ingredients.'}</p>

            {/* Specs */}
            <div className="pd-specs">
              {product.weight && (
                <div className="pd-spec"><span className="pd-spec-label">Weight</span><span className="pd-spec-value">{product.weight}</span></div>
              )}
              {product.preparationTime && (
                <div className="pd-spec"><span className="pd-spec-label">Prep Time</span><span className="pd-spec-value">{product.preparationTime}</span></div>
              )}
              <div className="pd-spec">
                <span className="pd-spec-label">Availability</span>
                <span className={`pd-stock-badge ${stock > 0 ? 'in-stock' : 'out-of-stock'}`}>
                  {stock > 0 ? `In Stock (${stock})` : 'Out of Stock'}
                </span>
              </div>
            </div>

            {/* Quantity + Cart */}
            <div className="pd-actions">
              <div className="pd-quantity">
                <span className="pd-quantity-label">Qty</span>
                <div className="pd-quantity-controls">
                  <button className="pd-qty-btn" onClick={() => setQuantity(q => Math.max(1, q - 1))} disabled={quantity <= 1}><Minus size={16} /></button>
                  <span className="pd-qty-value">{quantity}</span>
                  <button className="pd-qty-btn" onClick={() => setQuantity(q => stock > 0 ? Math.min(stock, q + 1) : q)}><Plus size={16} /></button>
                </div>
              </div>
              <button className="pd-btn-primary pd-btn-cart" onClick={handleAddToCart} disabled={stock <= 0}>
                <ShoppingBag size={18} /> {stock > 0 ? 'Add to Cart' : 'Out of Stock'}
              </button>
            </div>

            {/* Trust badges */}
            <div className="pd-trust">
              <div className="pd-trust-item"><Truck size={16} /> Free Delivery</div>
              <div className="pd-trust-item"><Shield size={16} /> Fresh Guarantee</div>
              <div className="pd-trust-item"><Clock size={16} /> Same Day Available</div>
            </div>
          </div>
        </div>

        {/* ═══ REVIEWS SECTION ════════════════════════════════ */}
        <section className="pd-reviews-section">
          <h2 className="pd-section-title">Customer Reviews</h2>

          <div className="pd-reviews-grid">
            {/* Review Form */}
            <div className="pd-review-form-card">
              <h3>Write a Review</h3>
              <form onSubmit={submitReview}>
                <div className="pd-form-group">
                  <label>Your Rating</label>
                  {renderInteractiveStars(reviewForm.rating, (val) => setReviewForm(f => ({ ...f, rating: val })))}
                </div>
                <div className="pd-form-group">
                  <label>Your Review</label>
                  <textarea
                    rows="4"
                    placeholder="Tell others what you think about this cake..."
                    value={reviewForm.comment}
                    onChange={e => setReviewForm(f => ({ ...f, comment: e.target.value }))}
                  />
                </div>
                <button type="submit" className="pd-btn-primary" disabled={submittingReview}>
                  {submittingReview ? 'Submitting...' : 'Submit Review'}
                </button>
              </form>
            </div>

            {/* Reviews List */}
            <div className="pd-reviews-list">
              {reviews.length > 0 ? reviews.map((r) => (
                <div key={r._id} className="pd-review-card">
                  <div className="pd-review-header">
                    <div className="pd-reviewer-avatar">
                      {(r.userId?.name || r.user || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <strong className="pd-reviewer-name">{r.userId?.name || r.user || 'Customer'}</strong>
                      <div className="pd-review-date">{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ''}</div>
                    </div>
                    <div className="pd-review-stars">{renderStars(r.rating, 14)}</div>
                  </div>
                  <p className="pd-review-comment">{r.comment}</p>
                </div>
              )) : (
                <div className="pd-no-reviews">
                  <Star size={40} color="#E0D5CC" />
                  <p>No reviews yet. Be the first to share your experience!</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ═══ RELATED PRODUCTS ═══════════════════════════════ */}
        {related.length > 0 && (
          <section className="pd-related-section">
            <h2 className="pd-section-title">You May Also Like</h2>
            <div className="pd-related-grid">
              {related.map(p => (
                <ProductCard key={p._id || p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;
