export const getNotificationRedirectPath = (notification) => {
  if (!notification) return '/notifications';

  if (notification.redirectPath) return notification.redirectPath;

  const orderId = notification.orderId || notification.relatedId || notification.metadata?.orderId;
  const bulkOrderId = notification.relatedId || notification.metadata?.bulkOrderId;
  const productId = notification.relatedId || notification.metadata?.productId;

  if (
    notification.type === 'order_placed'
    || notification.type === 'order_status_update'
    || notification.type === 'order_cancelled_update'
    || notification.type === 'payment_required'
  ) {
    return orderId ? `/orders/${orderId}/tracking` : '/profile?tab=orders';
  }

  if (notification.type === 'bulk_order_approved' || notification.type === 'bulk_order_rejected') {
    return bulkOrderId ? `/bulk-orders/${encodeURIComponent(bulkOrderId)}/tracking` : '/profile?tab=orders';
  }

  if (
    notification.type === 'custom_order_received'
    || notification.type === 'custom_order_quote'
    || notification.type === 'custom_order_price_updated'
    || notification.type === 'custom_order_approved'
    || notification.type === 'custom_order_rejected'
    || notification.type === 'custom_order_status_update'
    || notification.type === 'custom_order_price_accepted'
    || notification.type === 'custom_order_price_rejected'
    || notification.type === 'custom_order_in_progress'
  ) {
    const customOrderId = notification.relatedId || notification.metadata?.requestId;
    return customOrderId
      ? `/profile?tab=custom-orders&customOrderId=${encodeURIComponent(customOrderId)}`
      : '/profile?tab=custom-orders';
  }

  if (notification.type === 'rating_request') {
    return productId ? `/product/${productId}?rate=1` : '/products';
  }

  return '/notifications';
};

export const formatNotificationTime = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffMin < 1440) return `${Math.floor(diffMin / 60)}h ago`;
  return date.toLocaleDateString();
};
