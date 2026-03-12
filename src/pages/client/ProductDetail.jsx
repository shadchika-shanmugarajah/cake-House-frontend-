import React, { useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShoppingBag, Plus, Minus, ArrowLeft } from 'lucide-react';
import { CartContext } from '../../context/CartContext';
import { useProducts } from '../../context/ProductContext';
import { toast } from 'react-toastify';
import './ProductDetail.css';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useContext(CartContext);
  const { getProductById } = useProducts();
  const [quantity, setQuantity] = useState(1);

  const cake = getProductById(id);

  const handleAddToCart = () => {
    if (!cake) return;
    addToCart(cake, quantity);
    toast.success(`${cake.name} added to cart!`);
    
    // Optionally navigate to cart
    navigate('/cart');
  };

  if (!cake) {
    return (
      <div className="product-detail-page">
        <div className="product-detail-container">
          <button onClick={() => navigate(-1)} className="back-btn">
            <ArrowLeft size={20} />
            Back to Products
          </button>
          <p style={{ padding: '2rem', textAlign: 'center' }}>Product not found.</p>
        </div>
      </div>
    );
  }

  const longDescription = cake.description || 'Delicious handcrafted cake made with premium ingredients.';
  const servingSize = '8-10 people';
  const weight = '2 lbs';
  const preparationTime = '24 hours advance order';

  const handleQuantityIncrease = () => {
    setQuantity(prev => prev + 1);
  };

  const handleQuantityDecrease = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  return (
    <div className="product-detail-page">
      <div className="product-detail-container">
        <button onClick={() => navigate(-1)} className="back-btn">
          <ArrowLeft size={20} />
          Back to Products
        </button>
        
        <div className="product-detail">
          <div className="product-images">
            <div className="main-image">
              <img src={cake.image} alt={cake.name} />
            </div>
          </div>
          
          <div className="product-info">
            <span className="product-category">{cake.category}</span>
            <h1 className="product-title">{cake.name}</h1>
            
            <div className="product-rating">
              <div className="stars">
                {'★'.repeat(Math.floor(cake.rating || 4.5))}
                {'☆'.repeat(5 - Math.floor(cake.rating || 4.5))}
              </div>
              <span className="review-count">({cake.reviewCount || 0} reviews)</span>
            </div>
            
            <div className="product-price">
              Rs {cake.price}
            </div>
            
            <p className="product-description">{longDescription}</p>
            
            <div className="product-specs">
              <div className="spec-item">
                <span className="spec-label">Serving Size:</span>
                <span className="spec-value">{servingSize}</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">Weight:</span>
                <span className="spec-value">{weight}</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">Preparation:</span>
                <span className="spec-value">{preparationTime}</span>
              </div>
            </div>
            
            <div className="product-actions">
              <div className="quantity-selector">
                <span className="quantity-label">Quantity:</span>
                <div className="quantity-controls">
                  <button 
                    className="quantity-btn" 
                    onClick={handleQuantityDecrease}
                    disabled={quantity <= 1}
                  >
                    <Minus size={16} />
                  </button>
                  <span className="quantity-display">{quantity}</span>
                  <button 
                    className="quantity-btn" 
                    onClick={handleQuantityIncrease}
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
              
              <div className="action-buttons">
                <button onClick={handleAddToCart} className="add-to-cart-btn">
                  <ShoppingBag size={20} />
                  Add to Cart
                </button>
                <button className="buy-now-btn">
                  Buy Now
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;