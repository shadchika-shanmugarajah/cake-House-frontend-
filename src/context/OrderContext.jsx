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
    let parsedBulk = [];
    if (savedBulkOrders) {
      try { parsedBulk = JSON.parse(savedBulkOrders); } catch (e) { /* skip */ }
    }
    if (parsedBulk.length > 0) {
      setBulkOrders(parsedBulk);
    } else {
      const sampleBulkOrder = {
        id: 'BULK-SAMPLE1',
        status: 'pending_approval',
        paymentStatus: 'pending',
        isBulk: true,
        createdAt: new Date().toISOString(),
        customer: { name: 'Sample Customer', email: 'customer@example.com', phone: '+1 234 567 890' },
        items: [{ id: 1, name: 'Chocolate Truffle Cake', quantity: 15, price: 35.99, image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=100' }],
        totalQuantity: 15,
        subtotal: 539.85,
        tax: 43.19,
        shipping: 5,
        total: 588.04,
        preferredDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        preferredTime: '14:00',
        deliveryOption: 'delivery',
        address: '123 Sample Street, City',
      };
      setBulkOrders([sampleBulkOrder]);
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
      isNew: true,
    };
    setOrders(prev => [order, ...prev]);
    return order;
  };

  const markOrdersAsViewed = () => {
    setOrders(prev => prev.map(o => ({ ...o, isNew: false })));
  };

  const newOrdersCount = orders.filter(o => o.isNew).length;

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

  const addCustomerNotification = (customerEmail, orderId, message, type = 'bulk_confirmed') => {
    const notifications = JSON.parse(localStorage.getItem('cakeHouseNotifications') || '[]');
    notifications.push({
      id: `notif-${Date.now()}`,
      customerEmail,
      orderId,
      message,
      type,
      read: false,
      createdAt: new Date().toISOString(),
    });
    localStorage.setItem('cakeHouseNotifications', JSON.stringify(notifications));
  };

  const confirmBulkOrder = (orderId) => {
    const order = bulkOrders.find(o => o.id === orderId);
    if (order?.customer?.email) {
      addCustomerNotification(
        order.customer.email,
        orderId,
        `Your bulk order ${orderId} has been confirmed! We'll contact you for payment.`,
        'bulk_confirmed'
      );
    }
    updateBulkOrderStatus(orderId, 'confirmed');
  };

  const cancelBulkOrder = (orderId) => {
    const order = bulkOrders.find(o => o.id === orderId);
    if (order?.customer?.email) {
      addCustomerNotification(
        order.customer.email,
        orderId,
        `Your bulk order ${orderId} has been cancelled. Please contact us if you have questions.`,
        'bulk_cancelled'
      );
    }
    updateBulkOrderStatus(orderId, 'cancelled');
  };

  const getCustomerNotifications = (email) => {
    const notifications = JSON.parse(localStorage.getItem('cakeHouseNotifications') || '[]');
    return notifications.filter(n => n.customerEmail === email).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  };

  const markNotificationRead = (notificationId) => {
    const notifications = JSON.parse(localStorage.getItem('cakeHouseNotifications') || '[]');
    const updated = notifications.map(n => n.id === notificationId ? { ...n, read: true } : n);
    localStorage.setItem('cakeHouseNotifications', JSON.stringify(updated));
  };

  const markAllNotificationsRead = (email) => {
    const notifications = JSON.parse(localStorage.getItem('cakeHouseNotifications') || '[]');
    const updated = notifications.map(n => n.customerEmail === email ? { ...n, read: true } : n);
    localStorage.setItem('cakeHouseNotifications', JSON.stringify(updated));
  };

  const getBulkOrdersByStatus = (status) => {
    if (!status) return bulkOrders;
    return bulkOrders.filter(order => order.status === status);
  };

  return (
    <OrderContext.Provider value={{
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
    }}>
      {children}
    </OrderContext.Provider>
  );
};

export { OrderContext };
