import express from 'express';
import mongoose from 'mongoose';
import BulkOrder from '../models/BulkOrder.js';
import { notifyBulkOrderUpdate } from '../services/notificationService.js';
import { verifyUser, verifyAdmin } from '../middleware/auth.js';
import { createBulkOrderRules } from '../validators/orderValidator.js';
import validate from '../middleware/validate.js';
import { PAGINATION } from '../utils/constants.js';
import { createInAppNotification } from '../services/inAppNotificationService.js';

const router = express.Router();

const BULK_MIN_QUANTITY = 12;
const BULK_MIN_DAYS_AHEAD = 3;
let hasTriedDroppingLegacyIdIndex = false;

const isAdminRole = (role) => role === 'admin' || role === 'superadmin';

const BULK_STATUS = {
  AWAITING_ADMIN_ACCEPTANCE: 'awaiting_admin_acceptance',
  AWAITING_USER_PAYMENT: 'awaiting_user_payment',
  IN_PROGRESS: 'in_progress',
  READY: 'ready',
  OUT_FOR_DELIVERY: 'out_for_delivery',
  DELIVERED: 'delivered',
  REJECTED: 'rejected',
};

const ORDER_LOCK_MESSAGE = 'Your order is already in progress and can no longer be modified or cancelled.';
const LOCKED_CUSTOMER_BULK_STATUSES = new Set([
  BULK_STATUS.IN_PROGRESS,
  BULK_STATUS.READY,
  BULK_STATUS.OUT_FOR_DELIVERY,
  BULK_STATUS.DELIVERED,
]);

const BULK_STATUS_ALIASES = {
  pending: BULK_STATUS.AWAITING_ADMIN_ACCEPTANCE,
  pending_approval: BULK_STATUS.AWAITING_ADMIN_ACCEPTANCE,
  approved: BULK_STATUS.AWAITING_USER_PAYMENT,
  completed: BULK_STATUS.DELIVERED,
};

const BULK_STATUS_QUERY_VALUES = {
  [BULK_STATUS.AWAITING_ADMIN_ACCEPTANCE]: [BULK_STATUS.AWAITING_ADMIN_ACCEPTANCE, 'pending'],
  [BULK_STATUS.AWAITING_USER_PAYMENT]: [BULK_STATUS.AWAITING_USER_PAYMENT, 'approved'],
  [BULK_STATUS.IN_PROGRESS]: [BULK_STATUS.IN_PROGRESS],
  [BULK_STATUS.READY]: [BULK_STATUS.READY],
  [BULK_STATUS.OUT_FOR_DELIVERY]: [BULK_STATUS.OUT_FOR_DELIVERY],
  [BULK_STATUS.DELIVERED]: [BULK_STATUS.DELIVERED, 'completed'],
  [BULK_STATUS.REJECTED]: [BULK_STATUS.REJECTED],
};

const BULK_STATUS_TRANSITIONS = {
  [BULK_STATUS.AWAITING_ADMIN_ACCEPTANCE]: [BULK_STATUS.AWAITING_USER_PAYMENT, BULK_STATUS.REJECTED],
  [BULK_STATUS.AWAITING_USER_PAYMENT]: [BULK_STATUS.IN_PROGRESS, BULK_STATUS.REJECTED],
  [BULK_STATUS.IN_PROGRESS]: [BULK_STATUS.READY, BULK_STATUS.REJECTED],
  [BULK_STATUS.READY]: [BULK_STATUS.OUT_FOR_DELIVERY, BULK_STATUS.REJECTED],
  [BULK_STATUS.OUT_FOR_DELIVERY]: [BULK_STATUS.DELIVERED],
  [BULK_STATUS.DELIVERED]: [],
  [BULK_STATUS.REJECTED]: [],
};

const TRACKABLE_BULK_STATUSES = new Set([
  BULK_STATUS.AWAITING_USER_PAYMENT,
  BULK_STATUS.IN_PROGRESS,
  BULK_STATUS.READY,
  BULK_STATUS.OUT_FOR_DELIVERY,
  BULK_STATUS.DELIVERED,
]);

