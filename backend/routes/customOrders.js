import express from 'express';
import mongoose from 'mongoose';
import CustomOrder from '../models/CustomOrder.js';
import Order from '../models/Order.js';
import User from '../models/User.js';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import { verifyUser, verifyAdmin } from '../middleware/auth.js';
import { createInAppNotification, createInAppNotifications } from '../services/inAppNotificationService.js';
import {
  CUSTOM_ORDER_STATUS_TRANSITIONS,
  canTransitionStatus,
  formatFlowStatusLabel,
  normalizeCustomOrderStatus,
} from '../utils/orderStatusFlow.js';

const router = express.Router();

const QUOTE_READY_STATUSES = new Set(['awaiting_admin_quote', 'quoted', 'awaiting_user_acceptance']);
const ACCEPTABLE_STATUSES = new Set(['awaiting_user_acceptance', 'quoted']);
const ORDER_CREATABLE_STATUSES = new Set(['awaiting_user_payment', 'price_accepted']);
const ORDER_LOCK_MESSAGE = 'Your order is already in progress and can no longer be modified or cancelled.';
const LOCKED_CUSTOMER_CUSTOM_STATUSES = new Set(['in_progress', 'ready', 'out_for_delivery', 'delivered']);
const ADMIN_REVIEWABLE_STATUSES = new Set([
  'awaiting_user_confirmation',
  'awaiting_admin_quote',
  'quoted',
  'awaiting_user_acceptance',
]);

const isAdminRole = (role) => role === 'admin' || role === 'superadmin';
const isCustomOrderLockedForCustomer = (status) => LOCKED_CUSTOMER_CUSTOM_STATUSES.has(normalizeCustomOrderStatus(status));

const normalizePaymentMethod = (value) => {
  const raw = String(value || '').trim().toLowerCase();
  if (raw === 'card') return 'online';
  if (raw === 'cod') return 'cash_on_delivery';
  if (raw === 'online' || raw === 'cash_on_delivery') return raw;
  return '';
};

const buildCustomOrderFilter = (id) => {
  const normalized = String(id || '').trim();
  const filters = [{ requestId: normalized }];

  if (mongoose.Types.ObjectId.isValid(normalized)) {
    filters.push({ _id: new mongoose.Types.ObjectId(normalized) });
  }

  return filters.length === 1 ? filters[0] : { $or: filters };
};

const buildOwnershipFilter = (userId) => {
  const normalized = String(userId || '').trim();
  const candidates = [{ userId: normalized }];

  if (mongoose.Types.ObjectId.isValid(normalized)) {
    candidates.push({ userId: new mongoose.Types.ObjectId(normalized) });
  }

  return candidates.length === 1 ? candidates[0] : { $or: candidates };
};

const findCustomOrderForRequester = async ({ requestId, requester }) => {
  const baseFilter = buildCustomOrderFilter(requestId);
  if (isAdminRole(requester.role)) {
    return CustomOrder.findOne(baseFilter);
  }

  return CustomOrder.findOne({
    $and: [baseFilter, buildOwnershipFilter(requester.id)],
  });
};

const resolveUserRecipient = async (rawUserId) => {
  const userIdString = String(rawUserId || '').trim();
  if (!mongoose.Types.ObjectId.isValid(userIdString)) {
    return { userId: null, email: '' };
  }

  const user = await User.findById(userIdString).select('_id email');
  if (!user) return { userId: null, email: '' };

  return {
    userId: user._id,
    email: user.email || '',
  };
};

const pickUserConfirmedDetails = (customOrder) => {
  const confirmed = customOrder?.userConfirmation?.confirmedData || {};
  const inputs = customOrder?.customerInputs || {};

  const deliveryDateRaw = confirmed.deliveryDate || inputs.deliveryDate || null;
  const deliveryDate = deliveryDateRaw ? new Date(deliveryDateRaw) : null;

  return {
    flavor: confirmed.flavor || inputs.flavor || '',
    weightKg: Number(confirmed.weightKg || inputs.weightKg || 0) || null,
    messageOnCake: confirmed.messageOnCake || inputs.messageOnCake || '',
    deliveryDate: deliveryDate && !Number.isNaN(deliveryDate.getTime()) ? deliveryDate : null,
    deliverySlot: inputs.deliverySlot || '',
    specialInstructions: confirmed.specialInstructions || inputs.specialInstructions || inputs.notes || '',
  };
};

const mapPricingHistory = (history = []) => {
  if (!Array.isArray(history)) return [];
  return history
    .map((entry) => ({
      quotedPrice: entry?.quotedPrice ?? null,
      preparationDays: entry?.preparationDays ?? null,
      quoteNotes: entry?.quoteNotes || '',
      adminNotes: entry?.adminNotes || '',
      source: entry?.source || '',
      statusAfterUpdate: entry?.statusAfterUpdate || '',
      updatedBy: entry?.updatedBy || null,
      updatedAt: entry?.updatedAt || null,
    }))
    .sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
};

const appendPricingHistory = (customOrder, payload = {}) => {
  const quotedPrice = payload.quotedPrice ?? customOrder?.adminQuote?.quotedPrice ?? null;
  const preparationDays = payload.preparationDays ?? customOrder?.adminQuote?.preparationDays ?? null;
  const quoteNotes = payload.quoteNotes ?? customOrder?.adminQuote?.quoteNotes ?? '';
  const adminNotes = payload.adminNotes ?? customOrder?.adminReview?.notes ?? '';
  const source = payload.source || 'admin_quote_update';
  const updatedBy = payload.updatedBy ?? null;
  const statusAfterUpdate = payload.statusAfterUpdate || customOrder?.status || '';

  customOrder.pricingHistory = Array.isArray(customOrder.pricingHistory) ? customOrder.pricingHistory : [];
  customOrder.pricingHistory.push({
    quotedPrice,
    preparationDays,
    quoteNotes,
    adminNotes,
    source,
    statusAfterUpdate,
    updatedBy,
    updatedAt: new Date(),
  });
};

const appendUserDecisionHistory = (customOrder, payload = {}) => {
  customOrder.userDecisionHistory = Array.isArray(customOrder.userDecisionHistory)
    ? customOrder.userDecisionHistory
    : [];

  customOrder.userDecisionHistory.push({
    decision: payload.decision || '',
    paymentMethod: payload.paymentMethod || '',
    reason: payload.reason || '',
    decidedAt: payload.decidedAt || new Date(),
  });
};

