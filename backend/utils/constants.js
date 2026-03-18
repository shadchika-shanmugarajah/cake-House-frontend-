/**
 * Application-wide constants and enumerations.
 */

export const ORDER_STATUS = {
  PENDING: 'pending',
  PACKED: 'packed',
  OUT_FOR_DELIVERY: 'out_for_delivery',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
};

export const BULK_ORDER_STATUS = {
  AWAITING_ADMIN_ACCEPTANCE: 'awaiting_admin_acceptance',
  AWAITING_USER_PAYMENT: 'awaiting_user_payment',
  IN_PROGRESS: 'in_progress',
  READY: 'ready',
  OUT_FOR_DELIVERY: 'out_for_delivery',
  DELIVERED: 'delivered',
  REJECTED: 'rejected',
};

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded',
};

export const USER_ROLES = {
  USER: 'user',
  ADMIN: 'admin',
  SUPERADMIN: 'superadmin',
};

export const NOTIFICATION_TYPES = {
  ORDER_PLACED: 'order_placed',
  ORDER_STATUS_UPDATE: 'order_status_update',
  ORDER_CANCELLED_UPDATE: 'order_cancelled_update',
  BULK_ORDER_APPROVED: 'bulk_order_approved',
  BULK_ORDER_REJECTED: 'bulk_order_rejected',
  RATING_REQUEST: 'rating_request',
  ADMIN_NEW_ORDER: 'admin_new_order',
  SYSTEM: 'system',
};

export const INVENTORY_STATUS = {
  IN_STOCK: 'in-stock',
  LOW_STOCK: 'low-stock',
  OUT_OF_STOCK: 'out-of-stock',
};

export const INVENTORY_CATEGORIES = [
  'Dry Ingredients',
  'Dairy',
  'Flavorings',
  'Decorations',
  'Packaging',
  'Equipment',
  'Other',
];

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
};