const normalizeBulkStatus = (value) => {
  const normalized = String(value || BULK_STATUS.AWAITING_ADMIN_ACCEPTANCE).trim().toLowerCase();
  return BULK_STATUS_ALIASES[normalized] || normalized;
};

const getBulkStatusQueryValues = (status) => {
  const normalized = normalizeBulkStatus(status);
  return BULK_STATUS_QUERY_VALUES[normalized] || [normalized];
};

const canTrackBulkOrder = (status, trackingEnabled = false) => {
  return Boolean(trackingEnabled) || TRACKABLE_BULK_STATUSES.has(normalizeBulkStatus(status));
};

const formatBulkStatusLabel = (status) => (
  String(status || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
);

const formatBulkOrder = (doc) => {
  const order = typeof doc.toObject === 'function' ? doc.toObject({ virtuals: true }) : doc;
  const normalizedStatus = normalizeBulkStatus(order.approvalStatus || order.status);

  return {
    ...order,
    id: order.bulkOrderId,
    approvalStatus: normalizedStatus,
    status: normalizedStatus,
    canTrack: canTrackBulkOrder(normalizedStatus, order.trackingEnabled),
    total: order.totalAmount,
    preferredDate: order.requestedDeliveryDate
      ? new Date(order.requestedDeliveryDate).toISOString().split('T')[0]
      : '',
    preferredTime: order.deliverySlot || '',
    customer: {
      name: order.customerName,
      email: order.customerEmail,
      phone: order.customerPhone,
    },
  };
};

const getBulkTrackingProgress = (order) => {
  const currentStatus = normalizeBulkStatus(order.approvalStatus || order.status);
  const isRejected = currentStatus === BULK_STATUS.REJECTED;
  const flow = [
    BULK_STATUS.AWAITING_ADMIN_ACCEPTANCE,
    BULK_STATUS.AWAITING_USER_PAYMENT,
    BULK_STATUS.IN_PROGRESS,
    BULK_STATUS.READY,
    BULK_STATUS.OUT_FOR_DELIVERY,
    BULK_STATUS.DELIVERED,
  ];
  const currentIndex = flow.indexOf(currentStatus);

  const steps = flow.map((statusKey, index) => ({
    key: statusKey,
    label: formatBulkStatusLabel(statusKey),
    completed: !isRejected && currentIndex >= index,
    active: !isRejected && currentIndex === index,
  }));

  return {
    currentStatus,
    isRejected,
    waitingForApproval: currentStatus === BULK_STATUS.AWAITING_ADMIN_ACCEPTANCE,
    steps,
  };
};

const parseBulkOrderIdFilter = (id) => {
  const filters = [{ bulkOrderId: id }];
  if (mongoose.Types.ObjectId.isValid(id)) {
    filters.push({ _id: id });
  }
  return { $or: filters };
};

const findBulkOrderById = async (id) => BulkOrder.findOne(parseBulkOrderIdFilter(id));

const dropLegacyIdIndexIfNeeded = async () => {
  if (hasTriedDroppingLegacyIdIndex) return;
  hasTriedDroppingLegacyIdIndex = true;

  const collection = mongoose.connection?.db?.collection('bulkorders');
  if (!collection) return;

  const indexes = await collection.indexes();
  const hasLegacyIndex = indexes.some((index) => index.name === 'id_1');
  if (hasLegacyIndex) {
    await collection.dropIndex('id_1');
    console.log('Dropped legacy bulkorders index id_1 after duplicate key detection');
  }
};

const getDuplicateFieldFromError = (err) => {
  const keys = [
    ...Object.keys(err?.keyPattern || {}),
    ...Object.keys(err?.keyValue || {}),
  ];

  if (keys.length > 0) return keys[0];

  if (/dup key.*\{ id: null \}/i.test(err?.message || '')) return 'id';
  if (/dup key.*\{ bulkOrderId:/i.test(err?.message || '')) return 'bulkOrderId';

  return '';
};

const createBulkOrderWithRetry = async (payload, maxAttempts = 3) => {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await BulkOrder.create(payload);
    } catch (err) {
      if (err?.code !== 11000) {
        throw err;
      }

      const duplicateField = getDuplicateFieldFromError(err);
      if (duplicateField === 'id') {
        await dropLegacyIdIndexIfNeeded();
        continue;
      }

      if (duplicateField !== 'bulkOrderId' || attempt === maxAttempts) {
        throw err;
      }
    }
  }

  throw new Error('Failed to create bulk order after retries');
};

