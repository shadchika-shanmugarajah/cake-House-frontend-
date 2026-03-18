import express from 'express';
import mongoose from 'mongoose';
import Order from '../models/Order.js';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import { verifyUser, verifyAdmin } from '../middleware/auth.js';
import { createChatbotOrderRules, createOrderRules, updateOrderStatusRules } from '../validators/orderValidator.js';
import validate from '../middleware/validate.js';
import { PAGINATION } from '../utils/constants.js';
import { createInAppNotification, createInAppNotifications } from '../services/inAppNotificationService.js';
import {
  NORMAL_ORDER_PROGRESS_STEPS,
  NORMAL_ORDER_STATUS_TRANSITIONS,
  buildProgressState,
  canTransitionStatus,
  formatFlowStatusLabel,
  normalizeNormalOrderStatus,
  normalizeNormalStatusForProgress,
} from '../utils/orderStatusFlow.js';

const router = express.Router();

const isAdminRole = (role) => role === 'admin' || role === 'superadmin';
const BULK_ORDER_THRESHOLD = 12;
const CANCELLABLE_ORDER_STATUSES = ['pending', 'ready', 'packed'];
let hasTriedDroppingLegacyIdIndex = false;

const generateOrderId = () => {
  const timePart = Date.now().toString(36).toUpperCase();
  const randomPart = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `ORD-${timePart}-${randomPart}`;
};

const toAddressObject = (address = {}) => ({
  label: address.label || 'Home',
  street: address.street || '',
  city: address.city || '',
  state: address.state || '',
  zipCode: address.zipCode || '',
  country: address.country || 'Sri Lanka',
});

const formatOrder = (orderDoc) => {
  const order = typeof orderDoc.toObject === 'function'
    ? orderDoc.toObject({ virtuals: true })
    : orderDoc;
  const normalizedStatus = normalizeNormalOrderStatus(order.status || order.orderStatus);

  return {
    ...order,
    id: order.id || order.orderId,
    orderStatus: normalizedStatus,
    status: normalizedStatus,
    total: order.total || order.totalAmount,
    deliveryTime: order.deliveryTime || order.deliverySlot,
    items: (order.items || []).map((item) => ({
      ...item,
      id: item._id || item.id,
      name: item.name || item.productName,
    })),
  };
};

const getOrderProgressState = (status = 'pending') => {
  return buildProgressState({
    status,
    progressSteps: NORMAL_ORDER_PROGRESS_STEPS,
    normalizeForProgress: normalizeNormalStatusForProgress,
    cancelledStatuses: ['cancelled'],
  });
};

const buildOrderLookupFilter = (orderIdentifier = '') => {
  const normalized = String(orderIdentifier || '').trim();
  const filters = [{ orderId: normalized }];

  if (mongoose.Types.ObjectId.isValid(normalized)) {
    filters.push({ _id: new mongoose.Types.ObjectId(normalized) });
  }

  return filters.length === 1 ? filters[0] : { $or: filters };
};

const getOrderByOrderIdForUser = async ({ orderId, requester }) => {
  const filter = buildOrderLookupFilter(orderId);
  if (!isAdminRole(requester.role)) {
    filter.userId = requester.id;
  }
  return Order.findOne(filter);
};

const statusNotificationMessage = {
  pending: 'Your order has been placed and is pending.',
  in_progress: 'Your order is now in progress.',
  ready: 'Your order is ready.',
  packed: 'Your order is ready.',
  out_for_delivery: 'Your order is out for delivery.',
  delivered: 'Your order has been delivered.',
  cancelled: 'Your order has been cancelled.',
};

const formatStatusLabel = (status) => formatFlowStatusLabel(status);

