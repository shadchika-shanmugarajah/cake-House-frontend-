import React, { createContext, useState, useEffect, useContext } from 'react';

const OrderContext = createContext();

export const useOrders = () => useContext(OrderContext);

export const OrderProvider = ({ children }) => {
  const [orders, setOrders] = useState([]);
  const [bulkOrders, setBulkOrders] = useState([]);

  useEffect(() => {
    const savedOrders = localStorage.getItem('cakeHouseOrders');
    const savedBulkOrders = localStorage.getItem('cakeHouseBulkOrders');
    if (savedOrders) {
      try { setOrders(JSON.parse(savedOrders)); } catch (e) { /* skip */ }
    }
    if (savedBulkOrders) {
      try { setBulkOrders(JSON.parse(savedBulkOrders)); } catch (e) { /* skip */ }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('cakeHouseOrders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('cakeHouseBulkOrders', JSON.stringify(bulkOrders));
  }, [bulkOrders]);

  const addOrder = (orderData) => {
    const order = {
      id: `ORD-${Date.now().toString(36).toUpperCase()}`,
      ...orderData,
      status: 'completed',
      paymentStatus: 'paid',
      createdAt: new Date().toISOString(),
    };
    setOrders(prev => [order, ...prev]);
    return order;
  };

  const addBulkOrder = (orderData) => {
    const order = {
      id: `BULK-${Date.now().toString(36).toUpperCase()}`,
      ...orderData,
      status: 'pending_approval',
      paymentStatus: 'pending',
      isBulk: true,
      createdAt: new Date().toISOString(),
    };
    setBulkOrders(prev => [order, ...prev]);
    return order;
  };

  const updateBulkOrderStatus = (orderId, newStatus) => {
    setBulkOrders(prev =>
      prev.map(order =>
        order.id === orderId
          ? { ...order, status: newStatus, updatedAt: new Date().toISOString() }
          : order
      )
    );
  };

  const confirmBulkOrder = (orderId) => {
    updateBulkOrderStatus(orderId, 'confirmed');
  };

  const cancelBulkOrder = (orderId) => {
    updateBulkOrderStatus(orderId, 'cancelled');
  };

  const getBulkOrdersByStatus = (status) => {
    if (!status) return bulkOrders;
    return bulkOrders.filter(order => order.status === status);
  };

  return (
    <OrderContext.Provider value={{
      orders,
      bulkOrders,
      addOrder,
      addBulkOrder,
      confirmBulkOrder,
      cancelBulkOrder,
      updateBulkOrderStatus,
      getBulkOrdersByStatus,
    }}>
      {children}
    </OrderContext.Provider>
  );
};

export { OrderContext };
