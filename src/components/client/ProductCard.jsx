import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Star, Heart } from 'lucide-react';
import { CartContext } from '../../context/CartContext';
import { toast } from 'react-toastify';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const getImageUrl = (img) => {
  if (!img) return '';
  if (img.startsWith('http')) return img;
  return `${API_BASE}${img}`;
};

const ProductCard = ({ product }) => {
  const { addToCart } = useContext(CartContext);
  const name = product.productName || product.name || 'Cake';
  const category = (typeof product.categoryId === 'object' && product.categoryId?.name)
    ? product.categoryId.name
    : (product.category || '');
  const rating = product.averageRating || product.rating || 0;
  const reviews = product.reviewCount || 0;
  const price = product.price || 0;
  const stock = product.stockQuantity ?? product.stock ?? 1;
  const image = getImageUrl(product.image);

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (stock <= 0) return;
    try {
      await addToCart(product);
      toast.success(`${name} added to cart!`);
    } catch (err) {
      toast.error(err.message || 'Failed to add item to cart');
    }
  };

  const renderStars = (r) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          size={12}
          fill={i <= Math.round(r) ? '#FFD700' : 'none'}
          color={i <= Math.round(r) ? '#FFD700' : '#E0D5CC'}
        />
      );
    }
    return stars;
  };

  return (
    <Link to={`/product/${product._id || product.id}`} className="product-card">
      <div className="product-image-container">
        <img src={image} alt={name} className="product-image" loading="lazy" />
        <div className="product-badges">
          {product.featured && <span className="featured-badge">★ Featured</span>}
          {product.isTrending && <span className="trending-badge">🔥 Trending</span>}
        </div>
        <button
          className="wishlist-btn"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); toast.info('Wishlist coming soon!'); }}
          title="Add to wishlist"
        >
          <Heart size={16} />
        </button>
      </div>

      <div className="product-content">
        {category && <div className="product-category">{category}</div>}
        <h3 className="product-title">{name}</h3>

        <div className="product-rating">
          <div className="stars">{renderStars(rating)}</div>
          <span className="rating-text">{rating.toFixed(1)} ({reviews})</span>
        </div>

        {product.description && (
          <p className="product-description">{product.description}</p>
        )}

        <div className="product-footer">
          <span className="product-price">Rs. {price.toLocaleString()}</span>
          {stock > 0 ? (
            <button onClick={handleAddToCart} className="add-to-cart-btn">
              <ShoppingBag size={14} /> Add
            </button>
          ) : (
            <span className="out-of-stock-badge">Out of Stock</span>
          )}
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
