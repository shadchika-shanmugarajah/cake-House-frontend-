import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from '../../components/client/ProductCard';
import Chatbot from '../../components/client/Chatbot';
import Footer from '../../components/client/Footer';
import Reviews from '../../components/client/Reviews';
import { productsApi, categoriesApi } from '../../api/api';
import './Home.css';

// Import category images (with fallback)
let birthdayIcon, weddingIcon, customIcon, seasonalIcon;
try { birthdayIcon = new URL('../../assets/categories/birthday.png', import.meta.url).href; } catch { birthdayIcon = ''; }
try { weddingIcon = new URL('../../assets/categories/wedding.png', import.meta.url).href; } catch { weddingIcon = ''; }
try { customIcon = new URL('../../assets/categories/custom.png', import.meta.url).href; } catch { customIcon = ''; }
try { seasonalIcon = new URL('../../assets/categories/seasonal.png', import.meta.url).href; } catch { seasonalIcon = ''; }

const categoryIcons = { Birthday: birthdayIcon, Wedding: weddingIcon, Custom: customIcon, Seasonal: seasonalIcon };
const categoryEmojis = { Birthday: '🎂', Wedding: '💒', Custom: '🎨', Seasonal: '🍂', Cupcakes: '🧁' };

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodData, catData] = await Promise.all([
          productsApi.getAll({ featured: 'true', limit: 6 }),
          categoriesApi.getAll(),
        ]);
        const prods = Array.isArray(prodData) ? prodData : (prodData.products || []);
        setFeaturedProducts(prods.slice(0, 6));
        setCategories(Array.isArray(catData) ? catData : []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="home-page">

      {/* ═══ HERO BANNER ═══════════════════════════════════════ */}
      <section className="hero-banner">
        <div className="hero-bg-shape hero-bg-shape-1" />
        <div className="hero-bg-shape hero-bg-shape-2" />
        <div className="hero-bg-shape hero-bg-shape-3" />

        <div className="hero-inner">
          <div className="hero-text">
            <div className="hero-badge">🍰 Freshly Baked Daily</div>
            <h1 className="hero-title">
              Handcrafted Cakes for <span>Every Sweet Moment</span>
            </h1>
            <p className="hero-subtitle">
              From birthdays to weddings, we create delicious artisan cakes with the finest
              ingredients. Order online and get it delivered fresh to your doorstep.
            </p>
            <div className="hero-actions">
              <Link to="/products" className="hero-btn-primary">
                🛒 Shop Now
              </Link>
              <Link to="/bulk-order" className="hero-btn-secondary">
                📦 Bulk Orders
              </Link>
            </div>
            <div className="hero-stats">
              <div className="hero-stat">
                <div className="hero-stat-value">500+</div>
                <div className="hero-stat-label">Happy Customers</div>
              </div>
              <div className="hero-stat">
                <div className="hero-stat-value">50+</div>
                <div className="hero-stat-label">Cake Varieties</div>
              </div>
              <div className="hero-stat">
                <div className="hero-stat-value">4.9</div>
                <div className="hero-stat-label">Average Rating</div>
              </div>
            </div>
          </div>

          <div className="hero-image">
            <img
              src="https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&h=700&fit=crop"
              alt="Delicious chocolate cake"
            />
          </div>
        </div>
      </section>

      {/* ═══ FEATURED CAKES ════════════════════════════════════ */}
      <section className="home-section">
        <div className="section-header">
          <div className="section-tag">⭐ Customer Favorites</div>
          <h2 className="section-title">Featured Cakes</h2>
          <p className="section-subtitle">
            Our most loved creations, baked fresh with premium ingredients and attention to every detail.
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--cake-text-sec)' }}>Loading delicious cakes...</div>
        ) : (
          <div className="featured-grid">
            {featuredProducts.map(p => (
              <ProductCard key={p._id || p.id} product={p} />
            ))}
          </div>
        )}

        <div className="view-all-container">
          <Link to="/products" className="view-all-btn">
            View All Cakes →
          </Link>
        </div>
      </section>

      {/* ═══ CATEGORIES ════════════════════════════════════════ */}
      <section className="categories-section">
        <div className="categories-inner">
          <div className="section-header">
            <div className="section-tag">🎨 Browse By</div>
            <h2 className="section-title">Explore Categories</h2>
            <p className="section-subtitle">Find the perfect cake for any occasion</p>
          </div>

          <div className="categories-grid">
            {categories.map(cat => (
              <Link
                to={`/products?category=${cat._id}`}
                key={cat._id}
                className="category-card"
              >
                <div className="category-icon">
                  {(categoryIcons[cat.name] || cat.image) ? (
                    <img
                      src={categoryIcons[cat.name] || cat.image}
                      alt={cat.name}
                      className="category-image"
                      onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling && (e.target.nextSibling.style.display = 'flex'); }}
                    />
                  ) : (
                    <div className="category-emoji">
                      {categoryEmojis[cat.name] || '🍰'}
                    </div>
                  )}
                </div>
                <h3>{cat.name} Cakes</h3>
                <p className="category-description">{cat.description || 'Explore collection'}</p>
                {cat.productCount > 0 && (
                  <span className="category-count">{cat.productCount} products</span>
                )}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ WHY CHOOSE US ═════════════════════════════════════ */}
      <section className="features-section">
        <div className="features-inner">
          <div className="section-header" style={{ marginBottom: 40 }}>
            <h2 className="section-title" style={{ color: '#fff' }}>Why Choose Cake House?</h2>
          </div>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🚚</div>
              <h3>Free Delivery</h3>
              <p>Free delivery on orders above LKR 5,000. Fresh to your doorstep.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🎨</div>
              <h3>Custom Designs</h3>
              <p>Create your dream cake with our custom design service.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🌿</div>
              <h3>Fresh Ingredients</h3>
              <p>We use only premium, fresh ingredients sourced daily.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">⭐</div>
              <h3>5-Star Quality</h3>
              <p>Rated 4.9/5 by over 500 happy customers.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ ABOUT SECTION ═════════════════════════════════════ */}
      <section className="about-section">
        <div className="about-inner">
          <div className="about-image">
            <img
              src="https://images.unsplash.com/photo-1517433670267-08bbd4be890f?w=600&h=400&fit=crop"
              alt="Our bakery kitchen"
            />
          </div>
          <div className="about-content">
            <div className="section-tag">🏠 Our Story</div>
            <h2>Baking Happiness Since Day One</h2>
            <p>
              At Cake House, every cake tells a story. We started with a simple mission — to bring
              joy through handcrafted cakes made with love and the finest ingredients.
            </p>
            <p>
              From intimate celebrations to grand weddings, our artisan bakers create
              masterpieces that taste as incredible as they look.
            </p>
            <div className="about-highlights">
              <div className="about-highlight">
                <div className="about-highlight-icon">🎂</div>
                <span>50+ Cake Varieties</span>
              </div>
              <div className="about-highlight">
                <div className="about-highlight-icon">👨‍🍳</div>
                <span>Expert Bakers</span>
              </div>
              <div className="about-highlight">
                <div className="about-highlight-icon">🏆</div>
                <span>Award Winning</span>
              </div>
              <div className="about-highlight">
                <div className="about-highlight-icon">💯</div>
                <span>100% Fresh</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ CONTACT SECTION ═══════════════════════════════════ */}
      <section className="contact-section">
        <div className="contact-inner">
          <div className="section-header">
            <div className="section-tag">📞 Get In Touch</div>
            <h2 className="section-title">Contact Us</h2>
            <p className="section-subtitle">
              Have a question or want to place a custom order? We'd love to hear from you!
            </p>
          </div>
          <div className="contact-cards">
            <div className="contact-card">
              <div className="contact-card-icon">📍</div>
              <h4>Visit Us</h4>
              <p>123 Bakery Lane,<br />Colombo, Sri Lanka</p>
            </div>
            <div className="contact-card">
              <div className="contact-card-icon">📞</div>
              <h4>Call Us</h4>
              <p>+94 11 234 5678<br />Mon-Sat, 8AM-8PM</p>
            </div>
            <div className="contact-card">
              <div className="contact-card-icon">✉️</div>
              <h4>Email Us</h4>
              <p>orders@cakehouse.lk<br />hello@cakehouse.lk</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ REVIEWS ═══════════════════════════════════════════ */}
      <section className="reviews-section-home">
        <Reviews />
      </section>

      <Chatbot />
      <Footer />
    </div>
  );
};

export default Home;