const mapCustomOrderForAdmin = (customOrder) => {
  const order = typeof customOrder?.toObject === 'function'
    ? customOrder.toObject({ virtuals: true })
    : customOrder;

  const user = order.user || null;
  const aiDescription = order.aiResult?.description || '';

  return {
    _id: order._id,
    requestId: order.requestId,
    status: normalizeCustomOrderStatus(order.status),
    imageUrl: order.imageUrl || '',
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    customer: {
      id: user?._id || order.userId || null,
      name: user?.name || 'Customer',
      email: user?.email || '',
      phone: user?.phone || '',
    },
    aiResult: {
      description: aiDescription,
      confidence: Number(order.aiResult?.confidence || 0),
      extractedAttributes: order.aiResult?.extractedAttributes || {},
      status: order.aiResult?.status || '',
      errorMessage: order.aiResult?.errorMessage || '',
    },
    userConfirmation: {
      confirmed: Boolean(order.userConfirmation?.confirmed),
      editedDescription: order.userConfirmation?.editedDescription || '',
      confirmedAt: order.userConfirmation?.confirmedAt || null,
      details: pickUserConfirmedDetails(order),
    },
    adminQuote: {
      quotedPrice: order.adminQuote?.quotedPrice ?? null,
      quoteNotes: order.adminQuote?.quoteNotes || '',
      preparationDays: order.adminQuote?.preparationDays ?? null,
      quotedAt: order.adminQuote?.quotedAt || null,
    },
    pricingHistory: mapPricingHistory(order.pricingHistory),
    adminReview: {
      editedDescription: order.adminReview?.editedDescription || '',
      notes: order.adminReview?.notes || '',
      decision: order.adminReview?.decision || '',
      rejectionReason: order.adminReview?.rejectionReason || '',
      reviewedAt: order.adminReview?.reviewedAt || null,
    },
    paymentMethod: order.paymentMethod || '',
    paymentStatus: order.paymentStatus || 'pending',
    payment: {
      provider: order.payment?.provider || '',
      transactionId: order.payment?.transactionId || '',
      reference: order.payment?.reference || '',
      status: order.payment?.status || '',
      paidAt: order.payment?.paidAt || null,
    },
    generatedOrderId: order.generatedOrderId || '',
  };
};

const mapCustomOrderForCustomer = (customOrder) => {
  const order = typeof customOrder?.toObject === 'function'
    ? customOrder.toObject({ virtuals: true })
    : customOrder;

  return {
    _id: order._id,
    requestId: order.requestId,
    status: normalizeCustomOrderStatus(order.status),
    imageUrl: order.imageUrl || '',
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    aiResult: {
      description: order.aiResult?.description || '',
      confidence: Number(order.aiResult?.confidence || 0),
      status: order.aiResult?.status || '',
      errorMessage: order.aiResult?.errorMessage || '',
    },
    userConfirmation: {
      confirmed: Boolean(order.userConfirmation?.confirmed),
      editedDescription: order.userConfirmation?.editedDescription || '',
      confirmedAt: order.userConfirmation?.confirmedAt || null,
      details: pickUserConfirmedDetails(order),
    },
    adminQuote: {
      quotedPrice: order.adminQuote?.quotedPrice ?? null,
      quoteNotes: order.adminQuote?.quoteNotes || '',
      preparationDays: order.adminQuote?.preparationDays ?? null,
      quotedAt: order.adminQuote?.quotedAt || null,
    },
    adminReview: {
      decision: order.adminReview?.decision || '',
      notes: order.adminReview?.notes || '',
      rejectionReason: order.adminReview?.rejectionReason || '',
      reviewedAt: order.adminReview?.reviewedAt || null,
    },
    userDecision: {
      decision: order.userDecision?.decision || '',
      paymentMethod: order.userDecision?.paymentMethod || '',
      reason: order.userDecision?.reason || '',
      decidedAt: order.userDecision?.decidedAt || null,
    },
    userDecisionHistory: Array.isArray(order.userDecisionHistory) ? order.userDecisionHistory : [],
    pricingHistory: mapPricingHistory(order.pricingHistory),
    paymentMethod: order.paymentMethod || '',
    paymentStatus: order.paymentStatus || 'pending',
    payment: {
      provider: order.payment?.provider || '',
      transactionId: order.payment?.transactionId || '',
      reference: order.payment?.reference || '',
      status: order.payment?.status || '',
      paidAt: order.payment?.paidAt || null,
    },
    generatedOrderId: order.generatedOrderId || '',
    convertedToOrderAt: order.convertedToOrderAt || null,
  };
};

const ensureCustomCategory = async () => {
  const existing = await Category.findOne({ name: /^custom$/i }).select('_id name');
  if (existing) return existing;

  try {
    return await Category.create({
      name: 'Custom',
      description: 'Custom designed cakes',
      isActive: true,
    });
  } catch (err) {
    if (err?.code === 11000) {
      return Category.findOne({ name: /^custom$/i }).select('_id name');
    }
    throw err;
  }
};

const ensureCustomProduct = async () => {
  const existing = await Product.findOne({
    productName: /^custom cake$/i,
    isActive: true,
  }).select('_id productName image');

  if (existing) return existing;

  const customCategory = await ensureCustomCategory();
  if (!customCategory) {
    throw new Error('Unable to create custom category');
  }

  try {
    return await Product.create({
      productName: 'Custom Cake',
      categoryId: customCategory._id,
      price: 0,
      description: 'Custom cake order product generated by chatbot flow',
      image: '',
      stockQuantity: 9999,
      lowStockThreshold: 0,
      isActive: true,
      tags: ['custom'],
    });
  } catch (err) {
    if (err?.code === 11000) {
      return Product.findOne({ productName: /^custom cake$/i, isActive: true }).select('_id productName image');
    }
    throw err;
  }
};

const resolveAddressForOrder = (userDoc, customOrderDoc) => {
  const deliveryAddressId = String(customOrderDoc?.customerInputs?.deliveryAddressId || '').trim();

  if (deliveryAddressId && userDoc?.addresses?.id(deliveryAddressId)) {
    const found = userDoc.addresses.id(deliveryAddressId);
    return {
      label: found.label || 'Home',
      street: found.street || '',
      city: found.city || '',
      state: found.state || '',
      zipCode: found.zipCode || '',
      country: found.country || 'Sri Lanka',
    };
  }

  const fallback = userDoc?.addresses?.find((address) => address.isDefault) || userDoc?.addresses?.[0];
  if (!fallback) return null;

  return {
    label: fallback.label || 'Home',
    street: fallback.street || '',
    city: fallback.city || '',
    state: fallback.state || '',
    zipCode: fallback.zipCode || '',
    country: fallback.country || 'Sri Lanka',
  };
};

