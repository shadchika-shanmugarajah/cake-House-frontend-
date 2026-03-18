import React, { createContext, useState, useEffect, useContext } from 'react';
import { productsApi, categoriesApi } from '../api/api';

const ProductContext = createContext();

export const useProducts = () => useContext(ProductContext);

const mapProduct = (p) => ({ ...p, id: p._id || p.id });

export const ProductProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = async (categoryFilter = 'all') => {
    try {
      const params = {};
      if (categoryFilter && categoryFilter !== 'all') {
        params.category = categoryFilter;
      }
      const data = await productsApi.getAll(params);
      // API returns { products, pagination } — extract the array
      const list = Array.isArray(data) ? data : (data.products || []);
      setProducts(list.map(mapProduct));
    } catch (err) {
      console.error('Failed to fetch products:', err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await categoriesApi.getAll();
      setCategories(data || []);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
      setCategories([]);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
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

  const addCategory = async (name, description) => {
    try {
      const created = await categoriesApi.create({ name, description });
      setCategories((prev) => [created, ...prev]);
      return created;
    } catch (err) {
      throw err;
    }
  };

  const deleteCategory = async (id) => {
    try {
      await categoriesApi.delete(id);
      setCategories((prev) => prev.filter((c) => String(c._id) !== String(id)));
    } catch (err) {
      throw err;
    }
  };

  return (
    <ProductContext.Provider value={{ 
      products, categories, loading, 
      addProduct, updateProduct, deleteProduct, getProductById, fetchProducts,
      addCategory, deleteCategory, fetchCategories 
    }}>
      {children}
    </ProductContext.Provider>
  );
};
