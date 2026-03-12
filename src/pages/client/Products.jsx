// src/pages/client/Products.jsx
import React, { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import ProductCard from '../../components/client/ProductCard';
import { useProducts } from '../../context/ProductContext';
import './Products.css';

const ITEMS_PER_PAGE = 8;

const Products = () => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('featured');
  const [currentPage, setCurrentPage] = useState(1);
  const { products } = useProducts();

  const cakes = useMemo(() => products.map(p => ({
    ...p,
    priceDisplay: `Rs ${p.price}`,
  })), [products]);

  const categoryCounts = useMemo(() => {
    const counts = { All: cakes.length };
    cakes.forEach(c => {
      counts[c.category] = (counts[c.category] || 0) + 1;
    });
    return counts;
  }, [cakes]);

  const categories = [
    { name: 'All', count: categoryCounts.All || 0 },
    { name: 'Birthday', count: categoryCounts.Birthday || 0 },
    { name: 'Wedding', count: categoryCounts.Wedding || 0 },
    { name: 'Custom', count: categoryCounts.Custom || 0 },
    { name: 'Seasonal', count: categoryCounts.Seasonal || 0 },
    { name: 'Cupcakes', count: categoryCounts.Cupcakes || 0 },
  ].filter(c => c.count > 0 || c.name === 'All');

  // Filter cakes based on selected category and search query
  const filteredCakes = cakes.filter(cake => {
    const matchesCategory = selectedCategory === 'All' || cake.category === selectedCategory;
    const matchesSearch = cake.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         cake.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Sort cakes based on sortBy
  const sortedCakes = useMemo(() => [...filteredCakes].sort((a, b) => {
    switch(sortBy) {
      case 'price-low':
        return a.price - b.price;
      case 'price-high':
        return b.price - a.price;
      case 'rating':
        return (b.rating || 0) - (a.rating || 0);
      case 'trending':
        return (b.isTrending ? 1 : 0) - (a.isTrending ? 1 : 0);
      default:
        return 0;
    }
  }), [filteredCakes, sortBy]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sortedCakes.length / ITEMS_PER_PAGE));
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedCakes = sortedCakes.slice(startIdx, startIdx + ITEMS_PER_PAGE);

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, searchQuery, sortBy]);

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
              {paginatedCakes.map(cake => (
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

        {sortedCakes.length > 0 && (
          <div className="products-pagination">
            <button
              className="page-btn"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            >
              ←
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                className={`page-btn ${currentPage === page ? 'active' : ''}`}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            ))}
            <button
              className="page-btn"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            >
              →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;