// src/pages/client/Products.jsx
import React, { useState } from 'react';
import { Search, Filter } from 'lucide-react';
import ProductCard from '../../components/client/ProductCard'; // Import ProductCard
import './Products.css';

const Products = () => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('featured');
  
  const categories = [
    { name: 'All', count: 8 },
    { name: 'Birthday', count: 3 },
    { name: 'Wedding', count: 1 },
    { name: 'Custom', count: 2 },
    { name: 'Seasonal', count: 1 }
  ];

  const cakes = [
    { 
      id: 1, 
      name: 'Chocolate Fantasy', 
      description: 'Rich chocolate cake with fudge frosting and chocolate shavings',
      price: 35,
      image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=300&fit=crop', 
      category: 'Birthday',
      rating: 4.8,
      reviewCount: 124,
      isTrending: true
    },
    { 
      id: 2, 
      name: 'Red Velvet Delight', 
      description: 'Classic red velvet with cream cheese frosting',
      price: 40,
      image: 'https://images.unsplash.com/photo-1614707267537-b85aaf00c4b7?w=400&h=300&fit=crop', 
      category: 'Wedding',
      rating: 4.9,
      reviewCount: 89,
      isTrending: true
    },
    { 
      id: 3, 
      name: 'Vanilla Dream', 
      description: 'Pure vanilla bean cake with buttercream frosting',
      price: 32,
      image: 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=400&h=300&fit=crop', 
      category: 'Birthday',
      rating: 4.7,
      reviewCount: 76,
      isTrending: false
    },
    
    { 
      id: 5, 
      name: 'Lemon Drizzle Cake', 
      description: 'Zesty lemon cake with lemon glaze and drizzle',
      price: 29,
      image: 'https://images.unsplash.com/photo-1576618148400-f54bed99fcfd?w=400&h=300&fit=crop', 
      category: 'Custom',
      rating: 4.5,
      reviewCount: 42,
      isTrending: false
    },
    { 
      id: 6, 
      name: 'Strawberry Shortcake', 
      description: 'Fresh strawberries with whipped cream and sponge cake',
      price: 34,
      image: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400&h=300&fit=crop', 
      category: 'Seasonal',
      rating: 4.8,
      reviewCount: 67,
      isTrending: true
    },
    { 
      id: 7, 
      name: 'Black Forest', 
      description: 'Cherry and chocolate cake with whipped cream',
      price: 42,
      image: 'https://images.unsplash.com/photo-1542826438-bd32f43d626f?w=400&h=300&fit=crop', 
      category: 'Anniversary',
      rating: 4.9,
      reviewCount: 92,
      isTrending: true
    },
    { 
      id: 8, 
      name: 'Coffee Walnut', 
      description: 'Coffee infused cake with walnut pieces and buttercream',
      price: 31,
      image: 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=400&h=300&fit=crop', 
      category: 'Custom',
      rating: 4.4,
      reviewCount: 38,
      isTrending: false
    }
  ];

  // Filter cakes based on selected category and search query
  const filteredCakes = cakes.filter(cake => {
    const matchesCategory = selectedCategory === 'All' || cake.category === selectedCategory;
    const matchesSearch = cake.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         cake.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Sort cakes based on sortBy
  const sortedCakes = [...filteredCakes].sort((a, b) => {
    switch(sortBy) {
      case 'price-low':
        return a.price - b.price;
      case 'price-high':
        return b.price - a.price;
      case 'rating':
        return b.rating - a.rating;
      case 'trending':
        return b.isTrending - a.isTrending;
      default:
        return 0;
    }
  });

  return (
    <div className="products-page">
      <div className="products-container">
        <div className="products-header">
          <h1>Our Delicious Cakes</h1>
          <p>Browse our collection of handcrafted cakes for every special occasion</p>
        </div>

        <div className="products-controls">
          <div className="filter-section">
           
            
            <div className="search-box">
              <input
                type="text"
                placeholder="Search for cakes..."
                className="search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className="search-icon" size={20} />
            </div>
          </div>

         
        </div>

        <div className="products-layout">
          <div className="categories-sidebar">
            <h3>Categories</h3>
            <ul className="category-list">
              {categories.map(category => (
                <li 
                  key={category.name}
                  className={`category-item ${selectedCategory === category.name ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(category.name)}
                >
                  {category.name}
                  <span className="category-count">({category.count})</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="products-grid">
              {sortedCakes.map(cake => (
                <ProductCard key={cake.id} product={cake} />
              ))}
            </div>

            {sortedCakes.length === 0 && (
              <div className="no-results">
                <h3>No cakes found</h3>
                <p>Try changing your search or filter criteria</p>
              </div>
            )}
          </div>
        </div>

        <div className="products-pagination">
          <button className="page-btn" disabled>←</button>
          <button className="page-btn active">1</button>
          <button className="page-btn">2</button>
          <button className="page-btn">3</button>
          <button className="page-btn">→</button>
        </div>
      </div>
    </div>
  );
};

export default Products;