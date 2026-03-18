/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useEffect, useContext, useCallback, useRef } from 'react';
import { ordersApi, bulkOrdersApi, notificationsApi } from '../api/api';
import { useAuth } from './AuthContext';

const OrderContext = createContext();

const NOTIFICATION_LIMIT = 50;
const POLL_INTERVAL_MS = 30000;
const ORDER_SYNC_INTERVAL_MS = 120000;
const ORDER_REFRESH_THROTTLE_MS = 10000;
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const normalizeNotification = (notification = {}) => ({
  ...notification,
  id: notification.id || notification._id,
  read: Boolean(notification.read),
  createdAt: notification.createdAt || new Date().toISOString(),
});

const mergeNotifications = (incoming = [], existing = []) => {
  const map = new Map();

  existing.forEach((item) => {
    const normalized = normalizeNotification(item);
    if (normalized.id) {
      map.set(normalized.id, normalized);
    }
  });

  incoming.forEach((item) => {
    const normalized = normalizeNotification(item);
    if (normalized.id) {
      map.set(normalized.id, {
        ...map.get(normalized.id),
        ...normalized,
      });
    }
  });

  return Array.from(map.values())
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

const toWsUrl = (token) => {
  const base = API_BASE.replace(/\/$/, '');
  const wsBase = base.replace(/^http/, 'ws').replace(/\/api$/, '');
  return `${wsBase}/ws/notifications?token=${encodeURIComponent(token)}`;
};

const shouldRefreshOrdersForNotification = (notification = {}) => {
  const type = String(notification.type || '').toLowerCase();
  const relatedType = String(notification.relatedType || '').toLowerCase();
  return relatedType === 'order'
    || relatedType === 'custom_order'
    || type.startsWith('order_')
    || type.startsWith('custom_order_')
    || type === 'payment_required'
    || type === 'admin_new_order';
};

const shouldRefreshBulkOrdersForNotification = (notification = {}) => {
  const type = String(notification.type || '').toLowerCase();
  const relatedType = String(notification.relatedType || '').toLowerCase();
  return relatedType === 'bulk_order'
    || type.startsWith('bulk_order_');
};

export const useOrders = () => useContext(OrderContext);

export const OrderProvider = ({ children }) => {
  const { user, admin } = useAuth();
  const [orders, setOrders] = useState([]);
  const [bulkOrders, setBulkOrders] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [notificationsLoading, setNotificationsLoading] = useState(false);

  const wsRef = useRef(null);
  const lastOrdersSyncRef = useRef(0);
  const lastBulkOrdersSyncRef = useRef(0);

  const activeSession = user || admin;

  const fetchOrders = useCallback(async () => {
    try {
      const data = await ordersApi.getAll();
      const list = Array.isArray(data) ? data : (data.orders || []);
      setOrders(list);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      setOrders([]);
    }
  }, []);

  const fetchBulkOrders = useCallback(async (status) => {
    try {
      const params = status ? { status } : {};
      const data = await bulkOrdersApi.getAll(params);
      const list = Array.isArray(data) ? data : (data.orders || []);
      setBulkOrders(list);
    } catch (err) {
      console.error('Failed to fetch bulk orders:', err);
      setBulkOrders([]);
    }
  }, []);

  const fetchNotifications = useCallback(async ({ silent = false, limit = NOTIFICATION_LIMIT } = {}) => {
    if (!activeSession?.token) {
      setNotifications([]);
      setUnreadNotificationCount(0);
      return [];
    }

    if (!silent) {
      setNotificationsLoading(true);
    }

    try {
      const data = await notificationsApi.getAll({ limit });
      const list = Array.isArray(data) ? data : (data.notifications || []);
      const normalized = list.map(normalizeNotification);
      const unread = Number.isFinite(Number(data?.unreadCount))
        ? Number(data.unreadCount)
        : normalized.filter((item) => !item.read).length;

      setNotifications(normalized);
      setUnreadNotificationCount(unread);

      return normalized;
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
      return [];
    } finally {
      if (!silent) {
        setNotificationsLoading(false);
      }
    }
  }, [activeSession?.token]);

  useEffect(() => {
    if (!activeSession?.token) {
      setOrders([]);
      setBulkOrders([]);
      return;
    }

    fetchOrders();
    fetchBulkOrders();
  }, [activeSession?.token, fetchOrders, fetchBulkOrders]);

  useEffect(() => {
    if (!activeSession?.token) {
      setNotifications([]);
      setUnreadNotificationCount(0);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      return;
    }

    let isCancelled = false;

    fetchNotifications();

    const poller = setInterval(() => {
      fetchNotifications({ silent: true });
    }, POLL_INTERVAL_MS);

    try {
      const ws = new WebSocket(toWsUrl(activeSession.token));
      wsRef.current = ws;

      ws.onmessage = (event) => {
        if (isCancelled) return;

        try {
          const payload = JSON.parse(event.data || '{}');
          if (payload?.type !== 'notification' || !payload.notification) {
            return;
          }

          setNotifications((prev) => {
            const merged = mergeNotifications([payload.notification], prev).slice(0, NOTIFICATION_LIMIT);
            setUnreadNotificationCount(merged.filter((item) => !item.read).length);
            return merged;
          });

          if (shouldRefreshOrdersForNotification(payload.notification)) {
            const now = Date.now();
            if (now - lastOrdersSyncRef.current >= ORDER_REFRESH_THROTTLE_MS) {
              lastOrdersSyncRef.current = now;
              fetchOrders();
            }
          }

          if (shouldRefreshBulkOrdersForNotification(payload.notification)) {
            const now = Date.now();
            if (now - lastBulkOrdersSyncRef.current >= ORDER_REFRESH_THROTTLE_MS) {
              lastBulkOrdersSyncRef.current = now;
              fetchBulkOrders();
            }
          }
        } catch {
          // Ignore malformed payloads.
        }
      };
    } catch {
      // Polling fallback remains active.
    }

    return () => {
      isCancelled = true;
      clearInterval(poller);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [activeSession?.token, fetchNotifications, fetchOrders, fetchBulkOrders]);

  useEffect(() => {
    if (!activeSession?.token) return undefined;

    const syncOrders = () => {
      const now = Date.now();
      if (now - lastOrdersSyncRef.current >= ORDER_REFRESH_THROTTLE_MS) {
        lastOrdersSyncRef.current = now;
        fetchOrders();
      }
      if (now - lastBulkOrdersSyncRef.current >= ORDER_REFRESH_THROTTLE_MS) {
        lastBulkOrdersSyncRef.current = now;
        fetchBulkOrders();
      }
    };

    const intervalId = setInterval(syncOrders, ORDER_SYNC_INTERVAL_MS);

    const handleFocusOrVisible = () => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;
      syncOrders();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('focus', handleFocusOrVisible);
    }
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleFocusOrVisible);
    }

    return () => {
      clearInterval(intervalId);
      if (typeof window !== 'undefined') {
        window.removeEventListener('focus', handleFocusOrVisible);
      }
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleFocusOrVisible);
      }
    };
  }, [activeSession?.token, fetchOrders, fetchBulkOrders]);

  const addOrder = async (orderData) => {
    const response = await ordersApi.create(orderData);
    const createdOrder = response?.order || response;
    setOrders((prev) => [createdOrder, ...prev]);
    fetchNotifications({ silent: true });
    return response;
  };

  const cancelOrder = async (orderId, reason = '') => {
    const response = await ordersApi.cancel(orderId, reason);
    const updatedOrder = response?.order || response;

    setOrders((prev) => prev.map((order) => (
      (order.orderId || order.id) === (updatedOrder.orderId || updatedOrder.id)
        ? { ...order, ...updatedOrder }
        : order
    )));

    fetchNotifications({ silent: true });
    return response;
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
    const response = await bulkOrdersApi.create(orderData);
    const createdOrder = response?.order || response;
    setBulkOrders((prev) => [createdOrder, ...prev]);
    return response;
  };

  const updateBulkOrderStatus = (orderId, newStatus) => {
    setBulkOrders((prev) =>
      prev.map((o) => (
        (o.id === orderId || o.bulkOrderId === orderId)
          ? { ...o, status: newStatus, approvalStatus: newStatus, updatedAt: new Date().toISOString() }
          : o
      ))
    );
  };

  const confirmBulkOrder = async (orderId) => {
    await bulkOrdersApi.approve(orderId);
    updateBulkOrderStatus(orderId, 'awaiting_user_payment');
    fetchNotifications({ silent: true });
  };

  const cancelBulkOrder = async (orderId) => {
    await bulkOrdersApi.reject(orderId);
    updateBulkOrderStatus(orderId, 'rejected');
    fetchNotifications({ silent: true });
  };

  const getBulkOrderTracking = async (orderId) => bulkOrdersApi.getTracking(orderId);

  const setBulkOrderPaymentMethod = async (orderId, paymentMethod) => (
    bulkOrdersApi.setPaymentMethod(orderId, paymentMethod)
  );

  const getCustomerNotifications = useCallback(
    async () => fetchNotifications({ silent: true }),
    [fetchNotifications]
  );

  const markNotificationRead = async (notificationId) => {
    try {
      await notificationsApi.markRead(notificationId);
      setNotifications((prev) => {
        const next = prev.map((item) => (
          item.id === notificationId ? { ...item, read: true } : item
        ));
        setUnreadNotificationCount(next.filter((item) => !item.read).length);
        return next;
      });
    } catch (err) {
      console.error('Failed to mark notification read:', err);
    }
  };

  const markAllNotificationsRead = async () => {
    try {
      await notificationsApi.markAllRead();
      setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
      setUnreadNotificationCount(0);
    } catch (err) {
      console.error('Failed to mark all notifications read:', err);
    }
  };

  const getBulkOrdersByStatus = (status) => {
    if (!status) return bulkOrders;
    return bulkOrders.filter((o) => (o.approvalStatus || o.status) === status);
  };

  return (
    <OrderContext.Provider
      value={{
        orders,
        bulkOrders,
        newOrdersCount,
        notifications,
        unreadNotificationCount,
        notificationsLoading,
        addOrder,
        cancelOrder,
        addBulkOrder,
        markOrdersAsViewed,
        confirmBulkOrder,
        cancelBulkOrder,
        getBulkOrderTracking,
        setBulkOrderPaymentMethod,
        updateBulkOrderStatus,
        getBulkOrdersByStatus,
        getCustomerNotifications,
        markNotificationRead,
        markAllNotificationsRead,
        fetchOrders,
        fetchBulkOrders,
        fetchNotifications,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
};

export { OrderContext };
