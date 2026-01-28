import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/client/Navbar';
import HeroSection from '../../components/client/HeroSection';
import ProductGrid from '../../components/client/ProductGrid';
import Chatbot from '../../components/client/Chatbot';
import Footer from '../../components/client/Footer';
import Reviews from '../../components/client/Reviews';
import './Home.css';

// Import your category images
import birthdayIcon from '../../assets/categories/birthday.png';
import weddingIcon from '../../assets/categories/wedding.png';
import customIcon from '../../assets/categories/custom.png';
import seasonalIcon from '../../assets/categories/seasonal.png';

const Home = () => {
  // Define categories with images
  const categories = [
    { 
      name: 'Birthday', 
      icon: birthdayIcon,
      description: 'Celebrate special moments'
    },
    { 
      name: 'Wedding', 
      icon: weddingIcon,
      description: 'Perfect for your big day'
    },
    { 
      name: 'Custom', 
      icon: customIcon,
      description: 'Design your dream cake'
    },
    { 
      name: 'Seasonal', 
      icon: seasonalIcon,
      description: 'Fresh seasonal flavors'
    }
  ];

  return (
    <div className="home-page">
      <Navbar />
      <HeroSection />
      
      <section className="trending-section">
        <div className="section-header">
          <h2 className="section-title">🔥 Trending This Week</h2>
      
        </div>
        
        <ProductGrid 
          trendingOnly={true} 
          limit={6} 
          showControls={false} 
        />

        <div className="view-all-container">
          <Link to="/products" className="view-all-btn">
            View All Cakes →
          </Link>
        </div>
      </section>

      <section className="categories-section">
        <div className="section-header">
          <h2 className="section-title">Explore Categories</h2>
    
        </div>
        <div className="categories-grid">
          {categories.map(category => (
            <Link 
              to={`/products?category=${category.name.toLowerCase()}`} 
              key={category.name} 
              className="category-card"
            >
              <div className="category-icon">
                <img 
                  src={category.icon} 
                  alt={`${category.name} icon`} 
                  className="category-image"
                />
              </div>
              <h3>{category.name} Cakes</h3>
              <p className="category-description">{category.description}</p>
            </Link>
          ))}
        </div>
      </section>
      
      <section className="features-section">
        <div className="feature">
          <div className="feature-icon">🚚</div>
          <h3>Free Delivery</h3>
          <p>On orders above $50</p>
        </div>
        <div className="feature">
          <div className="feature-icon">🎁</div>
          <h3>Custom Cakes</h3>
          <p>Personalized just for you</p>
        </div>
        <div className="feature">
          <div className="feature-icon">⭐</div>
          <h3>Premium Quality</h3>
          <p>Fresh ingredients daily</p>
        </div>
      </section>

      <section className="reviews-section-home">
  <Reviews />
</section>
      
      <Chatbot />
      <Footer />
    </div>
  );
};

export default Home;