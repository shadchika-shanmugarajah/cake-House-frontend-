import React from 'react';
import ProductCard from './ProductCard';
import './ProductGrid.css';

// Import your category images
import birthdayIcon from '../../assets/categories/birthday.png';
import weddingIcon from '../../assets/categories/wedding.png';
import customIcon from '../../assets/categories/custom.png';
import seasonalIcon from '../../assets/categories/seasonal.png';

// Updated mock data with 12 products - All prices in consistent "Rs" format
const mockProducts = [
  {
    id: 1,
    name: "Chocolate Truffle Cake",
    description: "Rich dark chocolate cake with truffle filling",
    price: "Rs 3599",
    category: "birthday",
    image: birthdayIcon,
    rating: 4.8,
    reviewCount: 124,
    isTrending: true
  },
  {
    id: 2,
    name: "Wedding Cake Deluxe",
    description: "Elegant multi-tier wedding cake",
    price: "Rs 1999",
    category: "Wedding",
    image: weddingIcon,
    rating: 4.9,
    reviewCount: 89,
    isTrending: true
  },
  {
    id: 3,
    name: "Vanilla Dream Cake",
    description: "Light vanilla sponge with buttercream",
    price: "Rs 2899",
    category: "custom",
    image: customIcon,
    rating: 4.5,
    reviewCount: 67,
    isTrending: false
  },
  {
    id: 4,
    name: "Strawberry Delight",
    description: "Fresh strawberry cake with whipped cream",
    price: "Rs 3499",
    category: "seasonal",
    image: seasonalIcon,
    rating: 4.7,
    reviewCount: 92,
    isTrending: true
  },
  {
    id: 5,
    name: "Carrot Cake",
    description: "Moist carrot cake with walnuts",
    price: "Rs 2999",
    category: "birthday",
    image: birthdayIcon,
    rating: 4.6,
    reviewCount: 45,
    isTrending: false
  },
  {
    id: 6,
    name: "Lemon Drizzle Cake",
    description: "Zesty lemon cake with drizzle icing",
    price: "Rs 2799",
    category: "custom",
    image: customIcon,
    rating: 4.4,
    reviewCount: 38,
    isTrending: true
  },
  {
    id: 7,
    name: "Black Forest Cake",
    description: "Chocolate cake with cherries & cream",
    price: "Rs 3699",
    category: "wedding",
    image: weddingIcon,
    rating: 4.7,
    reviewCount: 78,
    isTrending: false
  },
  {
    id: 8,
    name: "Butterscotch Cake",
    description: "Rich butterscotch with caramel layers",
    price: "Rs 3199",
    category: "birthday",
    image: birthdayIcon,
    rating: 4.5,
    reviewCount: 56,
    isTrending: true
  },
  {
    id: 9,
    name: "Mango Mousse Cake",
    description: "Fresh mango mousse on sponge base",
    price: "Rs 3399",
    category: "seasonal",
    image: seasonalIcon,
    rating: 4.8,
    reviewCount: 67,
    isTrending: false
  },
  {
    id: 10,
    name: "Coffee Walnut Cake",
    description: "Coffee infused cake with walnut crunch",
    price: "Rs 3099",
    category: "custom",
    image: customIcon,
    rating: 4.6,
    reviewCount: 42,
    isTrending: true
  },
  {
    id: 11,
    name: "Blueberry Cheese Cake",
    description: "Creamy cheese cake with blueberry topping",
    price: "Rs 3899", // Fixed: Changed "RS" to "Rs"
    category: "wedding",
    image: weddingIcon,
    rating: 4.9,
    reviewCount: 95,
    isTrending: false
  },
  {
    id: 12,
    name: "Pineapple Upside Down",
    description: "Classic pineapple upside down cake",
    price: "Rs 2699", // Fixed: Added "Rs"
    category: "seasonal",
    image: seasonalIcon,
    rating: 4.3,
    reviewCount: 34,
    isTrending: true
  }
];

const ProductGrid = ({ limit, trendingOnly, showControls = true }) => {
  let products = mockProducts;
  
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