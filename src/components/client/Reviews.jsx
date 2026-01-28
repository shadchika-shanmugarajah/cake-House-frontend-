// src/components/client/Reviews.jsx
import React, { useState } from 'react';
import { Star, User, Calendar, Image as ImageIcon } from 'lucide-react';
import './Reviews.css';

const Reviews = () => {
  const [reviews, setReviews] = useState([
    {
      id: 1,
      name: "Sarah Johnson",
      rating: 5,
      date: "2024-01-15",
      comment: "Absolutely stunning wedding cake! The design was exactly what we wanted and tasted incredible. All our guests were raving about it!",
      image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587",
      orderType: "Wedding Cake",
      verified: true
    },
    {
      id: 2,
      name: "Priya Sharma",
      rating: 4,
      date: "2024-01-05",
      comment: "Delicious red velvet cake! Moist and flavorful. Delivery was right on time for our anniversary celebration.",
      image: "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e",
      orderType: "Anniversary Cake",
      verified: true
    }
  ]);

  const [newReview, setNewReview] = useState({
    name: '',
    rating: 5,
    comment: '',
    orderType: ''
  });

  const renderStars = (rating) => {
    return [...Array(5)].map((_, i) => (
      <Star
        key={i}
        size={16}
        fill={i < rating ? "#FFD700" : "#E5E7EB"}
        color={i < rating ? "#FFD700" : "#E5E7EB"}
      />
    ));
  };

  const handleSubmitReview = (e) => {
    e.preventDefault();
    const reviewToAdd = {
      id: reviews.length + 1,
      name: newReview.name || "Anonymous",
      rating: newReview.rating,
      date: new Date().toISOString().split('T')[0],
      comment: newReview.comment,
      orderType: newReview.orderType || "Custom Order",
      verified: false,
      image: null
    };
    
    setReviews([reviewToAdd, ...reviews]);
    setNewReview({ name: '', rating: 5, comment: '', orderType: '' });
    
    // In real app, you would send to backend here
    alert('Thank you for your review! It will appear after moderation.');
  };

  return (
    <section className="reviews-section">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">🍰 Customer Reviews</h2>
          
        </div>

        <div className="reviews-grid">
          {reviews.map(review => (
            <div key={review.id} className="review-card">
              <div className="review-header">
                <div className="reviewer-info">
                  <div className="reviewer-avatar">
                    <User size={20} />
                  </div>
                  <div>
                    <div className="reviewer-name">
                      {review.name}
                    
                    </div>
                    <div className="review-meta">
                      <Calendar size={12} />
                      <span>{review.date}</span>
                      <span className="order-type">• {review.orderType}</span>
                    </div>
                  </div>
                </div>
                <div className="review-rating">
                  {renderStars(review.rating)}
                </div>
              </div>
              
              <p className="review-comment">{review.comment}</p>
              
              {review.image && (
                <div className="review-image">
                  <img src={review.image} alt="Cake review" />
                  
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="add-review-section">
          <h3>Share Your Experience</h3>
          <p>We'd love to hear about your cake experience!</p>
          
          <form onSubmit={handleSubmitReview} className="review-form">
            <div className="form-row">
              <div className="form-group">
                <label>Your Name (Optional)</label>
                <input
                  type="text"
                  value={newReview.name}
                  onChange={(e) => setNewReview({...newReview, name: e.target.value})}
                  placeholder="John Doe"
                />
              </div>
              
              <div className="form-group">
                <label>What did you order?</label>
                <select
                  value={newReview.orderType}
                  onChange={(e) => setNewReview({...newReview, orderType: e.target.value})}
                >
                  <option value="">Select order type</option>
                  <option value="Birthday Cake">Birthday Cake</option>
                  <option value="Wedding Cake">Wedding Cake</option>
                  <option value="Anniversary Cake">Anniversary Cake</option>
                  <option value="Custom Cake">Custom Cake</option>
                  <option value="Seasonal Special">Seasonal Special</option>
                </select>
              </div>
            </div>
            
            <div className="form-group">
              <label>Your Rating</label>
              <div className="rating-selector">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    className={`star-btn ${star <= newReview.rating ? 'active' : ''}`}
                    onClick={() => setNewReview({...newReview, rating: star})}
                  >
                    <Star size={20} />
                  </button>
                ))}
              </div>
            </div>
            
            <div className="form-group">
              <label>Your Review</label>
              <textarea
                value={newReview.comment}
                onChange={(e) => setNewReview({...newReview, comment: e.target.value})}
                placeholder="Tell us about your cake experience..."
                rows="4"
                required
              />
            </div>
            
            <button type="submit" className="submit-review-btn">
              Submit Review
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default Reviews;