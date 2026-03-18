import express from 'express';
import Order from '../models/Order.js';
import BulkOrder from '../models/BulkOrder.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import { verifyAdmin } from '../middleware/auth.js';

const router = express.Router();

const DEFAULT_LOW_STOCK_THRESHOLD = 10;
const BULK_REVENUE_STATUSES = [
  'awaiting_user_payment',
  'in_progress',
  'ready',
  'out_for_delivery',
  'delivered',
  // Legacy values for backward compatibility.
  'approved',
  'completed',
];
const ORDER_STATUS_LABELS = {
  pending: 'Pending',
  packed: 'Packed',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

const getProductStockStatus = (stockQuantity, lowStockThreshold) => {
  if (stockQuantity <= 0) return 'out-of-stock';
  if (stockQuantity <= lowStockThreshold) return 'low-stock';
  return 'in-stock';
};

const getStartOfDay = () => {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  return date;
};

const getStartOfWeek = () => {
  const date = new Date();
  const day = date.getUTCDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  date.setUTCDate(date.getUTCDate() + diffToMonday);
  date.setUTCHours(0, 0, 0, 0);
  return date;
};

const getStartOfMonth = () => {
  const date = new Date();
  date.setUTCDate(1);
  date.setUTCHours(0, 0, 0, 0);
  return date;
};

const getLastNDaysStart = (days) => {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - (days - 1));
  date.setUTCHours(0, 0, 0, 0);
  return date;
};

const getRevenueTotal = async ({ since = null } = {}) => {
  const orderMatch = { orderStatus: { $ne: 'cancelled' } };
  const bulkMatch = { approvalStatus: { $in: BULK_REVENUE_STATUSES } };

  if (since) {
    orderMatch.createdAt = { $gte: since };
    bulkMatch.createdAt = { $gte: since };
  }

  const [orderAgg, bulkAgg] = await Promise.all([
    Order.aggregate([
      { $match: orderMatch },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]),
    BulkOrder.aggregate([
      { $match: bulkMatch },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]),
  ]);

  return (orderAgg[0]?.total || 0) + (bulkAgg[0]?.total || 0);
};

