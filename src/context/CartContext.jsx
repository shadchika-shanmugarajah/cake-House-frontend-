import React, { createContext, useState, useEffect, useCallback } from 'react';
import { cartApi } from '../api/api';

export const CartContext = createContext();

const STORAGE_KEY = 'cakeHouseCart';
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const getImageUrl = (img) => {
  if (!img) return '';
  if (img.startsWith('http')) return img;
  return `${API_BASE}${img}`;
};

const normaliseItem = (item) => {
  const rawProductId = typeof item.productId === 'object' ? item.productId?._id : item.productId;

  return {
    _id: item._id || item.id,
    id: item._id || item.id,
    productId: rawProductId || item._id || item.id,
    name: item.productName || item.name || '',
    productName: item.productName || item.name || '',
    price: Number(item.price) || 0,
    image: getImageUrl(item.image),
    quantity: Number(item.quantity) || 1,
    category: typeof item.categoryId === 'object' ? item.categoryId?.name : (item.category || ''),
    stock: item.stockQuantity ?? item.stock ?? 999,
  };
};

const mapServerCartItems = (items = []) => (
  items.map((item) => {
    const product = item.productId && typeof item.productId === 'object' ? item.productId : {};
    return normaliseItem({
      ...item,
      productName: product.productName || item.productName,
      image: product.image || item.image,
      stockQuantity: product.stockQuantity,
      categoryId: product.categoryId,
    });
  })
);

const parsePositiveQuantity = (quantity, fallback = 1) => {
  const parsed = Math.trunc(Number(quantity));
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return parsed;
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [syncing, setSyncing] = useState(false);

  const checkAuth = useCallback(() => {
    try {
      const auth = JSON.parse(localStorage.getItem('userAuth') || 'null');
      return !!auth?.token;
    } catch {
      return false;
    }
  }, []);

  const loadFromStorage = useCallback(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setCartItems(JSON.parse(saved).map(normaliseItem));
    } catch {
      // ignore malformed local storage
    }
  }, []);

  useEffect(() => {
    const loggedIn = checkAuth();
    if (!loggedIn) {
      loadFromStorage();
      return;
    }

    cartApi.getCart()
      .then((cart) => {
        if (cart?.items) setCartItems(mapServerCartItems(cart.items));
      })
      .catch(() => {
        loadFromStorage();
      });
  }, [checkAuth, loadFromStorage]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cartItems));
    } catch {
      // ignore storage write errors
    }
  }, [cartItems]);

  const addLocally = (product, quantity) => {
    const item = normaliseItem(product);
    const stock = Number(item.stock);
    let stockError = '';

    setCartItems((prev) => {
      const existing = prev.find((entry) => entry.id === item.id);
      const currentQty = existing ? existing.quantity : 0;
      const nextQty = currentQty + quantity;
      const hasStockLimit = Number.isFinite(stock) && stock >= 0;

      if (hasStockLimit && nextQty > stock) {
        stockError = `Only ${stock} items available in stock`;
        return prev;
      }

      if (existing) {
        return prev.map((entry) => (
          entry.id === item.id ? { ...entry, quantity: nextQty } : entry
        ));
      }

      return [...prev, { ...item, quantity }];
    });

    if (stockError) throw new Error(stockError);
  };

  const updateLocally = (itemId, quantity) => {
    let stockError = '';

    setCartItems((prev) => prev.map((entry) => {
      if ((entry._id || entry.id) !== itemId) return entry;

      const stock = Number(entry.stock);
      const hasStockLimit = Number.isFinite(stock) && stock >= 0;
      if (hasStockLimit && quantity > stock) {
        stockError = `Only ${stock} items available in stock`;
        return entry;
      }

      return { ...entry, quantity };
    }));

    if (stockError) throw new Error(stockError);
  };

  const removeLocally = (itemId) => {
    setCartItems((prev) => prev.filter((entry) => (entry._id || entry.id) !== itemId));
  };

  const addToCart = async (product, quantity = 1) => {
    const requestedQty = parsePositiveQuantity(quantity, 1);

    if (checkAuth()) {
      setSyncing(true);
      try {
        const productId = product._id || product.id;
        const cart = await cartApi.addItem(productId, requestedQty);
        if (cart?.items) setCartItems(mapServerCartItems(cart.items));
      } finally {
        setSyncing(false);
      }
      return;
    }

    addLocally(product, requestedQty);
  };

  const removeFromCart = async (itemId) => {
    if (checkAuth()) {
      setSyncing(true);
      try {
        const cart = await cartApi.removeItem(itemId);
        if (cart?.items) setCartItems(mapServerCartItems(cart.items));
      } finally {
        setSyncing(false);
      }
      return;
    }

    removeLocally(itemId);
  };

  const updateQuantity = async (itemId, quantity) => {
    const requestedQty = Math.trunc(Number(quantity));

    if (!Number.isFinite(requestedQty)) {
      throw new Error('Quantity is invalid');
    }

    if (requestedQty < 1) {
      await removeFromCart(itemId);
      return;
    }

    if (checkAuth()) {
      setSyncing(true);
      try {
        const cart = await cartApi.updateItem(itemId, requestedQty);
        if (cart?.items) setCartItems(mapServerCartItems(cart.items));
      } finally {
        setSyncing(false);
      }
      return;
    }

    updateLocally(itemId, requestedQty);
  };

  const clearCart = async () => {
    if (checkAuth()) {
      setSyncing(true);
      try {
        await cartApi.clearCart();
      } finally {
        setSyncing(false);
      }
    }
    setCartItems([]);
  };

  const getCartTotal = () => cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const getCartCount = () => cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartTotal,
        getCartCount,
        syncing,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