const notifyAdmins = async ({ title, message, type, relatedId, metadata = {}, redirectPath = '/admin/orders' }) => {
  const admins = await User.find({ role: { $in: ['admin', 'superadmin'] } }).select('_id email');
  if (!admins.length) return;

  await createInAppNotifications(admins.map((admin) => ({
    userId: admin._id,
    customerEmail: admin.email,
    title,
    message,
    type,
    relatedType: 'custom_order',
    relatedId,
    redirectPath,
    metadata,
  })));
};

const customStatusNotificationMessage = {
  awaiting_admin_quote: 'Your custom order is awaiting admin quote.',
  awaiting_user_confirmation: 'Please confirm your custom order details.',
  awaiting_user_acceptance: 'Your custom quote is ready. Please accept or reject it.',
  awaiting_user_payment: 'Please proceed with payment for your custom order.',
  in_progress: 'Your custom order is now in progress.',
  ready: 'Your custom order is ready.',
  out_for_delivery: 'Your custom order is out for delivery.',
  delivered: 'Your custom order has been delivered.',
  rejected: 'Your custom order was rejected.',
};

const buildPaymentSnapshot = ({ paymentMethod, paymentPayload = {} }) => {
  const now = new Date();
  const method = normalizePaymentMethod(paymentMethod);
  const provider = method === 'online'
    ? String(paymentPayload.provider || 'online_stub').trim()
    : 'cash_on_delivery';
  const transactionId = method === 'online'
    ? String(paymentPayload.transactionId || `TXN-${Date.now()}`).trim()
    : '';
  const reference = String(
    paymentPayload.reference
    || (method === 'online' ? `PAY-${Date.now()}` : `COD-${Date.now()}`)
  ).trim();

  return {
    method,
    paymentStatus: 'paid',
    payment: {
      provider,
      transactionId,
      reference,
      status: 'paid',
      paidAt: now,
      metadata: paymentPayload?.metadata && typeof paymentPayload.metadata === 'object'
        ? paymentPayload.metadata
        : {},
    },
  };
};

const resolveCustomOrderCustomerContext = async (customOrder) => {
  const userIdString = String(customOrder.userId || '').trim();
  if (!mongoose.Types.ObjectId.isValid(userIdString)) {
    return { user: null, address: null, error: 'Invalid custom order owner id', status: 400 };
  }

  const user = await User.findById(userIdString);
  if (!user) {
    return { user: null, address: null, error: 'Order customer not found', status: 404 };
  }

  const address = resolveAddressForOrder(user, customOrder);
  if (!address || !String(address.street || '').trim() || !String(address.city || '').trim()) {
    return { user, address: null, error: 'Delivery address is required before creating order', status: 400 };
  }

  return { user, address, error: '', status: 200 };
};

const createOrUpdateOrderFromCustom = async ({ customOrder, user, address, paymentMethod, paymentStatus }) => {
  const resolvedPaymentMethod = normalizePaymentMethod(paymentMethod || customOrder.paymentMethod);
  if (!resolvedPaymentMethod) {
    throw new Error('paymentMethod must be online or cash_on_delivery');
  }

  if (customOrder.generatedOrderId) {
    const existingOrder = await Order.findOne({
      orderId: customOrder.generatedOrderId,
      userId: user._id,
    });
    if (existingOrder) {
      existingOrder.paymentMethod = resolvedPaymentMethod;
      existingOrder.paymentStatus = paymentStatus;
      existingOrder.orderStatus = 'in_progress';
      existingOrder.unread = true;
      existingOrder.notes = customOrder.userConfirmation?.editedDescription || customOrder.customerInputs?.notes || '';
      await existingOrder.save();
      return existingOrder;
    }
  }

  const customProduct = await ensureCustomProduct();
  const itemName = `Custom Cake (${customOrder.requestId})`;
  const quotedPrice = Number(customOrder.adminQuote?.quotedPrice || 0);

  return Order.create({
    userId: user._id,
    source: 'custom',
    customOrderRequestId: customOrder.requestId,
    customer: {
      name: user.name || 'Customer',
      email: user.email || '',
      phone: user.phone || '',
    },
    items: [{
      productId: customProduct._id,
      name: itemName,
      productName: itemName,
      price: quotedPrice,
      quantity: 1,
      image: customOrder.imageUrl || customProduct.image || '',
    }],
    subtotal: quotedPrice,
    tax: 0,
    shipping: 0,
    discount: 0,
    totalAmount: quotedPrice,
    address,
    deliveryType: 'delivery',
    paymentMethod: resolvedPaymentMethod,
    paymentStatus,
    orderStatus: 'in_progress',
    deliveryDate: customOrder.customerInputs?.deliveryDate || null,
    deliverySlot: customOrder.customerInputs?.deliverySlot || '',
    notes: customOrder.userConfirmation?.editedDescription || customOrder.customerInputs?.notes || '',
    unread: true,
  });
};

const syncLinkedOrderStatusFromCustom = async ({ customOrder, nextStatus }) => {
  if (!customOrder?.generatedOrderId) return null;

  const normalized = normalizeCustomOrderStatus(nextStatus);
  const mappedStatus = ({
    in_progress: 'in_progress',
    ready: 'ready',
    out_for_delivery: 'out_for_delivery',
    delivered: 'delivered',
  })[normalized];

  if (!mappedStatus) return null;

  const linkedOrder = await Order.findOne({ orderId: customOrder.generatedOrderId });
  if (!linkedOrder) return null;

  linkedOrder.orderStatus = mappedStatus;
  if (mappedStatus === 'delivered' && linkedOrder.paymentMethod === 'cash_on_delivery') {
    linkedOrder.paymentStatus = 'paid';
  }
  await linkedOrder.save();
  return linkedOrder;
};

