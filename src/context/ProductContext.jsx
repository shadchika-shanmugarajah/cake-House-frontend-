import React, { createContext, useState, useEffect, useContext } from 'react';

const ProductContext = createContext();

export const useProducts = () => useContext(ProductContext);

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=300&fit=crop';

const DEFAULT_PRODUCTS = [
  { id: 1, name: 'Chocolate Truffle Cake', description: 'Rich dark chocolate cake with truffle filling', price: 3599, category: 'Birthday', image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=300&fit=crop', rating: 4.8, reviewCount: 124, isTrending: true, stock: 15 },
  { id: 2, name: 'Wedding Cake Deluxe', description: 'Elegant multi-tier wedding cake', price: 1999, category: 'Wedding', image: 'https://images.unsplash.com/photo-1614707267537-b85aaf00c4b7?w=400&h=300&fit=crop', rating: 4.9, reviewCount: 89, isTrending: true, stock: 8 },
  { id: 3, name: 'Vanilla Dream Cake', description: 'Light vanilla sponge with buttercream', price: 2899, category: 'Birthday', image: 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=400&h=300&fit=crop', rating: 4.5, reviewCount: 67, isTrending: false, stock: 22 },
  { id: 4, name: 'Strawberry Delight', description: 'Fresh strawberry cake with whipped cream', price: 3499, category: 'Seasonal', image: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400&h=300&fit=crop', rating: 4.7, reviewCount: 92, isTrending: true, stock: 12 },
  { id: 5, name: 'Lemon Drizzle Cake', description: 'Zesty lemon cake with drizzle icing', price: 2799, category: 'Custom', image: 'https://images.unsplash.com/photo-1576618148400-f54bed99fcfd?w=400&h=300&fit=crop', rating: 4.4, reviewCount: 38, isTrending: true, stock: 5 },
  { id: 6, name: 'Black Forest Cake', description: 'Chocolate cake with cherries & cream', price: 3699, category: 'Wedding', image: 'https://images.unsplash.com/photo-1542826438-bd32f43d626f?w=400&h=300&fit=crop', rating: 4.7, reviewCount: 78, isTrending: false, stock: 10 },
  { id: 7, name: 'Red Velvet Dream', description: 'Classic red velvet with cream cheese frosting', price: 459, category: 'Birthday', image: DEFAULT_IMAGE, rating: 4.8, reviewCount: 42, isTrending: true, stock: 15 },
  { id: 8, name: 'Chocolate Heaven', description: 'Rich chocolate indulgence', price: 599, category: 'Custom', image: DEFAULT_IMAGE, rating: 4.9, reviewCount: 38, isTrending: true, stock: 8 },
];

const STORAGE_KEY = 'cakeHouseProducts';

export const ProductProvider = ({ children }) => {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setProducts(parsed);
          return;
        }
      } catch (e) { /* fallback to defaults */ }
    }
    setProducts(DEFAULT_PRODUCTS);
  }, []);

  useEffect(() => {
    if (products.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
    }
  }, [products]);

  const addProduct = (productData) => {
    const maxId = products.length > 0 ? products.reduce((max, p) => Math.max(max, p.id || 0), 0) : 0;
    const newProduct = {
      id: maxId + 1,
      name: productData.name || 'New Cake',
      description: productData.description || '',
      price: Number(productData.price) || 0,
      category: productData.category || 'Custom',
      image: productData.image || DEFAULT_IMAGE,
      rating: productData.rating ?? 4.5,
      reviewCount: productData.reviewCount ?? 0,
      isTrending: productData.isTrending ?? false,
      stock: Number(productData.stock) || 0,
    };
    setProducts(prev => [newProduct, ...prev]);
    return newProduct;
  };

  const updateProduct = (id, updates) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const deleteProduct = (id) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const getProductById = (id) => products.find(p => p.id === Number(id));

  const value = {
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    getProductById,
  };

  return (
    <ProductContext.Provider value={value}>
      {children}
    </ProductContext.Provider>
  );
};