const createUserOrderNotification = async ({
  userId,
  customerEmail,
  orderId,
  status,
  cancelledBy = '',
  event = 'status',
  items = [],
}) => {
  if (!customerEmail) return;

  const isPlaced = event === 'placed';
  const isCancelled = status === 'cancelled';

  const title = isPlaced
    ? 'Order Placed'
    : isCancelled
      ? 'Order Cancelled'
      : `Order ${formatStatusLabel(status)}`;

  const type = isPlaced
    ? 'order_placed'
    : isCancelled
      ? 'order_cancelled_update'
      : 'order_status_update';

  const cancellationMessage = cancelledBy === 'admin'
    ? 'Your order was cancelled by store.'
    : statusNotificationMessage.cancelled;

  await createInAppNotification({
    userId,
    customerEmail,
    orderId,
    title,
    message: isCancelled
      ? cancellationMessage
      : (statusNotificationMessage[status] || 'Your order status has been updated.'),
    type,
    relatedType: 'order',
    relatedId: orderId,
    metadata: { status, cancelledBy },
  });

  if (event === 'status' && status === 'delivered') {
    const uniqueProductIds = Array.from(
      new Set(
        (items || [])
          .map((item) => (item?.productId ? String(item.productId) : ''))
          .filter(Boolean)
      )
    );

    if (uniqueProductIds.length > 0) {
      await createInAppNotifications(
        uniqueProductIds.map((productId) => ({
          userId,
          customerEmail,
          orderId,
          title: 'Please Rate Your Product',
          message: 'Please rate the product you purchased.',
          type: 'rating_request',
          relatedType: 'product',
          relatedId: productId,
          productId,
          metadata: { orderId, productId },
        }))
      );
    }
  }
};

const createAdminOrderNotifications = async ({ orderId, customerName }) => {
  const admins = await User.find({ role: { $in: ['admin', 'superadmin'] } }).select('_id email');
  if (!admins.length) return;

  const payloads = admins.map((admin) => ({
    userId: admin._id,
    customerEmail: admin.email,
    orderId,
    title: 'New Order Received',
    message: `New order ${orderId} was placed by ${customerName || 'a customer'}.`,
    type: 'admin_new_order',
    relatedType: 'order',
    relatedId: orderId,
    redirectPath: '/admin/orders',
  }));

  await createInAppNotifications(payloads);
};

const createAdminCancellationNotifications = async ({ orderId, customerName, reason = '' }) => {
  const admins = await User.find({ role: { $in: ['admin', 'superadmin'] } }).select('_id email');
  if (!admins.length) return;

  const reasonText = reason ? ` Reason: ${reason}` : '';
  const payloads = admins.map((admin) => ({
    userId: admin._id,
    customerEmail: admin.email,
    orderId,
    title: 'Order Cancelled by Customer',
    message: `Order ${orderId} was cancelled by ${customerName || 'a customer'}.${reasonText}`,
    type: 'system',
    relatedType: 'order',
    relatedId: orderId,
    redirectPath: '/admin/orders',
  }));

  await createInAppNotifications(payloads);
};

const dropLegacyIdIndexIfNeeded = async () => {
  if (hasTriedDroppingLegacyIdIndex) return;
  hasTriedDroppingLegacyIdIndex = true;

  const collection = mongoose.connection?.db?.collection('orders');
  if (!collection) return;

  const indexes = await collection.indexes();
  const hasLegacyIndex = indexes.some((index) => index.name === 'id_1');
  if (hasLegacyIndex) {
    await collection.dropIndex('id_1');
    console.log('Dropped legacy orders index id_1 after duplicate key detection');
  }
};

const getDuplicateFieldFromError = (err) => {
  const keys = [
    ...Object.keys(err?.keyPattern || {}),
    ...Object.keys(err?.keyValue || {}),
  ];

  if (keys.length > 0) return keys[0];

  if (/dup key.*\{ id: null \}/i.test(err?.message || '')) return 'id';
  if (/dup key.*\{ orderId:/i.test(err?.message || '')) return 'orderId';

  return '';
};

const createOrderWithRetry = async (payload, maxAttempts = 3) => {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await Order.create({
        ...payload,
        orderId: generateOrderId(),
      });
    } catch (err) {
      if (err?.code !== 11000) {
        throw err;
      }

      const duplicateField = getDuplicateFieldFromError(err);

      if (duplicateField === 'id') {
        await dropLegacyIdIndexIfNeeded();
        continue;
      }

      if (duplicateField !== 'orderId' || attempt === maxAttempts) {
        throw err;
      }
    }
  }

  throw new Error('Failed to create order after retries');
};