const normalizePreferredDate = (value) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
};

const isDateAtLeastNDaysAhead = (date, minDaysAhead = BULK_MIN_DAYS_AHEAD) => {
  const selected = new Date(date);
  const min = new Date();

  selected.setHours(0, 0, 0, 0);
  min.setHours(0, 0, 0, 0);
  min.setDate(min.getDate() + minDaysAhead);

  return selected.getTime() >= min.getTime();
};

const applyBulkStatusTransition = ({ order, nextStatus }) => {
  const normalizedNextStatus = normalizeBulkStatus(nextStatus);
  const normalizedCurrentStatus = normalizeBulkStatus(order.approvalStatus || order.status);

  if (normalizedCurrentStatus === normalizedNextStatus) {
    return { currentStatus: normalizedCurrentStatus, nextStatus: normalizedNextStatus };
  }

  const allowed = BULK_STATUS_TRANSITIONS[normalizedCurrentStatus] || [];
  if (!allowed.includes(normalizedNextStatus)) {
    const error = new Error(
      `Invalid bulk order transition from ${formatBulkStatusLabel(normalizedCurrentStatus)} to ${formatBulkStatusLabel(normalizedNextStatus)}`
    );
    error.statusCode = 400;
    error.allowedNextStatuses = allowed;
    throw error;
  }

  order.approvalStatus = normalizedNextStatus;
  order.trackingEnabled = canTrackBulkOrder(normalizedNextStatus, false) && normalizedNextStatus !== BULK_STATUS.REJECTED;

  if (normalizedNextStatus === BULK_STATUS.AWAITING_USER_PAYMENT) {
    order.approvedAt = new Date();
  }
  if (normalizedNextStatus === BULK_STATUS.REJECTED) {
    order.rejectedAt = new Date();
  }
  if (normalizedNextStatus === BULK_STATUS.DELIVERED) {
    order.completedAt = new Date();
    if (order.paymentMethod === 'cash_on_delivery' && order.paymentStatus === 'pending') {
      order.paymentStatus = 'paid';
    }
  }

  return { currentStatus: normalizedCurrentStatus, nextStatus: normalizedNextStatus };
};

const approveBulkOrder = async (req, res, next) => {
  try {
    const order = await findBulkOrderById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Bulk order not found' });
    const currentStatus = normalizeBulkStatus(order.approvalStatus);
    if (currentStatus === BULK_STATUS.REJECTED) {
      return res.status(400).json({ error: 'Rejected bulk orders cannot be approved' });
    }
    if (currentStatus !== BULK_STATUS.AWAITING_ADMIN_ACCEPTANCE) {
      return res.status(400).json({ error: 'Bulk order is already processed by admin' });
    }

    applyBulkStatusTransition({ order, nextStatus: BULK_STATUS.AWAITING_USER_PAYMENT });
    await order.save();

    const message = 'Your bulk order has been accepted by admin. Please proceed with payment.';

    await createInAppNotification({
      userId: order.userId,
      customerEmail: order.customerEmail,
      orderId: order.bulkOrderId,
      bulkOrderId: order.bulkOrderId,
      title: 'Bulk Order Approved',
      message,
      type: 'bulk_order_approved',
      relatedType: 'bulk_order',
      relatedId: order.bulkOrderId,
      redirectPath: `/bulk-orders/${order.bulkOrderId}/tracking`,
      metadata: { approvalStatus: BULK_STATUS.AWAITING_USER_PAYMENT },
    });

    await notifyBulkOrderUpdate({
      customer: {
        email: order.customerEmail,
        phone: order.customerPhone,
      },
      orderId: order.bulkOrderId,
      status: BULK_STATUS.AWAITING_USER_PAYMENT,
      message,
    });

    res.json({
      message: 'Bulk order accepted by admin',
      order: formatBulkOrder(order),
      progress: getBulkTrackingProgress(order),
    });
  } catch (err) {
    next(err);
  }
};

