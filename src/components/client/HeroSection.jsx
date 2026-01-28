import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import './HeroSection.css';

const HeroSection = () => {
  return (
    <section className="hero-section">
      <div className="hero-content">
      
        
        <h1 className="hero-title">
          Taste the Magic in Every
          <span className="highlight"> Slice</span>
        </h1>
        
        <p className="hero-description">
          Indulge in our artisanal cakes crafted with love and premium ingredients. 
          From classic flavors to modern creations, we have the perfect cake for every occasion.
        </p>
        
        <div className="hero-buttons">
          <Link to="/products" className="btn-primary">
            Order Now
            <ArrowRight size={20} />
          </Link>
          
        </div>

        <div className="hero-stats">
          <div className="stat">
            <span className="stat-number">500+</span>
            <span className="stat-label">Happy Customers</span>
          </div>
          <div className="stat">
            <span className="stat-number">100+</span>
            <span className="stat-label">Cake Varieties</span>
          </div>
          <div className="stat">
            <span className="stat-number">24/7</span>
            <span className="stat-label">Order Support</span>
          </div>
        </div>
      </div>
      
      <div className="hero-image">
        <div className="cake-image"></div>
        <div className="floating-element-1"></div>
        <div className="floating-element-2"></div>
        <div className="floating-element-3"></div>
      </div>
    </section>
  );
};

export default HeroSection;