const aggregateRequestedQuantities = (items = []) => {
  const quantityMap = new Map();

  for (const item of items) {
    const productId = String(item.productId);
    const requestedQuantity = Number(item.quantity || 0);
    const current = quantityMap.get(productId) || 0;
    quantityMap.set(productId, current + requestedQuantity);
  }

  return Array.from(quantityMap.entries()).map(([productId, quantity]) => ({
    productId,
    quantity,
  }));
};

const rollbackReservedStock = async (reservations = []) => {
  if (!reservations.length) return;

  await Product.bulkWrite(
    reservations.map((reservation) => ({
      updateOne: {
        filter: { _id: reservation.productId },
        update: { $inc: { stockQuantity: reservation.quantity } },
      },
    }))
  );
};

const reserveStockForOrderItems = async (items = []) => {
  const reservations = [];
  const aggregatedItems = aggregateRequestedQuantities(items);

  for (const item of aggregatedItems) {
    const updated = await Product.findOneAndUpdate(
      {
        _id: item.productId,
        stockQuantity: { $gte: item.quantity },
      },
      {
        $inc: { stockQuantity: -item.quantity },
      },
      {
        new: true,
        select: 'productName stockQuantity',
      }
    );

    if (!updated) {
      await rollbackReservedStock(reservations);
      const latest = await Product.findById(item.productId).select('productName stockQuantity');

      return {
        success: false,
        stockIssues: [{
          productId: item.productId,
          name: latest?.productName || 'Product',
          requestedQuantity: item.quantity,
          availableStock: latest?.stockQuantity ?? 0,
          message: latest ? 'Insufficient stock' : 'Product no longer exists',
        }],
      };
    }

    reservations.push({
      productId: item.productId,
      quantity: item.quantity,
    });
  }

  return { success: true, reservations };
};

const restoreStockForOrderItems = async (items = []) => {
  const reservations = aggregateRequestedQuantities(items);
  await rollbackReservedStock(reservations);
};

const parseDeliveryDateOrError = (rawDate) => {
  const parsed = new Date(rawDate);
  if (Number.isNaN(parsed.getTime())) {
    return { error: 'deliveryDate is invalid', value: null };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const normalized = new Date(parsed);
  normalized.setHours(0, 0, 0, 0);
  if (normalized < today) {
    return { error: 'Delivery date cannot be in the past', value: null };
  }
  return { error: '', value: parsed };
};

router.get('/', verifyUser, async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.status) {
      const normalizedStatus = normalizeNormalOrderStatus(req.query.status);
      filter.orderStatus = normalizedStatus === 'ready'
        ? { $in: ['ready', 'packed'] }
        : normalizedStatus;
    }
    if (req.query.email) filter['customer.email'] = req.query.email.toLowerCase();

    if (!isAdminRole(req.user.role)) {
      filter.userId = req.user.id;
    }

    const page = Math.max(parseInt(req.query.page, 10) || PAGINATION.DEFAULT_PAGE, 1);
    const limit = Math.min(parseInt(req.query.limit, 10) || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Order.countDocuments(filter),
    ]);

    res.json({
      orders: orders.map(formatOrder),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
});

