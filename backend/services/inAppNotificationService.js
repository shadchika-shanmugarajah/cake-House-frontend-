import Notification from '../models/Notification.js';
import { publishNotification } from './realtimeNotifications.js';

const toPlain = (doc) => (
  typeof doc?.toObject === 'function'
    ? doc.toObject({ virtuals: true })
    : doc
);

const normalizeEmail = (value) => String(value || '').trim().toLowerCase();
const normalizeId = (value) => (value ? String(value) : '');

export const resolveNotificationRedirect = ({
  type,
  orderId,
  bulkOrderId,
  customOrderId,
  productId,
  redirectPath,
}) => {
  if (redirectPath) return redirectPath;

  if (type === 'order_placed' || type === 'order_status_update' || type === 'order_cancelled_update') {
    return orderId ? `/orders/${orderId}/tracking` : '/profile?tab=orders';
  }

  if (type === 'payment_required') {
    return orderId ? `/orders/${orderId}/tracking` : '/profile?tab=orders';
  }

  if (type === 'bulk_order_approved' || type === 'bulk_order_rejected') {
    return bulkOrderId ? `/profile?tab=orders&bulkOrderId=${encodeURIComponent(bulkOrderId)}` : '/profile?tab=orders';
  }

  if (
    type === 'custom_order_received'
    || type === 'custom_order_price_updated'
    || type === 'custom_order_approved'
    || type === 'custom_order_rejected'
    || type === 'custom_order_status_update'
    || type === 'custom_order_quote'
    || type === 'custom_order_price_accepted'
    || type === 'custom_order_price_rejected'
    || type === 'custom_order_in_progress'
  ) {
    return customOrderId
      ? `/profile?tab=custom-orders&customOrderId=${encodeURIComponent(customOrderId)}`
      : '/profile?tab=custom-orders';
  }

  if (type === 'rating_request') {
    return productId ? `/product/${productId}?rate=1` : '/products';
  }

  return '/notifications';
};

export const createInAppNotification = async (payload = {}) => {
  const safeType = payload.type || 'system';
  const orderId = normalizeId(payload.orderId || payload.relatedId);
  const bulkOrderId = normalizeId(payload.bulkOrderId || payload.relatedId);
  const customOrderId = normalizeId(payload.customOrderId || payload.relatedId);
  const productId = normalizeId(payload.productId || payload.relatedId);

  const doc = await Notification.create({
    userId: payload.userId || null,
    customerEmail: normalizeEmail(payload.customerEmail),
    orderId,
    title: payload.title || 'Notification',
    message: payload.message || '',
    type: safeType,
    relatedType: payload.relatedType || 'system',
    relatedId: normalizeId(payload.relatedId),
    redirectPath: resolveNotificationRedirect({
      type: safeType,
      orderId,
      bulkOrderId,
      customOrderId,
      productId,
      redirectPath: payload.redirectPath,
    }),
    metadata: payload.metadata || {},
    read: false,
  });

  const normalized = toPlain(doc);
  publishNotification(normalized);
  return normalized;
};

export const createInAppNotifications = async (payloads = []) => {
  if (!Array.isArray(payloads) || payloads.length === 0) return [];
  return Promise.all(payloads.map((payload) => createInAppNotification(payload)));
};
