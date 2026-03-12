import React from 'react';
import ProductCard from './ProductCard';
import { useProducts } from '../../context/ProductContext';
import './ProductGrid.css';

const ProductGrid = ({ limit, trendingOnly, showControls = true }) => {
  const { products: contextProducts } = useProducts();
  let products = contextProducts.map(p => ({
    ...p,
    price: p.price,
    priceDisplay: `Rs ${p.price}`,
  }));
  
  if (trendingOnly) {
    products = products.filter(product => product.isTrending);
  }
  
  if (limit) {
    products = products.slice(0, limit);
  }

  return (
    <>
      {showControls && (
        <div className="grid-controls">
          <div className="product-count">
            Showing <span>{products.length}</span> products
          </div>
          <div className="filter-sort">
            <select className="filter-select">
              <option>All Categories</option>
              <option>Chocolate</option>
              <option>Classic</option>
              <option>Vanilla</option>
              <option>Fruit</option>
              <option>Specialty</option>
              <option>Citrus</option>
              <option>Caramel</option>
              <option>Coffee</option>
              <option>Cheese</option>
            </select>
            <select className="sort-select">
              <option>Sort by: Popular</option>
              <option>Price: Low to High</option>
              <option>Price: High to Low</option>
              <option>Rating</option>
            </select>
          </div>
        </div>
      )}
      
      <div className="product-grid">
        {products.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </>
  );
};

export default ProductGrid;