router.post('/chatbot/preview', verifyUser, createChatbotOrderRules, validate, async (req, res, next) => {
  try {
    const { productId, quantity, paymentMethod, deliveryDate, deliverySlot = '', address } = req.body;
    const normalizedQty = Number(quantity);

    if (normalizedQty >= BULK_ORDER_THRESHOLD) {
      return res.status(400).json({
        error: `Bulk orders (${BULK_ORDER_THRESHOLD}+ items) must be submitted through the bulk order flow`,
      });
    }

    const product = await Product.findById(productId).select('productName price image stockQuantity isActive');
    if (!product || product.isActive === false) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (product.stockQuantity < normalizedQty) {
      return res.status(409).json({
        error: 'Insufficient stock for selected quantity',
        stockIssues: [{
          productId,
          name: product.productName,
          requestedQuantity: normalizedQty,
          availableStock: product.stockQuantity,
        }],
      });
    }

    const { error: dateError, value: parsedDeliveryDate } = parseDeliveryDateOrError(deliveryDate);
    if (dateError) return res.status(400).json({ error: dateError });

    const normalizedAddress = toAddressObject(address);
    if (!normalizedAddress.street.trim() || !normalizedAddress.city.trim()) {
      return res.status(400).json({ error: 'Address street and city are required' });
    }

    const method = paymentMethod === 'card' ? 'online' : paymentMethod;
    if (!['online', 'cash_on_delivery'].includes(method)) {
      return res.status(400).json({ error: 'Unsupported payment method' });
    }

    const subtotal = Number(product.price) * normalizedQty;
    const tax = Number((subtotal * 0.08).toFixed(2));
    const shipping = 350;
    const totalAmount = Number((subtotal + tax + shipping).toFixed(2));

    res.json({
      canPlaceOrder: true,
      preview: {
        product: {
          id: product._id,
          name: product.productName,
          image: product.image || '',
          unitPrice: Number(product.price),
        },
        quantity: normalizedQty,
        paymentMethod: method,
        deliveryDate: parsedDeliveryDate,
        deliverySlot,
        address: normalizedAddress,
        subtotal,
        tax,
        shipping,
        totalAmount,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.post('/chatbot/place', verifyUser, createChatbotOrderRules, validate, async (req, res, next) => {
  try {
    const {
      productId,
      quantity,
      paymentMethod,
      deliveryDate,
      deliverySlot = '',
      address,
      notes = '',
    } = req.body;

    const normalizedQty = Number(quantity);
    if (normalizedQty >= BULK_ORDER_THRESHOLD) {
      return res.status(400).json({
        error: `Bulk orders (${BULK_ORDER_THRESHOLD}+ items) must be submitted through the bulk order flow`,
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const product = await Product.findById(productId).select('productName price image stockQuantity isActive');
    if (!product || product.isActive === false) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (product.stockQuantity < normalizedQty) {
      return res.status(409).json({
        error: 'Insufficient stock for selected quantity',
        stockIssues: [{
          productId,
          name: product.productName,
          requestedQuantity: normalizedQty,
          availableStock: product.stockQuantity,
        }],
      });
    }

    const { error: dateError, value: parsedDeliveryDate } = parseDeliveryDateOrError(deliveryDate);
    if (dateError) return res.status(400).json({ error: dateError });

    const normalizedAddress = toAddressObject(address);
    if (!normalizedAddress.street.trim() || !normalizedAddress.city.trim()) {
      return res.status(400).json({ error: 'Address street and city are required' });
    }

    const method = paymentMethod === 'card' ? 'online' : paymentMethod;
    if (!['online', 'cash_on_delivery'].includes(method)) {
      return res.status(400).json({ error: 'Unsupported payment method' });
    }

    const item = {
      productId: product._id,
      name: product.productName,
      productName: product.productName,
      price: Number(product.price),
      quantity: normalizedQty,
      image: product.image || '',
    };
    const items = [item];
    const subtotal = Number(product.price) * normalizedQty;
    const tax = Number((subtotal * 0.08).toFixed(2));
    const shipping = 350;
    const totalAmount = Number((subtotal + tax + shipping).toFixed(2));

    const stockReservation = await reserveStockForOrderItems(items);
    if (!stockReservation.success) {
      return res.status(409).json({
        error: 'Some items went out of stock during checkout. Please review your order and try again.',
        stockIssues: stockReservation.stockIssues || [],
      });
    }

    const orderPayload = {
      userId: req.user.id,
      customer: {
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
      },
      items,
      subtotal,
      tax,
      shipping,
      totalAmount,
      address: normalizedAddress,
      deliveryType: 'delivery',
      paymentMethod: method,
      paymentStatus: method === 'online' ? 'paid' : 'pending',
      orderStatus: 'pending',
      deliveryDate: parsedDeliveryDate,
      deliverySlot,
      notes,
      unread: true,
    };

    let order;
    try {
      order = await createOrderWithRetry(orderPayload);
    } catch (createErr) {
      await rollbackReservedStock(stockReservation.reservations);
      throw createErr;
    }

    await Promise.all([
      createUserOrderNotification({
        userId: req.user.id,
        customerEmail: user.email,
        orderId: order.orderId,
        status: 'pending',
        event: 'placed',
      }),
      createAdminOrderNotifications({
        orderId: order.orderId,
        customerName: user.name,
      }),
    ]);

    const formatted = formatOrder(order);

    res.status(201).json({
      message: 'Order placed successfully from chatbot',
      order: formatted,
      confirmation: {
        orderId: formatted.orderId,
        status: formatted.status,
        paymentMethod: formatted.paymentMethod,
        paymentStatus: formatted.paymentStatus,
        totalAmount: formatted.totalAmount,
        deliveryDate: formatted.deliveryDate,
        deliverySlot: formatted.deliverySlot,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.get('/:id/tracking', verifyUser, async (req, res, next) => {
  try {
    const order = await getOrderByOrderIdForUser({ orderId: req.params.id, requester: req.user });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const formattedOrder = formatOrder(order);
    const progress = getOrderProgressState(formattedOrder.status || formattedOrder.orderStatus);

    res.json({
      order: formattedOrder,
      progress,
      tracking: {
        orderId: formattedOrder.orderId,
        status: progress.currentStatus,
        deliveryDate: formattedOrder.deliveryDate,
        deliverySlot: formattedOrder.deliverySlot || formattedOrder.deliveryTime || '',
        paymentMethod: formattedOrder.paymentMethod,
        address: formattedOrder.address,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', verifyUser, async (req, res, next) => {
  try {
    const order = await getOrderByOrderIdForUser({ orderId: req.params.id, requester: req.user });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const formattedOrder = formatOrder(order);
    res.json({
      order: formattedOrder,
      progress: getOrderProgressState(formattedOrder.status || formattedOrder.orderStatus),
    });
  } catch (err) {
    next(err);
  }
});

router.post('/', verifyUser, createOrderRules, validate, async (req, res, next) => {
  try {
    const { paymentMethod, deliveryType = 'delivery', deliveryDate, deliverySlot = '', notes = '' } = req.body;

    const method = paymentMethod === 'card' ? 'online' : paymentMethod;
    if (!['online', 'cash_on_delivery'].includes(method)) {
      return res.status(400).json({ error: 'Unsupported payment method' });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    let selectedAddress = null;

    if (req.body.addressId) {
      const found = user.addresses?.id(req.body.addressId);
      if (!found) {
        return res.status(400).json({ error: 'Selected address was not found' });
      }
      selectedAddress = toAddressObject(found);
    } else if (req.body.address) {
      const candidate = toAddressObject(req.body.address);
      if (!candidate.street.trim() || !candidate.city.trim()) {
        return res.status(400).json({ error: 'Address street and city are required' });
      }
      selectedAddress = candidate;
    } else {
      const defaultAddress = user.addresses?.find((a) => a.isDefault) || user.addresses?.[0];
      if (defaultAddress) selectedAddress = toAddressObject(defaultAddress);
    }

    if (!selectedAddress) {
      return res.status(400).json({ error: 'Delivery address is required' });
    }

    if (req.body.saveAddress && req.body.address && !req.body.addressId) {
      const alreadyExists = (user.addresses || []).some((addr) => (
        `${addr.street}|${addr.city}|${addr.zipCode || ''}`.toLowerCase() ===
        `${selectedAddress.street}|${selectedAddress.city}|${selectedAddress.zipCode || ''}`.toLowerCase()
      ));

      if (!alreadyExists) {
        user.addresses.push({
          ...selectedAddress,
          isDefault: !user.addresses?.length,
        });
        await user.save();
      }
    }

    const cart = await Cart.findOne({ userId: req.user.id });
    if (!cart || !cart.items.length) {
      return res.status(400).json({ error: 'Cart is empty. Add items before checkout.' });
    }

    const totalCartQuantity = cart.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
    const hasBulkQuantity = totalCartQuantity >= BULK_ORDER_THRESHOLD
      || cart.items.some((item) => Number(item.quantity || 0) >= BULK_ORDER_THRESHOLD);

    if (hasBulkQuantity) {
      return res.status(400).json({
        error: `Bulk orders (${BULK_ORDER_THRESHOLD}+ items) must be submitted through the bulk order flow`,
      });
    }

    const productIds = cart.items.map((item) => item.productId);
    const products = await Product.find({ _id: { $in: productIds } })
      .select('productName price image stockQuantity');

    const productMap = new Map(products.map((p) => [p._id.toString(), p]));
    const stockIssues = [];
    const items = [];
    let subtotal = 0;

    for (const cartItem of cart.items) {
      const product = productMap.get(cartItem.productId.toString());
      if (!product) {
        stockIssues.push({
          productId: cartItem.productId,
          message: 'Product no longer exists',
        });
        continue;
      }

      if (product.stockQuantity < cartItem.quantity) {
        stockIssues.push({
          productId: product._id,
          name: product.productName,
          requestedQuantity: cartItem.quantity,
          availableStock: product.stockQuantity,
          message: 'Insufficient stock',
        });
        continue;
      }

      const price = Number(product.price);
      const quantity = Number(cartItem.quantity);
      subtotal += price * quantity;

      items.push({
        productId: product._id,
        name: product.productName,
        productName: product.productName,
        price,
        quantity,
        image: product.image || cartItem.image || '',
      });
    }

    if (stockIssues.length > 0) {
      return res.status(409).json({
        error: 'Some items are no longer available in requested quantity',
        stockIssues,
      });
    }

    const parsedTax = Number(req.body.tax);
    const parsedShipping = Number(req.body.shipping);
    const tax = Number.isFinite(parsedTax) ? Math.max(parsedTax, 0) : Number((subtotal * 0.08).toFixed(2));
    const shipping = Number.isFinite(parsedShipping)
      ? Math.max(parsedShipping, 0)
      : (deliveryType === 'delivery' ? 350 : 0);
    const totalAmount = Number((subtotal + tax + shipping).toFixed(2));

    let parsedDeliveryDate = null;
    if (deliveryDate) {
      const d = new Date(deliveryDate);
      if (Number.isNaN(d.getTime())) {
        return res.status(400).json({ error: 'deliveryDate is invalid' });
      }
      parsedDeliveryDate = d;
    }

    const orderPayload = {
      userId: req.user.id,
      customer: {
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
      },
      items,
      subtotal,
      tax,
      shipping,
      totalAmount,
      address: selectedAddress,
      deliveryType,
      paymentMethod: method,
      paymentStatus: method === 'online' ? 'paid' : 'pending',
      orderStatus: 'pending',
      deliveryDate: parsedDeliveryDate,
      deliverySlot,
      notes,
      unread: true,
    };

    const stockReservation = await reserveStockForOrderItems(items);
    if (!stockReservation.success) {
      return res.status(409).json({
        error: 'Some items went out of stock during checkout. Please review your cart and try again.',
        stockIssues: stockReservation.stockIssues || [],
      });
    }

    let order;
    try {
      order = await createOrderWithRetry(orderPayload);
    } catch (createErr) {
      await rollbackReservedStock(stockReservation.reservations);
      throw createErr;
    }

    await Promise.all([
      createUserOrderNotification({
        userId: req.user.id,
        customerEmail: user.email,
        orderId: order.orderId,
        status: 'pending',
        event: 'placed',
      }),
      createAdminOrderNotifications({
        orderId: order.orderId,
        customerName: user.name,
      }),
    ]);

    cart.items = [];
    cart.couponCode = null;
    await cart.save();

    const formatted = formatOrder(order);

    res.status(201).json({
      message: 'Order created successfully',
      order: formatted,
      confirmation: {
        orderId: formatted.orderId,
        status: formatted.status,
        paymentMethod: formatted.paymentMethod,
        paymentStatus: formatted.paymentStatus,
        totalAmount: formatted.totalAmount,
        deliveryDate: formatted.deliveryDate,
        deliverySlot: formatted.deliverySlot,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/status', verifyAdmin, updateOrderStatusRules, validate, async (req, res, next) => {
  try {
    const order = await Order.findOne(buildOrderLookupFilter(req.params.id));
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const previousStatus = normalizeNormalOrderStatus(order.orderStatus);
    const nextStatus = normalizeNormalOrderStatus(req.body.status);

    const canTransition = canTransitionStatus({
      currentStatus: previousStatus,
      nextStatus,
      transitions: NORMAL_ORDER_STATUS_TRANSITIONS,
      normalize: normalizeNormalOrderStatus,
    });

    if (!canTransition) {
      const allowed = NORMAL_ORDER_STATUS_TRANSITIONS[previousStatus] || [];
      return res.status(400).json({
        error: `Invalid status transition from ${formatStatusLabel(previousStatus)} to ${formatStatusLabel(nextStatus)}`,
        allowedNextStatuses: allowed,
      });
    }

    if (nextStatus === 'cancelled') {
      if (!order.stockRestoredOnCancel) {
        await restoreStockForOrderItems(order.items);
        order.stockRestoredOnCancel = true;
      }
      order.cancelledAt = order.cancelledAt || new Date();
      order.cancellationAllowed = false;
      order.cancelledBy = 'admin';
    } else {
      order.cancelledBy = '';
    }

    order.orderStatus = nextStatus;
    await order.save();

    if (previousStatus !== nextStatus) {
      await createUserOrderNotification({
        userId: order.userId,
        customerEmail: order.customer?.email,
        orderId: order.orderId,
        status: nextStatus,
        cancelledBy: order.cancelledBy || '',
        event: 'status',
        items: order.items,
      });
    }

    res.json(formatOrder(order));
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/cancel', verifyUser, async (req, res, next) => {
  try {
    if (isAdminRole(req.user.role)) {
      return res.status(403).json({ error: 'Admins cannot cancel orders via customer endpoint' });
    }

    const filter = buildOrderLookupFilter(req.params.id);
    filter.userId = req.user.id;

    const order = await Order.findOne(filter);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const currentStatus = normalizeNormalOrderStatus(order.orderStatus);
    if (!CANCELLABLE_ORDER_STATUSES.includes(currentStatus)) {
      return res.status(400).json({
        error: 'Order cannot be cancelled once it is out for delivery or delivered',
      });
    }

    const reason = String(req.body?.reason || '').trim().slice(0, 300);

    if (!order.stockRestoredOnCancel) {
      await restoreStockForOrderItems(order.items);
      order.stockRestoredOnCancel = true;
    }

    order.orderStatus = 'cancelled';
    order.cancelledAt = new Date();
    order.cancelReason = reason;
    order.cancelledBy = 'customer';
    order.cancellationAllowed = false;
    await order.save();

    await Promise.all([
      createUserOrderNotification({
        userId: order.userId,
        customerEmail: order.customer?.email,
        orderId: order.orderId,
        status: 'cancelled',
        cancelledBy: 'customer',
        event: 'status',
        items: order.items,
      }),
      createAdminCancellationNotifications({
        orderId: order.orderId,
        customerName: order.customer?.name,
        reason,
      }),
    ]);

    res.json({
      message: 'Order cancelled successfully',
      order: formatOrder(order),
      canCancel: false,
    });
  } catch (err) {
    next(err);
  }
});

router.patch('/mark-viewed', verifyAdmin, async (req, res, next) => {
  try {
    await Order.updateMany({}, { unread: false });
    res.json({ message: 'Orders marked as viewed' });
  } catch (err) {
    next(err);
  }
});

export default router;
