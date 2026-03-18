import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import ProductCard from '../../components/client/ProductCard';
import { useProducts } from '../../context/ProductContext';
import './Products.css';

const ITEMS_PER_PAGE = 8;

const Products = () => {
  const [searchParams] = useSearchParams();
  const urlCategory = searchParams.get('category') || '';

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('featured');
  const [currentPage, setCurrentPage] = useState(1);
  const { products, categories: dynamicCategories } = useProducts();

  // Sync URL category param on mount
  useEffect(() => {
    if (urlCategory) {
      // Check if it's an ID match or name match
      const matched = dynamicCategories.find(
        c => c._id === urlCategory || c.name.toLowerCase() === urlCategory.toLowerCase()
      );
      if (matched) setSelectedCategory(matched.name);
      else setSelectedCategory(urlCategory);
    }
  }, [urlCategory, dynamicCategories]);

  // Map products to include display fields
  const cakes = useMemo(() => products.map(p => ({
    ...p,
    name: p.productName || p.name || '',
    category: typeof p.categoryId === 'object' ? p.categoryId?.name : (p.category || ''),
    rating: p.averageRating || p.rating || 0,
    stock: p.stockQuantity ?? p.stock ?? 0,
  })), [products]);

  // Build category list with counts
  const categoryCounts = useMemo(() => {
    const counts = { All: cakes.length };
    cakes.forEach(c => {
      if (c.category) counts[c.category] = (counts[c.category] || 0) + 1;
    });
    return counts;
  }, [cakes]);

  const categories = useMemo(() => [
    { name: 'All', count: categoryCounts.All || 0 },
    ...dynamicCategories.map(cat => ({
      name: cat.name,
      count: categoryCounts[cat.name] || 0,
    })),
  ].filter(c => c.count > 0 || c.name === 'All'), [dynamicCategories, categoryCounts]);

  // Filter
  const filteredCakes = useMemo(() => cakes.filter(cake => {
    const matchesCategory = selectedCategory === 'All' || cake.category === selectedCategory;
    const matchesSearch = !searchQuery ||
      cake.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (cake.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  }), [cakes, selectedCategory, searchQuery]);

  // Sort
  const sortedCakes = useMemo(() => [...filteredCakes].sort((a, b) => {
    switch (sortBy) {
      case 'price-low': return a.price - b.price;
      case 'price-high': return b.price - a.price;
      case 'rating': return b.rating - a.rating;
      case 'newest': return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      case 'featured':
      default: return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
    }
  }), [filteredCakes, sortBy]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sortedCakes.length / ITEMS_PER_PAGE));
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedCakes = sortedCakes.slice(startIdx, startIdx + ITEMS_PER_PAGE);

  // Reset page on filter change
  useEffect(() => { setCurrentPage(1); }, [selectedCategory, searchQuery, sortBy]);

  return (
    <div className="products-page">
      <div className="products-container">
        {/* Header */}
        <div className="products-header">
          <h1>Our Delicious Cakes</h1>
          <p>Browse our handcrafted collection for every sweet occasion</p>
        </div>

        {/* Controls */}
        <div className="products-controls">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search for cakes..."
              className="search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="search-icon" size={18} />
          </div>

          <select className="sort-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="featured">Featured</option>
            <option value="newest">Newest First</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="rating">Top Rated</option>
          </select>

          <span className="products-result-info">{sortedCakes.length} products</span>
        </div>

        {/* Layout: Sidebar + Grid */}
        <div className="products-layout">
          <aside className="categories-sidebar">
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
          </aside>

          <div>
            {paginatedCakes.length > 0 ? (
              <div className="products-grid">
                {paginatedCakes.map(cake => (
                  <ProductCard key={cake._id || cake.id} product={cake} />
                ))}
              </div>
            ) : (
              <div className="no-results">
                <h3>No cakes found</h3>
                <p>Try changing your search or filter criteria</p>
              </div>
            )}
          </div>
        </div>

        {/* Pagination */}
        {sortedCakes.length > ITEMS_PER_PAGE && (
          <div className="products-pagination">
            <button className="page-btn" disabled={currentPage <= 1} onClick={() => setCurrentPage(p => p - 1)}>←</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                className={`page-btn ${currentPage === page ? 'active' : ''}`}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            ))}
            <button className="page-btn" disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)}>→</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;