import React, { useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShoppingBag, Plus, Minus, ArrowLeft } from 'lucide-react';
import { CartContext } from '../../context/CartContext';
import { toast } from 'react-toastify';
import './ProductDetail.css';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useContext(CartContext);
  
  const [quantity, setQuantity] = useState(1);
  
  // Mock product data - in real app, fetch from API
  const cake = {
    id: id,
    name: 'Chocolate Fantasy',
    price: 35.99,
    description: 'A rich and decadent chocolate cake layered with creamy chocolate ganache.',
    longDescription: 'Our signature chocolate cake made with premium cocoa and Belgian chocolate. Each layer is generously filled with smooth chocolate ganache and finished with a rich chocolate buttercream frosting. Perfect for chocolate lovers!',
    image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&h=600&fit=crop',
    category: 'Chocolate',
    rating: 4.8,
    reviews: 124,
    ingredients: ['Premium Cocoa', 'Belgian Chocolate', 'Fresh Cream', 'Organic Eggs', 'Vanilla Extract'],
    servingSize: '8-10 people',
    weight: '2 lbs',
    preparationTime: '24 hours advance order',
    isTrending: true
  };

  const handleAddToCart = () => {
    const productToAdd = {
      ...cake,
      quantity: quantity
    };
    
    addToCart(productToAdd);
    toast.success(`${cake.name} added to cart!`);
    
    // Optionally navigate to cart
    navigate('/cart');
  };

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
                {'★'.repeat(Math.floor(cake.rating))}
                {'☆'.repeat(5 - Math.floor(cake.rating))}
              </div>
              <span className="review-count">({cake.reviews} reviews)</span>
            </div>
            
            <div className="product-price">
              ${cake.price.toFixed(2)}
            </div>
            
            <p className="product-description">{cake.longDescription}</p>
            
            <div className="product-specs">
              <div className="spec-item">
                <span className="spec-label">Serving Size:</span>
                <span className="spec-value">{cake.servingSize}</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">Weight:</span>
                <span className="spec-value">{cake.weight}</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">Preparation:</span>
                <span className="spec-value">{cake.preparationTime}</span>
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