const completeCustomOrderPayment = async ({ customOrder, paymentMethodRaw, paymentPayload = {} }) => {
  const currentStatus = normalizeCustomOrderStatus(customOrder.status);

  if (isCustomOrderLockedForCustomer(currentStatus)) {
    const error = new Error(ORDER_LOCK_MESSAGE);
    error.status = 409;
    throw error;
  }

  if (!ORDER_CREATABLE_STATUSES.has(currentStatus)) {
    const error = new Error(`Cannot process payment while request is in ${currentStatus || 'unknown'} status`);
    error.status = 409;
    throw error;
  }

  const quotedPrice = Number(customOrder.adminQuote?.quotedPrice);
  if (!Number.isFinite(quotedPrice) || quotedPrice <= 0) {
    const error = new Error('Quoted price is missing or invalid');
    error.status = 409;
    throw error;
  }

  const paymentSnapshot = buildPaymentSnapshot({
    paymentMethod: paymentMethodRaw || customOrder.paymentMethod,
    paymentPayload,
  });

  if (!paymentSnapshot.method) {
    const error = new Error('paymentMethod must be online or cash_on_delivery');
    error.status = 400;
    throw error;
  }

  const customerContext = await resolveCustomOrderCustomerContext(customOrder);
  if (!customerContext.user || !customerContext.address) {
    const error = new Error(customerContext.error || 'Unable to resolve customer context');
    error.status = customerContext.status || 400;
    throw error;
  }

  const order = await createOrUpdateOrderFromCustom({
    customOrder,
    user: customerContext.user,
    address: customerContext.address,
    paymentMethod: paymentSnapshot.method,
    paymentStatus: paymentSnapshot.paymentStatus,
  });

  customOrder.status = 'in_progress';
  customOrder.userDecision = {
    ...(customOrder.userDecision || {}),
    decision: 'accept',
    paymentMethod: paymentSnapshot.method,
    reason: '',
    decidedAt: customOrder.userDecision?.decidedAt || new Date(),
  };
  if (!Array.isArray(customOrder.userDecisionHistory) || customOrder.userDecisionHistory.length === 0) {
    appendUserDecisionHistory(customOrder, {
      decision: 'accept',
      paymentMethod: paymentSnapshot.method,
      reason: '',
      decidedAt: customOrder.userDecision.decidedAt,
    });
  }
  customOrder.paymentMethod = paymentSnapshot.method;
  customOrder.paymentStatus = paymentSnapshot.paymentStatus;
  customOrder.payment = paymentSnapshot.payment;
  customOrder.generatedOrderId = order.orderId;
  customOrder.convertedToOrderAt = customOrder.convertedToOrderAt || new Date();

  await customOrder.save();

  await createInAppNotification({
    userId: customerContext.user._id,
    customerEmail: customerContext.user.email,
    title: 'Custom Order Paid & In Progress',
    message: `Your custom order ${customOrder.requestId} payment is confirmed and it is now in progress.`,
    type: 'custom_order_in_progress',
    relatedType: 'custom_order',
    relatedId: customOrder.requestId,
    redirectPath: `/orders/${order.orderId}/tracking`,
    metadata: {
      requestId: customOrder.requestId,
      orderId: order.orderId,
      paymentMethod: paymentSnapshot.method,
      paymentStatus: paymentSnapshot.paymentStatus,
    },
  });

  await notifyAdmins({
    title: 'Custom Order Payment Confirmed',
    message: `Payment confirmed for custom request ${customOrder.requestId}. Order ${order.orderId} is now in progress.`,
    type: 'admin_new_order',
    relatedId: customOrder.requestId,
    metadata: {
      requestId: customOrder.requestId,
      orderId: order.orderId,
      paymentMethod: paymentSnapshot.method,
      paymentStatus: paymentSnapshot.paymentStatus,
    },
    redirectPath: '/admin/orders',
  });

  return {
    order,
    customOrder,
    payment: paymentSnapshot,
  };
};