const rejectBulkOrder = async (req, res, next) => {
  try {
    const order = await findBulkOrderById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Bulk order not found' });

    const currentStatus = normalizeBulkStatus(order.approvalStatus);
    if (currentStatus === BULK_STATUS.REJECTED) {
      return res.status(400).json({ error: 'Bulk order is already rejected' });
    }

    if (currentStatus === BULK_STATUS.DELIVERED) {
      return res.status(400).json({ error: 'Delivered bulk orders cannot be rejected' });
    }

    applyBulkStatusTransition({ order, nextStatus: BULK_STATUS.REJECTED });
    await order.save();

    const message = `Your bulk order ${order.bulkOrderId} has been rejected. Please contact us for support.`;

    await createInAppNotification({
      userId: order.userId,
      customerEmail: order.customerEmail,
      orderId: order.bulkOrderId,
      bulkOrderId: order.bulkOrderId,
      title: 'Bulk Order Rejected',
      message,
      type: 'bulk_order_rejected',
      relatedType: 'bulk_order',
      relatedId: order.bulkOrderId,
      redirectPath: `/bulk-orders/${order.bulkOrderId}/tracking`,
      metadata: { approvalStatus: BULK_STATUS.REJECTED },
    });

    await notifyBulkOrderUpdate({
      customer: {
        email: order.customerEmail,
        phone: order.customerPhone,
      },
      orderId: order.bulkOrderId,
      status: BULK_STATUS.REJECTED,
      message,
    });

    res.json({
      message: 'Bulk order rejected',
      order: formatBulkOrder(order),
      progress: getBulkTrackingProgress(order),
    });
  } catch (err) {
    next(err);
  }
};

const completeBulkOrder = async (req, res, next) => {
  try {
    const order = await findBulkOrderById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Bulk order not found' });
    const currentStatus = normalizeBulkStatus(order.approvalStatus);
    if (currentStatus === BULK_STATUS.DELIVERED) {
      return res.status(400).json({ error: 'Bulk order is already delivered' });
    }
    if (currentStatus !== BULK_STATUS.OUT_FOR_DELIVERY && currentStatus !== BULK_STATUS.READY && currentStatus !== BULK_STATUS.IN_PROGRESS) {
      return res.status(400).json({ error: 'Only in-progress, ready, or out-for-delivery bulk orders can be completed' });
    }

    applyBulkStatusTransition({ order, nextStatus: BULK_STATUS.DELIVERED });
    await order.save();

    await createInAppNotification({
      userId: order.userId,
      customerEmail: order.customerEmail,
      orderId: order.bulkOrderId,
      bulkOrderId: order.bulkOrderId,
      title: 'Bulk Order Delivered',
      message: `Your bulk order ${order.bulkOrderId} has been delivered.`,
      type: 'system',
      relatedType: 'bulk_order',
      relatedId: order.bulkOrderId,
      redirectPath: `/bulk-orders/${order.bulkOrderId}/tracking`,
      metadata: { approvalStatus: BULK_STATUS.DELIVERED },
    });

    res.json({
      message: 'Bulk order delivered',
      order: formatBulkOrder(order),
      progress: getBulkTrackingProgress(order),
    });
  } catch (err) {
    next(err);
  }
};

