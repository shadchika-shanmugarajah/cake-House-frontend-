import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Star } from 'lucide-react';
import { CartContext } from '../../context/CartContext';
import { toast } from 'react-toastify';
import './ProductCard.css';

const ProductCard = ({ product }) => {
  const { addToCart } = useContext(CartContext);

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product);
    toast.success(`${product.name} added to cart!`);
  };

  // Function to render star ratings
  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(<Star key={i} size={10} fill="#FFD700" color="#FFD700" />);
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push(<Star key={i} size={10} fill="#FFD700" color="#FFD700" />);
      } else {
        stars.push(<Star key={i} size={10} fill="none" color="#E5E7EB" />);
      }
    }
    
    return stars;
  };

  return (
    <Link to={`/product/${product.id}`} className="product-card">
      <div className="product-image-container">
        <img src={product.image} alt={product.name} className="product-image" />
        {product.isTrending && (
          <div className="trending-badge">
            🔥
          </div>
        )}
      </div>
      
      <div className="product-content">
        <div className="product-category">{product.category}</div>
        <h3 className="product-title">{product.name}</h3>
        
        {/* Add rating stars here */}
        <div className="product-rating">
          <div className="stars">
            {renderStars(product.rating || 0)}
          </div>
          <span className="rating-text">
            ({product.reviewCount || 0})
          </span>
        </div>
        
        <p className="product-description">
          {product.description}
        </p>
        
        <div className="product-footer">
          <div className="price-section">
            {/* Change from product.price.toFixed(2) to just product.price */}
            <span className="product-price">{product.price}</span>
          </div>
          
          <button onClick={handleAddToCart} className="add-to-cart-btn">
            <ShoppingBag size={16} /> {/* Fixed: size should be a number, not 8 */}
            Add
          </button>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;