router.get('/', verifyUser, async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(100, Math.max(1, Number(req.query.limit || 20)));
    const status = String(req.query.status || '').trim();

    const query = {
      ...buildOwnershipFilter(req.user?.id),
    };
    if (status) {
      query.status = status;
    }

    const [total, docs] = await Promise.all([
      CustomOrder.countDocuments(query),
      CustomOrder.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
    ]);

    res.json({
      items: docs.map((doc) => mapCustomOrderForCustomer(doc)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (err) {
    next(err);
  }
});

router.get('/admin', verifyAdmin, async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(100, Math.max(1, Number(req.query.limit || 20)));
    const status = String(req.query.status || 'all').trim();
    const search = String(req.query.search || '').trim();

    const query = {};
    if (status && status !== 'all') {
      query.status = status;
    }
    if (search) {
      query.requestId = { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
    }

    const [total, docs] = await Promise.all([
      CustomOrder.countDocuments(query),
      CustomOrder.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
    ]);

    const userIds = [...new Set(docs
      .map((doc) => String(doc.userId || '').trim())
      .filter((id) => mongoose.Types.ObjectId.isValid(id))
    )];
    const users = await User.find({ _id: { $in: userIds } })
      .select('_id name email phone')
      .lean();

    const userById = users.reduce((acc, user) => {
      acc[String(user._id)] = user;
      return acc;
    }, {});

    const items = docs.map((doc) => mapCustomOrderForAdmin({
      ...doc,
      user: userById[String(doc.userId)] || null,
    }));

    res.json({
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (err) {
    next(err);
  }
});

router.get('/admin/:id', verifyAdmin, async (req, res, next) => {
  try {
    const customOrder = await CustomOrder.findOne(buildCustomOrderFilter(req.params.id)).lean();
    if (!customOrder) {
      return res.status(404).json({ error: 'Custom order request not found' });
    }

    let user = null;
    const userIdString = String(customOrder.userId || '').trim();
    if (mongoose.Types.ObjectId.isValid(userIdString)) {
      user = await User.findById(userIdString).select('_id name email phone').lean();
    }

    res.json({ item: mapCustomOrderForAdmin({ ...customOrder, user }) });
  } catch (err) {
    next(err);
  }
});

router.patch('/admin/:id/review', verifyAdmin, async (req, res, next) => {
  try {
    const customOrder = await CustomOrder.findOne(buildCustomOrderFilter(req.params.id));
    if (!customOrder) {
      return res.status(404).json({ error: 'Custom order request not found' });
    }

    if (!ADMIN_REVIEWABLE_STATUSES.has(String(customOrder.status || ''))) {
      return res.status(409).json({
        error: `Cannot review request while it is in ${customOrder.status || 'unknown'} status`,
      });
    }

    const body = req.body || {};
    const hasEditedDescription = Object.prototype.hasOwnProperty.call(body, 'editedDescription');
    const hasNotes = Object.prototype.hasOwnProperty.call(body, 'notes');
    const hasQuoteNotes = Object.prototype.hasOwnProperty.call(body, 'quoteNotes');
    const hasQuotedPrice = Object.prototype.hasOwnProperty.call(body, 'quotedPrice');
    const hasPreparationDays = Object.prototype.hasOwnProperty.call(body, 'preparationDays');
    const editedDescription = String(req.body?.editedDescription || '').trim();
    const notes = String(req.body?.notes || '').trim();
    const quoteNotes = String(req.body?.quoteNotes || '').trim();
    const quotedPriceRaw = req.body?.quotedPrice;
    const preparationDaysRaw = req.body?.preparationDays;

    if (quotedPriceRaw !== undefined && quotedPriceRaw !== null && quotedPriceRaw !== '') {
      const quotedPrice = Number(quotedPriceRaw);
      if (!Number.isFinite(quotedPrice) || quotedPrice <= 0) {
        return res.status(400).json({ error: 'quotedPrice must be a positive number' });
      }
      customOrder.adminQuote = {
        ...(customOrder.adminQuote || {}),
        quotedPrice,
      };
    }

    if (preparationDaysRaw !== undefined && preparationDaysRaw !== null && preparationDaysRaw !== '') {
      const preparationDays = Number(preparationDaysRaw);
      if (!Number.isFinite(preparationDays) || preparationDays <= 0) {
        return res.status(400).json({ error: 'preparationDays must be a positive number' });
      }
      customOrder.adminQuote = {
        ...(customOrder.adminQuote || {}),
        preparationDays: Math.round(preparationDays),
      };
    }

    if (hasQuoteNotes) {
      customOrder.adminQuote = {
        ...(customOrder.adminQuote || {}),
        quoteNotes,
      };
    }

    if (hasEditedDescription) {
      customOrder.aiResult = {
        ...(customOrder.aiResult || {}),
        description: editedDescription,
      };
    }

    customOrder.adminReview = {
      ...(customOrder.adminReview || {}),
      editedDescription: hasEditedDescription ? editedDescription : (customOrder.adminReview?.editedDescription || ''),
      notes: hasNotes ? notes : (customOrder.adminReview?.notes || ''),
      reviewedBy: req.admin?.id || req.admin?._id || null,
      reviewedAt: new Date(),
    };

    if (hasQuotedPrice || hasPreparationDays || hasQuoteNotes) {
      appendPricingHistory(customOrder, {
        source: 'admin_review',
        updatedBy: req.admin?.id || req.admin?._id || null,
        adminNotes: hasNotes ? notes : (customOrder.adminReview?.notes || ''),
      });
    }

    await customOrder.save();

    const userIdString = String(customOrder.userId || '').trim();
    const user = mongoose.Types.ObjectId.isValid(userIdString)
      ? await User.findById(userIdString).select('_id name email phone').lean()
      : null;

    res.json({ item: mapCustomOrderForAdmin({ ...customOrder.toObject(), user }) });
  } catch (err) {
    next(err);
  }
});

router.patch('/admin/:id/approve', verifyAdmin, async (req, res, next) => {
  try {
    const customOrder = await CustomOrder.findOne(buildCustomOrderFilter(req.params.id));
    if (!customOrder) {
      return res.status(404).json({ error: 'Custom order request not found' });
    }

    if (!ADMIN_REVIEWABLE_STATUSES.has(String(customOrder.status || ''))) {
      return res.status(409).json({
        error: `Cannot approve request while it is in ${customOrder.status || 'unknown'} status`,
      });
    }

    const editedDescription = String(req.body?.editedDescription || '').trim();
    const quoteNotes = String(req.body?.quoteNotes || '').trim();
    const notes = String(req.body?.notes || '').trim();
    const message = String(req.body?.message || '').trim();

    let quotedPrice = Number(customOrder.adminQuote?.quotedPrice);
    if (req.body?.quotedPrice !== undefined && req.body?.quotedPrice !== null && req.body?.quotedPrice !== '') {
      quotedPrice = Number(req.body.quotedPrice);
    }
    if (!Number.isFinite(quotedPrice) || quotedPrice <= 0) {
      return res.status(400).json({ error: 'quotedPrice must be a positive number before approval' });
    }

    let preparationDays = customOrder.adminQuote?.preparationDays ?? null;
    if (req.body?.preparationDays !== undefined && req.body?.preparationDays !== null && req.body?.preparationDays !== '') {
      preparationDays = Math.round(Number(req.body.preparationDays));
      if (!Number.isFinite(preparationDays) || preparationDays <= 0) {
        return res.status(400).json({ error: 'preparationDays must be a positive number' });
      }
    }

    if (editedDescription) {
      customOrder.aiResult = {
        ...(customOrder.aiResult || {}),
        description: editedDescription,
      };
    }

    customOrder.adminQuote = {
      ...(customOrder.adminQuote || {}),
      quotedPrice,
      quoteNotes,
      preparationDays,
      quotedBy: req.admin?.id || req.admin?._id || null,
      quotedAt: new Date(),
    };

    customOrder.adminReview = {
      ...(customOrder.adminReview || {}),
      editedDescription: editedDescription || customOrder.adminReview?.editedDescription || '',
      notes,
      decision: 'approved',
      rejectionReason: '',
      reviewedBy: req.admin?.id || req.admin?._id || null,
      reviewedAt: new Date(),
    };

    customOrder.status = 'awaiting_user_acceptance';
    appendPricingHistory(customOrder, {
      source: 'admin_approve',
      updatedBy: req.admin?.id || req.admin?._id || null,
      adminNotes: notes,
      statusAfterUpdate: customOrder.status,
    });
    await customOrder.save();

    const recipient = await resolveUserRecipient(customOrder.userId);
    if (recipient.userId || recipient.email) {
      await createInAppNotifications([
        {
          userId: recipient.userId,
          customerEmail: recipient.email,
          title: 'Custom Order Approved',
          message: `Your custom order ${customOrder.requestId} has been approved by the store.`,
          type: 'custom_order_approved',
          relatedType: 'custom_order',
          relatedId: customOrder.requestId,
          redirectPath: `/profile?tab=custom-orders&customOrderId=${encodeURIComponent(customOrder.requestId)}`,
          metadata: {
            requestId: customOrder.requestId,
            quotedPrice,
          },
        },
        {
          userId: recipient.userId,
          customerEmail: recipient.email,
          title: 'Custom Cake Price Updated',
          message: message || 'Your custom cake price has been updated. Please confirm and proceed with payment.',
          type: 'custom_order_price_updated',
          relatedType: 'custom_order',
          relatedId: customOrder.requestId,
          redirectPath: `/profile?tab=custom-orders&customOrderId=${encodeURIComponent(customOrder.requestId)}`,
          metadata: {
            requestId: customOrder.requestId,
            quotedPrice,
          },
        },
      ]);
    }

    const userIdString = String(customOrder.userId || '').trim();
    const user = mongoose.Types.ObjectId.isValid(userIdString)
      ? await User.findById(userIdString).select('_id name email phone').lean()
      : null;

    res.json({ item: mapCustomOrderForAdmin({ ...customOrder.toObject(), user }) });
  } catch (err) {
    next(err);
  }
});

router.patch('/admin/:id/reject', verifyAdmin, async (req, res, next) => {
  try {
    const customOrder = await CustomOrder.findOne(buildCustomOrderFilter(req.params.id));
    if (!customOrder) {
      return res.status(404).json({ error: 'Custom order request not found' });
    }

    if (String(customOrder.status || '') === 'rejected') {
      return res.status(409).json({ error: 'Custom order request is already rejected' });
    }

    const reason = String(req.body?.reason || req.body?.notes || '').trim();
    if (!reason) {
      return res.status(400).json({ error: 'Rejection reason is required' });
    }

    customOrder.adminReview = {
      ...(customOrder.adminReview || {}),
      decision: 'rejected',
      rejectionReason: reason,
      notes: String(req.body?.notes || '').trim(),
      reviewedBy: req.admin?.id || req.admin?._id || null,
      reviewedAt: new Date(),
    };
    customOrder.status = 'rejected';
    await customOrder.save();

    const recipient = await resolveUserRecipient(customOrder.userId);
    if (recipient.userId || recipient.email) {
      await createInAppNotification({
        userId: recipient.userId,
        customerEmail: recipient.email,
        title: 'Custom Order Rejected',
        message: `Your custom cake request ${customOrder.requestId} was rejected by the store. Reason: ${reason}`,
        type: 'custom_order_rejected',
        relatedType: 'custom_order',
        relatedId: customOrder.requestId,
        redirectPath: `/profile?tab=custom-orders&customOrderId=${encodeURIComponent(customOrder.requestId)}`,
        metadata: {
          requestId: customOrder.requestId,
          reason,
          rejectedBy: 'admin',
        },
      });
    }

    const userIdString = String(customOrder.userId || '').trim();
    const user = mongoose.Types.ObjectId.isValid(userIdString)
      ? await User.findById(userIdString).select('_id name email phone').lean()
      : null;

    res.json({ item: mapCustomOrderForAdmin({ ...customOrder.toObject(), user }) });
  } catch (err) {
    next(err);
  }
});

router.post('/admin/:id/message', verifyAdmin, async (req, res, next) => {
  try {
    const customOrder = await CustomOrder.findOne(buildCustomOrderFilter(req.params.id));
    if (!customOrder) {
      return res.status(404).json({ error: 'Custom order request not found' });
    }

    const title = String(req.body?.title || 'Message from Cake House').trim().slice(0, 120);
    const message = String(req.body?.message || '').trim().slice(0, 500);
    if (!message) {
      return res.status(400).json({ error: 'message is required' });
    }

    const recipient = await resolveUserRecipient(customOrder.userId);
    if (!recipient.userId && !recipient.email) {
      return res.status(404).json({ error: 'Unable to find customer notification target for this request' });
    }

    await createInAppNotification({
      userId: recipient.userId,
      customerEmail: recipient.email,
      title,
      message,
      type: 'system',
      relatedType: 'custom_order',
      relatedId: customOrder.requestId,
      redirectPath: `/profile?tab=custom-orders&customOrderId=${encodeURIComponent(customOrder.requestId)}`,
      metadata: {
        requestId: customOrder.requestId,
        sentBy: 'admin',
      },
    });

    res.json({ success: true, requestId: customOrder.requestId });
  } catch (err) {
    next(err);
  }
});

router.patch('/admin/:id/status', verifyAdmin, async (req, res, next) => {
  try {
    const customOrder = await CustomOrder.findOne(buildCustomOrderFilter(req.params.id));
    if (!customOrder) {
      return res.status(404).json({ error: 'Custom order request not found' });
    }

    const nextStatus = normalizeCustomOrderStatus(req.body?.status);
    if (!nextStatus) {
      return res.status(400).json({ error: 'status is required' });
    }

    const previousStatus = normalizeCustomOrderStatus(customOrder.status);
    const canTransition = canTransitionStatus({
      currentStatus: previousStatus,
      nextStatus,
      transitions: CUSTOM_ORDER_STATUS_TRANSITIONS,
      normalize: normalizeCustomOrderStatus,
    });

    if (!canTransition) {
      return res.status(400).json({
        error: `Invalid status transition from ${formatFlowStatusLabel(previousStatus)} to ${formatFlowStatusLabel(nextStatus)}`,
        allowedNextStatuses: CUSTOM_ORDER_STATUS_TRANSITIONS[previousStatus] || [],
      });
    }

    customOrder.status = nextStatus;
    if (nextStatus === 'delivered' && customOrder.paymentMethod === 'cash_on_delivery') {
      customOrder.paymentStatus = 'paid';
      customOrder.payment = {
        ...(customOrder.payment || {}),
        provider: customOrder.payment?.provider || 'cash_on_delivery',
        status: 'paid',
        paidAt: customOrder.payment?.paidAt || new Date(),
      };
    }

    await syncLinkedOrderStatusFromCustom({ customOrder, nextStatus });
    await customOrder.save();

    const recipient = await resolveUserRecipient(customOrder.userId);
    if (recipient.userId || recipient.email) {
      await createInAppNotification({
        userId: recipient.userId,
        customerEmail: recipient.email,
        title: `Custom Order ${formatFlowStatusLabel(nextStatus)}`,
        message: customStatusNotificationMessage[nextStatus] || 'Your custom order status has been updated.',
        type: 'custom_order_status_update',
        relatedType: 'custom_order',
        relatedId: customOrder.requestId,
        redirectPath: customOrder.generatedOrderId
          ? `/orders/${customOrder.generatedOrderId}/tracking`
          : `/profile?tab=custom-orders&customOrderId=${encodeURIComponent(customOrder.requestId)}`,
        metadata: {
          requestId: customOrder.requestId,
          previousStatus,
          nextStatus,
          generatedOrderId: customOrder.generatedOrderId || '',
        },
      });

      if (nextStatus === 'delivered') {
        await createInAppNotification({
          userId: recipient.userId,
          customerEmail: recipient.email,
          title: 'Please Rate Your Order',
          message: 'Please rate your delivered order.',
          type: 'rating_request',
          relatedType: 'order',
          relatedId: customOrder.generatedOrderId || customOrder.requestId,
          orderId: customOrder.generatedOrderId || '',
          redirectPath: customOrder.generatedOrderId
            ? `/orders/${customOrder.generatedOrderId}/tracking`
            : `/profile?tab=custom-orders&customOrderId=${encodeURIComponent(customOrder.requestId)}`,
          metadata: {
            requestId: customOrder.requestId,
            orderId: customOrder.generatedOrderId || '',
            source: 'custom_order',
          },
        });
      }
    }

    const userIdString = String(customOrder.userId || '').trim();
    const user = mongoose.Types.ObjectId.isValid(userIdString)
      ? await User.findById(userIdString).select('_id name email phone').lean()
      : null;

    res.json({
      item: mapCustomOrderForAdmin({ ...customOrder.toObject(), user }),
      previousStatus,
      nextStatus,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', verifyUser, async (req, res, next) => {
  try {
    const customOrder = await findCustomOrderForRequester({
      requestId: req.params.id,
      requester: req.user,
    });

    if (!customOrder) {
      return res.status(404).json({ error: 'Custom order request not found' });
    }

    res.json({ item: mapCustomOrderForCustomer(customOrder) });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/quote', verifyAdmin, async (req, res, next) => {
  try {
    const quotedPrice = Number(req.body?.quotedPrice);
    const quoteNotes = String(req.body?.quoteNotes || '').trim();
    const preparationDaysRaw = req.body?.preparationDays;
    const editedDescription = String(req.body?.editedDescription || '').trim();

    if (!Number.isFinite(quotedPrice) || quotedPrice <= 0) {
      return res.status(400).json({ error: 'quotedPrice must be a positive number' });
    }

    const customOrder = await CustomOrder.findOne(buildCustomOrderFilter(req.params.id));
    if (!customOrder) {
      return res.status(404).json({ error: 'Custom order request not found' });
    }

    let preparationDays = customOrder?.adminQuote?.preparationDays ?? null;
    if (preparationDaysRaw !== undefined && preparationDaysRaw !== null && preparationDaysRaw !== '') {
      preparationDays = Math.round(Number(preparationDaysRaw));
      if (!Number.isFinite(preparationDays) || preparationDays <= 0) {
        return res.status(400).json({ error: 'preparationDays must be a positive number' });
      }
    }

    if (!QUOTE_READY_STATUSES.has(String(customOrder.status || ''))) {
      return res.status(409).json({
        error: `Cannot set quote while request is in ${customOrder.status || 'unknown'} status`,
      });
    }

    customOrder.adminQuote = {
      ...(customOrder.adminQuote || {}),
      quotedPrice,
      quoteNotes,
      preparationDays,
      quotedBy: req.admin?.id || req.admin?._id || null,
      quotedAt: new Date(),
    };
    if (editedDescription) {
      customOrder.aiResult = {
        ...(customOrder.aiResult || {}),
        description: editedDescription,
      };
      customOrder.adminReview = {
        ...(customOrder.adminReview || {}),
        editedDescription,
        reviewedBy: req.admin?.id || req.admin?._id || null,
        reviewedAt: new Date(),
      };
    }
    customOrder.status = 'awaiting_user_acceptance';
    appendPricingHistory(customOrder, {
      source: 'admin_quote',
      updatedBy: req.admin?.id || req.admin?._id || null,
      statusAfterUpdate: customOrder.status,
    });

    await customOrder.save();

    const recipient = await resolveUserRecipient(customOrder.userId);
    if (recipient.userId || recipient.email) {
      await createInAppNotification({
        userId: recipient.userId,
        customerEmail: recipient.email,
        title: 'Custom Cake Price Updated',
        message: 'Your custom cake price has been updated. Please confirm and proceed with payment.',
        type: 'custom_order_price_updated',
        relatedType: 'custom_order',
        relatedId: customOrder.requestId,
        redirectPath: `/profile?tab=custom-orders&customOrderId=${encodeURIComponent(customOrder.requestId)}`,
        metadata: {
          requestId: customOrder.requestId,
          quotedPrice,
        },
      });
    }

    res.json({
      requestId: customOrder.requestId,
      status: customOrder.status,
      adminQuote: {
        quotedPrice: customOrder.adminQuote?.quotedPrice,
        quoteNotes: customOrder.adminQuote?.quoteNotes || '',
        preparationDays: customOrder.adminQuote?.preparationDays ?? null,
        quotedAt: customOrder.adminQuote?.quotedAt,
      },
      pricingHistory: mapPricingHistory(customOrder.pricingHistory),
    });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/accept', verifyUser, async (req, res, next) => {
  try {
    const decision = String(req.body?.decision || '').trim().toLowerCase();
    if (decision && decision !== 'accept') {
      return res.status(400).json({ error: 'decision must be accept' });
    }

    const paymentMethod = normalizePaymentMethod(req.body?.paymentMethod);

    const customOrder = await findCustomOrderForRequester({
      requestId: req.params.id,
      requester: req.user,
    });

    if (!customOrder) {
      return res.status(404).json({ error: 'Custom order request not found' });
    }

    const currentStatus = normalizeCustomOrderStatus(customOrder.status);
    if (isCustomOrderLockedForCustomer(currentStatus)) {
      return res.status(409).json({ error: ORDER_LOCK_MESSAGE });
    }

    if (!ACCEPTABLE_STATUSES.has(currentStatus)) {
      return res.status(409).json({
        error: `Quote cannot be accepted in ${currentStatus || 'unknown'} status`,
      });
    }

    const quotedAmount = Number(customOrder.adminQuote?.quotedPrice);
    if (!Number.isFinite(quotedAmount) || quotedAmount <= 0) {
      return res.status(409).json({ error: 'Admin quote is missing or invalid' });
    }

    customOrder.userDecision = {
      ...(customOrder.userDecision || {}),
      decision: 'accept',
      paymentMethod: paymentMethod || '',
      reason: '',
      decidedAt: new Date(),
    };
    appendUserDecisionHistory(customOrder, {
      decision: 'accept',
      paymentMethod,
      reason: '',
      decidedAt: customOrder.userDecision.decidedAt,
    });

    customOrder.paymentMethod = paymentMethod || customOrder.paymentMethod || '';
    customOrder.status = 'awaiting_user_payment';
    customOrder.paymentStatus = 'pending';

    await customOrder.save();

    await notifyAdmins({
      title: 'Custom Quote Accepted',
      message: `Customer accepted quote for custom order ${customOrder.requestId}.`,
      type: 'custom_order_price_accepted',
      relatedId: customOrder.requestId,
      metadata: {
        requestId: customOrder.requestId,
        paymentMethod: paymentMethod || '',
        paymentSelectionPending: true,
      },
      redirectPath: '/admin/custom-orders',
    });

    const recipient = await resolveUserRecipient(customOrder.userId);
    if (recipient.userId || recipient.email) {
      await createInAppNotification({
        userId: recipient.userId,
        customerEmail: recipient.email,
        title: 'Payment Required',
        message: `Please complete payment for custom order ${customOrder.requestId} to start preparation.`,
        type: 'payment_required',
        relatedType: 'custom_order',
        relatedId: customOrder.requestId,
        orderId: customOrder.generatedOrderId || '',
        redirectPath: `/profile?tab=custom-orders&customOrderId=${encodeURIComponent(customOrder.requestId)}`,
        metadata: {
          requestId: customOrder.requestId,
          quotedPrice: quotedAmount,
          paymentMethod: paymentMethod || customOrder.paymentMethod || '',
        },
      });
    }

    res.json({
      requestId: customOrder.requestId,
      status: customOrder.status,
      paymentEnabled: true,
      paymentSelectionPending: true,
      availablePaymentMethods: ['online', 'cash_on_delivery'],
      selectedPaymentMethod: paymentMethod || customOrder.paymentMethod || '',
      amount: quotedAmount,
      currency: 'LKR',
      item: mapCustomOrderForCustomer(customOrder),
    });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/reject', verifyUser, async (req, res, next) => {
  try {
    const decision = String(req.body?.decision || '').trim().toLowerCase();
    if (decision && decision !== 'reject') {
      return res.status(400).json({ error: 'decision must be reject' });
    }

    const reason = String(req.body?.reason || '').trim().slice(0, 500);

    const customOrder = await findCustomOrderForRequester({
      requestId: req.params.id,
      requester: req.user,
    });

    if (!customOrder) {
      return res.status(404).json({ error: 'Custom order request not found' });
    }

    const currentStatus = normalizeCustomOrderStatus(customOrder.status);
    if (isCustomOrderLockedForCustomer(currentStatus)) {
      return res.status(409).json({ error: ORDER_LOCK_MESSAGE });
    }

    if (!ACCEPTABLE_STATUSES.has(currentStatus)) {
      return res.status(409).json({
        error: `Quote cannot be rejected in ${currentStatus || 'unknown'} status`,
      });
    }

    customOrder.userDecision = {
      ...(customOrder.userDecision || {}),
      decision: 'reject',
      paymentMethod: '',
      reason,
      decidedAt: new Date(),
    };
    appendUserDecisionHistory(customOrder, {
      decision: 'reject',
      paymentMethod: '',
      reason,
      decidedAt: customOrder.userDecision.decidedAt,
    });
    customOrder.status = 'price_rejected';

    await customOrder.save();

    await notifyAdmins({
      title: 'Custom Quote Rejected',
      message: `Customer rejected quote for custom order ${customOrder.requestId}.`,
      type: 'custom_order_price_rejected',
      relatedId: customOrder.requestId,
      metadata: {
        requestId: customOrder.requestId,
        reason,
      },
      redirectPath: '/admin/custom-orders',
    });

    res.json({
      requestId: customOrder.requestId,
      status: customOrder.status,
      closed: true,
      item: mapCustomOrderForCustomer(customOrder),
    });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/payment/confirm', verifyUser, async (req, res, next) => {
  try {
    const customOrder = await findCustomOrderForRequester({
      requestId: req.params.id,
      requester: req.user,
    });

    if (!customOrder) {
      return res.status(404).json({ error: 'Custom order request not found' });
    }

    const paymentMethod = req.body?.paymentMethod || customOrder.paymentMethod;
    const paymentPayload = req.body?.payment && typeof req.body.payment === 'object'
      ? req.body.payment
      : {};

    const result = await completeCustomOrderPayment({
      customOrder,
      paymentMethodRaw: paymentMethod,
      paymentPayload,
    });

    res.status(201).json({
      message: 'Payment confirmed. Custom order is now paid and in progress.',
      orderId: result.order.orderId,
      orderStatus: result.order.orderStatus,
      source: 'custom',
      paymentMethod: result.payment.method,
      paymentStatus: result.payment.paymentStatus,
      customOrderStatus: result.customOrder.status,
      payment: {
        provider: result.payment.payment.provider || '',
        reference: result.payment.payment.reference || '',
        transactionId: result.payment.payment.transactionId || '',
        paidAt: result.payment.payment.paidAt || null,
      },
    });
  } catch (err) {
    if (err?.status) {
      return res.status(err.status).json({ error: err.message });
    }
    next(err);
  }
});

router.post('/:id/create-order', verifyUser, async (req, res, next) => {
  try {
    const customOrder = await findCustomOrderForRequester({
      requestId: req.params.id,
      requester: req.user,
    });

    if (!customOrder) {
      return res.status(404).json({ error: 'Custom order request not found' });
    }

    const paymentMethod = req.body?.paymentMethod || customOrder.paymentMethod;
    const paymentPayload = req.body?.payment && typeof req.body.payment === 'object'
      ? req.body.payment
      : {};

    const result = await completeCustomOrderPayment({
      customOrder,
      paymentMethodRaw: paymentMethod,
      paymentPayload,
    });

    res.status(201).json({
      message: 'Custom order confirmed successfully.',
      orderId: result.order.orderId,
      status: result.order.orderStatus,
      source: 'custom',
      paymentMethod: result.payment.method,
      paymentStatus: result.payment.paymentStatus,
      customOrderStatus: result.customOrder.status,
    });
  } catch (err) {
    if (err?.status) {
      return res.status(err.status).json({ error: err.message });
    }
    next(err);
  }
});

export default router;
