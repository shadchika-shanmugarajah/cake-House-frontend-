import React, { createContext, useState, useEffect, useContext } from 'react';
import { ordersApi, bulkOrdersApi, notificationsApi } from '../api/api';

const OrderContext = createContext();

export const useOrders = () => useContext(OrderContext);

export const OrderProvider = ({ children }) => {
  const [orders, setOrders] = useState([]);
  const [bulkOrders, setBulkOrders] = useState([]);

  const fetchOrders = async () => {
    try {
      const data = await ordersApi.getAll();
      setOrders(data || []);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      setOrders([]);
    }
  };

  const fetchBulkOrders = async (status) => {
    try {
      const data = await bulkOrdersApi.getAll(status);
      setBulkOrders(data || []);
    } catch (err) {
      console.error('Failed to fetch bulk orders:', err);
      setBulkOrders([]);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchBulkOrders();
  }, []);

  const addOrder = async (orderData) => {
    try {
      const order = await ordersApi.create(orderData);
      setOrders((prev) => [order, ...prev]);
      return order;
    } catch (err) {
      throw err;
    }
  };

  const markOrdersAsViewed = async () => {
    try {
      await ordersApi.markViewed();
      setOrders((prev) => prev.map((o) => ({ ...o, unread: false, isNew: false })));
    } catch (err) {
      console.error('Failed to mark orders viewed:', err);
    }
  };

  const newOrdersCount = orders.filter((o) => o.unread ?? o.isNew).length;

  const addBulkOrder = async (orderData) => {
    try {
      const order = await bulkOrdersApi.create(orderData);
      setBulkOrders((prev) => [order, ...prev]);
      return order;
    } catch (err) {
      throw err;
    }
  };

  const updateBulkOrderStatus = (orderId, newStatus) => {
    setBulkOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus, updatedAt: new Date().toISOString() } : o))
    );
  };

  const confirmBulkOrder = async (orderId) => {
    try {
      await bulkOrdersApi.confirm(orderId);
      updateBulkOrderStatus(orderId, 'confirmed');
    } catch (err) {
      throw err;
    }
  };

  const cancelBulkOrder = async (orderId) => {
    try {
      await bulkOrdersApi.cancel(orderId);
      updateBulkOrderStatus(orderId, 'cancelled');
    } catch (err) {
      throw err;
    }
  };

  const getCustomerNotifications = async (email) => {
    try {
      const data = await notificationsApi.getByEmail(email);
      return (data || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } catch (err) {
      return [];
    }
  };

  const markNotificationRead = async (notificationId) => {
    try {
      await notificationsApi.markRead(notificationId);
    } catch (err) {
      console.error('Failed to mark notification read:', err);
    }
  };

  const markAllNotificationsRead = async (email) => {
    try {
      await notificationsApi.markAllRead(email);
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  const getBulkOrdersByStatus = (status) => {
    if (!status) return bulkOrders;
    return bulkOrders.filter((o) => o.status === status);
  };

  return (
    <OrderContext.Provider
      value={{
        orders,
        bulkOrders,
        newOrdersCount,
        addOrder,
        addBulkOrder,
        markOrdersAsViewed,
        confirmBulkOrder,
        cancelBulkOrder,
        updateBulkOrderStatus,
        getBulkOrdersByStatus,
        getCustomerNotifications,
        markNotificationRead,
        markAllNotificationsRead,
        fetchOrders,
        fetchBulkOrders,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
};

export { OrderContext };