router.get('/', verifyUser, async (req, res, next) => {
  try {
    const filter = {};

    if (!isAdminRole(req.user.role)) {
      filter.userId = req.user.id;
    }

    if (req.query.status) {
      const queryValues = getBulkStatusQueryValues(req.query.status);
      filter.approvalStatus = queryValues.length > 1
        ? { $in: queryValues }
        : queryValues[0];
    }

    if (req.query.email && isAdminRole(req.user.role)) {
      filter.customerEmail = req.query.email.toLowerCase();
    }

    const page = Math.max(parseInt(req.query.page, 10) || PAGINATION.DEFAULT_PAGE, 1);
    const limit = Math.min(parseInt(req.query.limit, 10) || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      BulkOrder.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      BulkOrder.countDocuments(filter),
    ]);

    res.json({
      orders: orders.map(formatBulkOrder),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
});

router.post('/', verifyUser, createBulkOrderRules, validate, async (req, res, next) => {
  try {
    const payloadItems = Array.isArray(req.body.items) ? req.body.items : [];
    const items = payloadItems.map((item) => ({
      productId: item.productId || item._id || null,
      productName: item.productName || item.name || 'Cake Item',
      quantity: Math.max(Number(item.quantity) || 1, 1),
      price: Math.max(Number(item.price) || 0, 0),
      image: item.image || '',
      specialNotes: item.specialNotes || '',
    }));

    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
    const hasBulkQuantity = totalQuantity >= BULK_MIN_QUANTITY || items.some((item) => item.quantity >= BULK_MIN_QUANTITY);
    if (!hasBulkQuantity) {
      return res.status(400).json({
        error: `Bulk orders require quantity ${BULK_MIN_QUANTITY} or more`,
      });
    }

    const requestedDate = normalizePreferredDate(req.body.preferredDate);
    if (!requestedDate) {
      return res.status(400).json({ error: 'preferredDate must be a valid date' });
    }

    if (!isDateAtLeastNDaysAhead(requestedDate, BULK_MIN_DAYS_AHEAD)) {
      return res.status(400).json({ error: `Delivery date must be at least ${BULK_MIN_DAYS_AHEAD} days ahead` });
    }

    const alternateDate = req.body.alternateDate ? normalizePreferredDate(req.body.alternateDate) : null;
    if (req.body.alternateDate && !alternateDate) {
      return res.status(400).json({ error: 'alternateDate must be a valid date' });
    }

    const computedSubtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const subtotal = Number.isFinite(Number(req.body.subtotal)) ? Number(req.body.subtotal) : computedSubtotal;
    const tax = Number.isFinite(Number(req.body.tax)) ? Math.max(Number(req.body.tax), 0) : 0;
    const shipping = Number.isFinite(Number(req.body.shipping)) ? Math.max(Number(req.body.shipping), 0) : 0;
    const totalAmount = Number.isFinite(Number(req.body.total || req.body.totalAmount))
      ? Number(req.body.total || req.body.totalAmount)
      : Number((subtotal + tax + shipping).toFixed(2));

    const order = await createBulkOrderWithRetry({
      userId: req.user.id,
      items,
      totalQuantity,
      subtotal,
      tax,
      shipping,
      totalAmount,
      customerName: req.body.customer?.name || 'Customer',
      customerEmail: (req.body.customer?.email || req.user.email || '').toLowerCase(),
      customerPhone: req.body.customer?.phone || '',
      requestedDeliveryDate: requestedDate,
      alternateDeliveryDate: alternateDate,
      deliverySlot: req.body.preferredTime || '',
      deliveryAddress: req.body.address || '',
      approvalStatus: BULK_STATUS.AWAITING_ADMIN_ACCEPTANCE,
      paymentMethod: '',
      paymentStatus: 'pending',
      trackingEnabled: false,
      additionalNotes: req.body.additionalNotes || '',
    });

    res.status(201).json({
      message: 'Bulk Order Request Sent. Waiting for Admin Acceptance.',
      order: formatBulkOrder(order),
      progress: getBulkTrackingProgress(order),
    });
  } catch (err) {
    next(err);
  }
});

router.get('/:id/tracking', verifyUser, async (req, res, next) => {
  try {
    const filter = parseBulkOrderIdFilter(req.params.id);

    if (!isAdminRole(req.user.role)) {
      filter.userId = req.user.id;
    }

    const order = await BulkOrder.findOne(filter);
    if (!order) return res.status(404).json({ error: 'Bulk order not found' });

    res.json({
      order: formatBulkOrder(order),
      progress: getBulkTrackingProgress(order),
      canTrack: canTrackBulkOrder(order.approvalStatus, order.trackingEnabled),
      payment: {
        method: order.paymentMethod || '',
        status: order.paymentStatus,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/payment-method', verifyUser, async (req, res, next) => {
  try {
    const filter = parseBulkOrderIdFilter(req.params.id);

    if (!isAdminRole(req.user.role)) {
      filter.userId = req.user.id;
    }

    const order = await BulkOrder.findOne(filter);
    if (!order) return res.status(404).json({ error: 'Bulk order not found' });

    const currentStatus = normalizeBulkStatus(order.approvalStatus);
    if (LOCKED_CUSTOMER_BULK_STATUSES.has(currentStatus)) {
      return res.status(409).json({ error: ORDER_LOCK_MESSAGE });
    }

    if (currentStatus !== BULK_STATUS.AWAITING_USER_PAYMENT) {
      return res.status(400).json({ error: 'Payment can be selected only after admin acceptance' });
    }

    const paymentMethod = String(req.body.paymentMethod || '').trim();
    if (!['online', 'cash_on_delivery'].includes(paymentMethod)) {
      return res.status(400).json({ error: 'paymentMethod must be online or cash_on_delivery' });
    }

    order.paymentMethod = paymentMethod;
    order.paymentStatus = paymentMethod === 'online' ? 'paid' : 'pending';
    // Once payment method is selected after admin acceptance, move into delivery processing.
    if (currentStatus === BULK_STATUS.AWAITING_USER_PAYMENT) {
      order.approvalStatus = BULK_STATUS.IN_PROGRESS;
    }

    await order.save();

    res.json({
      message: 'Payment method saved',
      order: formatBulkOrder(order),
      progress: getBulkTrackingProgress(order),
    });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/status', verifyAdmin, async (req, res, next) => {
  try {
    const order = await findBulkOrderById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Bulk order not found' });

    const nextStatus = normalizeBulkStatus(req.body?.status);
    if (!nextStatus) {
      return res.status(400).json({ error: 'status is required' });
    }

    const currentStatus = normalizeBulkStatus(order.approvalStatus);
    if ([BULK_STATUS.DELIVERED, BULK_STATUS.REJECTED].includes(currentStatus)) {
      return res.status(400).json({ error: 'This bulk order status is locked and cannot be updated' });
    }

    if (nextStatus === BULK_STATUS.IN_PROGRESS && !order.paymentMethod) {
      return res.status(400).json({ error: 'Select payment method before moving to In Progress' });
    }

    const allowed = BULK_STATUS_TRANSITIONS[currentStatus] || [];
    if (nextStatus !== currentStatus && !allowed.includes(nextStatus)) {
      return res.status(400).json({
        error: `Invalid status transition from ${formatBulkStatusLabel(currentStatus)} to ${formatBulkStatusLabel(nextStatus)}`,
        allowedNextStatuses: allowed,
      });
    }

    if (nextStatus !== currentStatus) {
      applyBulkStatusTransition({ order, nextStatus });
      await order.save();

      await createInAppNotification({
        userId: order.userId,
        customerEmail: order.customerEmail,
        orderId: order.bulkOrderId,
        bulkOrderId: order.bulkOrderId,
        title: `Bulk Order ${formatBulkStatusLabel(nextStatus)}`,
        message: `Your bulk order ${order.bulkOrderId} is now ${formatBulkStatusLabel(nextStatus)}.`,
        type: 'system',
        relatedType: 'bulk_order',
        relatedId: order.bulkOrderId,
        redirectPath: `/bulk-orders/${order.bulkOrderId}/tracking`,
        metadata: { approvalStatus: nextStatus, previousStatus: currentStatus },
      });
    }

    res.json({
      message: 'Bulk order status updated',
      order: formatBulkOrder(order),
      progress: getBulkTrackingProgress(order),
      previousStatus: currentStatus,
      nextStatus,
    });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/approve', verifyAdmin, approveBulkOrder);
router.patch('/:id/reject', verifyAdmin, rejectBulkOrder);
router.patch('/:id/complete', verifyAdmin, completeBulkOrder);

// Backward compatibility for older frontend calls
router.patch('/:id/confirm', verifyAdmin, approveBulkOrder);
router.patch('/:id/cancel', verifyAdmin, rejectBulkOrder);

export default router;
