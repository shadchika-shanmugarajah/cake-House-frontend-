import React, { createContext, useState, useEffect, useContext } from 'react';
import { productsApi } from '../api/api';

const ProductContext = createContext();

export const useProducts = () => useContext(ProductContext);

const mapProduct = (p) => ({ ...p, id: p._id || p.id });

export const ProductProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    try {
      const data = await productsApi.getAll();
      setProducts((data || []).map(mapProduct));
    } catch (err) {
      console.error('Failed to fetch products:', err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const addProduct = async (productData) => {
    try {
      const created = await productsApi.create(productData);
      const mapped = mapProduct(created);
      setProducts((prev) => [mapped, ...prev]);
      return mapped;
    } catch (err) {
      throw err;
    }
  };

  const updateProduct = async (id, updates) => {
    try {
      const updated = await productsApi.update(id, updates);
      const mapped = mapProduct(updated);
      setProducts((prev) => prev.map((p) => (String(p.id) === String(id) ? mapped : p)));
      return mapped;
    } catch (err) {
      throw err;
    }
  };

  const deleteProduct = async (id) => {
    try {
      await productsApi.delete(id);
      setProducts((prev) => prev.filter((p) => String(p.id) !== String(id)));
    } catch (err) {
      throw err;
    }
  };

  const getProductById = (id) => {
    const pid = String(id);
    return products.find((p) => String(p.id) === pid || String(p._id) === pid);
  };

  return (
    <ProductContext.Provider value={{ products, loading, addProduct, updateProduct, deleteProduct, getProductById, fetchProducts }}>
      {children}
    </ProductContext.Provider>
  );
};