const buildDailyRevenueSeries = async (days = 14) => {
  const startDate = getLastNDaysStart(days);

  const [orderRows, bulkRows] = await Promise.all([
    Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          orderStatus: { $ne: 'cancelled' },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$totalAmount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    BulkOrder.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          approvalStatus: { $in: BULK_REVENUE_STATUSES },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$totalAmount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);

  const byDay = new Map();
  for (let i = 0; i < days; i += 1) {
    const day = new Date(startDate);
    day.setUTCDate(startDate.getUTCDate() + i);
    const key = day.toISOString().slice(0, 10);
    byDay.set(key, { date: key, revenue: 0, orders: 0 });
  }

  const mergeRow = (row) => {
    const existing = byDay.get(row._id) || { date: row._id, revenue: 0, orders: 0 };
    existing.revenue += row.revenue || 0;
    existing.orders += row.count || 0;
    byDay.set(row._id, existing);
  };

  orderRows.forEach(mergeRow);
  bulkRows.forEach(mergeRow);

  return [...byDay.values()].sort((a, b) => a.date.localeCompare(b.date));
};

const buildMonthlyRevenueSeries = async (months = 6) => {
  const startDate = new Date();
  startDate.setUTCDate(1);
  startDate.setUTCMonth(startDate.getUTCMonth() - (months - 1));
  startDate.setUTCHours(0, 0, 0, 0);

  const [orderRows, bulkRows] = await Promise.all([
    Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          orderStatus: { $ne: 'cancelled' },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          revenue: { $sum: '$totalAmount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    BulkOrder.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          approvalStatus: { $in: BULK_REVENUE_STATUSES },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          revenue: { $sum: '$totalAmount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);

  const byMonth = new Map();
  for (let i = 0; i < months; i += 1) {
    const month = new Date(startDate);
    month.setUTCMonth(startDate.getUTCMonth() + i);
    const key = `${month.getUTCFullYear()}-${String(month.getUTCMonth() + 1).padStart(2, '0')}`;
    byMonth.set(key, { month: key, revenue: 0, orders: 0 });
  }

  const mergeRow = (row) => {
    const existing = byMonth.get(row._id) || { month: row._id, revenue: 0, orders: 0 };
    existing.revenue += row.revenue || 0;
    existing.orders += row.count || 0;
    byMonth.set(row._id, existing);
  };

  orderRows.forEach(mergeRow);
  bulkRows.forEach(mergeRow);

  return [...byMonth.values()].sort((a, b) => a.month.localeCompare(b.month));
};

const getTopProducts = async (limit = 10) => {
  const topProducts = await Order.aggregate([
    { $match: { orderStatus: { $ne: 'cancelled' } } },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.productId',
        productName: { $first: { $ifNull: ['$items.productName', '$items.name'] } },
        totalQuantity: { $sum: '$items.quantity' },
        totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
        orderCount: { $sum: 1 },
      },
    },
    { $sort: { totalQuantity: -1 } },
    { $limit: limit },
  ]);

  return topProducts.map((item) => ({
    productId: item._id,
    productName: item.productName || 'Unknown Product',
    totalQuantity: item.totalQuantity || 0,
    totalRevenue: item.totalRevenue || 0,
    orderCount: item.orderCount || 0,
  }));
};

const getOrderStatusBreakdown = async () => {
  const rows = await Order.aggregate([
    { $group: { _id: '$orderStatus', count: { $sum: 1 } } },
  ]);

  const byStatus = new Map(rows.map((row) => [row._id, row.count]));
  return Object.keys(ORDER_STATUS_LABELS).map((status) => ({
    status,
    label: ORDER_STATUS_LABELS[status],
    count: byStatus.get(status) || 0,
  }));
};

const getInventoryInsights = async (limit = 8) => {
  const products = await Product.find({ isActive: true })
    .select('productName stockQuantity lowStockThreshold')
    .sort({ stockQuantity: 1 })
    .lean();

  const stockRows = products.map((product) => {
    const stockQuantity = Number(product.stockQuantity || 0);
    const lowStockThreshold = Number.isFinite(Number(product.lowStockThreshold))
      ? Number(product.lowStockThreshold)
      : DEFAULT_LOW_STOCK_THRESHOLD;

    return {
      _id: product._id,
      productName: product.productName,
      stockQuantity,
      lowStockThreshold,
      status: getProductStockStatus(stockQuantity, lowStockThreshold),
    };
  });

  const lowStockItems = stockRows
    .filter((row) => row.status !== 'in-stock')
    .slice(0, limit);

  const lowStockCount = stockRows.filter((row) => row.status !== 'in-stock').length;
  const outOfStockCount = stockRows.filter((row) => row.status === 'out-of-stock').length;

  return {
    totalProducts: stockRows.length,
    lowStockCount,
    outOfStockCount,
    lowStockItems,
  };
};

const getOverviewMetrics = async () => {
  const startOfDay = getStartOfDay();
  const startOfWeek = getStartOfWeek();
  const startOfMonth = getStartOfMonth();

  const [
    totalOrders,
    pendingOrders,
    deliveredOrders,
    totalBulkOrders,
    pendingBulkOrders,
    totalProducts,
    totalCustomers,
    unreadOrders,
    lowStockItems,
    totalRevenue,
    dailySales,
    weeklySales,
    monthlyRevenue,
  ] = await Promise.all([
    Order.countDocuments(),
    Order.countDocuments({ orderStatus: 'pending' }),
    Order.countDocuments({ orderStatus: 'delivered' }),
    BulkOrder.countDocuments(),
    BulkOrder.countDocuments({ approvalStatus: { $in: ['awaiting_admin_acceptance', 'pending'] } }),
    Product.countDocuments({ isActive: true }),
    User.countDocuments(),
    Order.countDocuments({ unread: true }),
    Product.countDocuments({
      isActive: true,
      $expr: {
        $lte: [
          '$stockQuantity',
          { $ifNull: ['$lowStockThreshold', DEFAULT_LOW_STOCK_THRESHOLD] },
        ],
      },
    }),
    getRevenueTotal(),
    getRevenueTotal({ since: startOfDay }),
    getRevenueTotal({ since: startOfWeek }),
    getRevenueTotal({ since: startOfMonth }),
  ]);

  return {
    totalOrders,
    pendingOrders,
    deliveredOrders,
    totalBulkOrders,
    bulkOrdersCount: totalBulkOrders,
    pendingBulkOrders,
    totalProducts,
    totalCustomers,
    unreadOrders,
    lowStockItems,
    totalRevenue,
    dailySales,
    weeklySales,
    monthlyRevenue,
  };
};

// All analytics routes require admin authentication
router.use(verifyAdmin);

// GET /api/analytics/overview - Dashboard summary cards
router.get('/overview', async (req, res, next) => {
  try {
    const overview = await getOverviewMetrics();
    res.json(overview);
  } catch (err) {
    next(err);
  }
});

// GET /api/analytics/dashboard - Full dashboard payload
router.get('/dashboard', async (req, res, next) => {
  try {
    const [summary, dailySeries, monthlySeries, topProducts, orderStatus, inventory] = await Promise.all([
      getOverviewMetrics(),
      buildDailyRevenueSeries(14),
      buildMonthlyRevenueSeries(6),
      getTopProducts(8),
      getOrderStatusBreakdown(),
      getInventoryInsights(8),
    ]);

    res.json({
      summary,
      charts: {
        dailySales: dailySeries,
        monthlyRevenue: monthlySeries,
        orderStatus,
      },
      topProducts,
      inventory,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/analytics/revenue - Revenue over time
router.get('/revenue', async (req, res, next) => {
  try {
    const days = parseInt(req.query.days, 10) || 30;
    const startDate = getLastNDaysStart(days);

    const [orderRevenue, bulkRevenue] = await Promise.all([
      Order.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate },
            orderStatus: { $ne: 'cancelled' },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
            },
            revenue: { $sum: '$totalAmount' },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      BulkOrder.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate },
            approvalStatus: { $in: BULK_REVENUE_STATUSES },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
            },
            revenue: { $sum: '$totalAmount' },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    res.json({ orderRevenue, bulkRevenue, period: `${days} days` });
  } catch (err) {
    next(err);
  }
});

// GET /api/analytics/top-products - Best sellers
router.get('/top-products', async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 10;
    const topProducts = await getTopProducts(limit);
    res.json(topProducts);
  } catch (err) {
    next(err);
  }
});

// GET /api/analytics/orders-by-status - Order status breakdown
router.get('/orders-by-status', async (req, res, next) => {
  try {
    const [ordersByStatus, bulkByStatus] = await Promise.all([
      Order.aggregate([
        { $group: { _id: '$orderStatus', count: { $sum: 1 } } },
      ]),
      BulkOrder.aggregate([
        { $group: { _id: '$approvalStatus', count: { $sum: 1 } } },
      ]),
    ]);

    res.json({ orders: ordersByStatus, bulkOrders: bulkByStatus });
  } catch (err) {
    next(err);
  }
});

// GET /api/analytics/customers - Customer growth over time
router.get('/customers', async (req, res, next) => {
  try {
    const days = parseInt(req.query.days, 10) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const growth = await User.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          newCustomers: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const totalCustomers = await User.countDocuments();

    res.json({ growth, totalCustomers, period: `${days} days` });
  } catch (err) {
    next(err);
  }
});

// GET /api/analytics/inventory-status - Inventory health overview
router.get('/inventory-status', async (req, res, next) => {
  try {
    const products = await Product.find({ isActive: true })
      .populate('categoryId', 'name')
      .select('productName categoryId stockQuantity lowStockThreshold')
      .sort({ stockQuantity: 1 })
      .lean();

    const inventoryRows = products.map((product) => {
      const stockQuantity = Number(product.stockQuantity || 0);
      const lowStockThreshold = Number.isFinite(Number(product.lowStockThreshold))
        ? Number(product.lowStockThreshold)
        : DEFAULT_LOW_STOCK_THRESHOLD;
      const status = getProductStockStatus(stockQuantity, lowStockThreshold);

      return {
        _id: product._id,
        productName: product.productName,
        category: product.categoryId?.name || '',
        stockQuantity,
        lowStockThreshold,
        status,
      };
    });

    const statusCounts = inventoryRows.reduce((acc, row) => {
      acc[row.status] = (acc[row.status] || 0) + 1;
      return acc;
    }, {});

    const statusBreakdown = Object.entries(statusCounts).map(([key, count]) => ({
      _id: key,
      count,
    }));

    const lowStockItems = inventoryRows
      .filter((row) => row.status === 'low-stock')
      .slice(0, 20);

    const outOfStockItems = inventoryRows
      .filter((row) => row.status === 'out-of-stock');

    res.json({ statusBreakdown, lowStockItems, outOfStockItems, total: inventoryRows.length });
  } catch (err) {
    next(err);
  }
});

export default router;
