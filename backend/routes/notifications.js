import express from 'express';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { verifyUser } from '../middleware/auth.js';
import { createInAppNotification, createInAppNotifications } from '../services/inAppNotificationService.js';

const router = express.Router();

const buildRecipientFilter = (authUser) => {
  const email = String(authUser?.email || '').toLowerCase();
  const userId = authUser?.id;

  const or = [];
  if (email) or.push({ customerEmail: email });
  if (userId) or.push({ userId });

  if (or.length === 0) return { _id: null };
  if (or.length === 1) return or[0];
  return { $or: or };
};

const getInternalNotificationKey = () => (
  process.env.NOTIFICATION_INTERNAL_KEY
  || process.env.CHATBOT_NOTIFICATION_KEY
  || process.env.JWT_SECRET
  || ''
);

const verifyInternalNotificationKey = (req, res, next) => {
  const provided = String(
    req.headers['x-internal-notification-key']
    || req.headers['x-notification-key']
    || ''
  ).trim();
  const expected = String(getInternalNotificationKey()).trim();

  if (!expected || !provided || provided !== expected) {
    return res.status(401).json({ error: 'Unauthorized internal notification request' });
  }

  return next();
};

router.post('/internal', verifyInternalNotificationKey, async (req, res, next) => {
  try {
    const {
      title,
      message,
      type = 'system',
      relatedType = 'system',
      relatedId = '',
      redirectPath = '',
      metadata = {},
      orderId = '',
      bulkOrderId = '',
      customOrderId = '',
      productId = '',
      userId = '',
      customerEmail = '',
      target = 'single',
    } = req.body || {};

    if (!String(title || '').trim() || !String(message || '').trim()) {
      return res.status(400).json({ error: 'title and message are required' });
    }

    let created = [];

    if (String(target).toLowerCase() === 'admins') {
      const admins = await User.find({ role: { $in: ['admin', 'superadmin'] } }).select('_id email');
      created = await createInAppNotifications(admins.map((admin) => ({
        userId: admin._id,
        customerEmail: admin.email || '',
        title,
        message,
        type,
        relatedType,
        relatedId,
        redirectPath,
        metadata,
        orderId,
        bulkOrderId,
        customOrderId,
        productId,
      })));
    } else {
      const notification = await createInAppNotification({
        userId: userId || null,
        customerEmail,
        title,
        message,
        type,
        relatedType,
        relatedId,
        redirectPath,
        metadata,
        orderId,
        bulkOrderId,
        customOrderId,
        productId,
      });
      created = [notification];
    }

    return res.status(201).json({
      count: created.length,
      notifications: created,
    });
  } catch (err) {
    return next(err);
  }
});

router.get('/', verifyUser, async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit, 10) || 30, 100);
    const skip = (page - 1) * limit;

    const recipientFilter = buildRecipientFilter(req.user);
    const filter = { ...recipientFilter };

    if (req.query.unreadOnly === 'true') {
      filter.read = false;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Notification.countDocuments(filter),
      Notification.countDocuments({ ...recipientFilter, read: false }),
    ]);

    res.json({
      notifications,
      unreadCount,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/read', verifyUser, async (req, res, next) => {
  try {
    const filter = {
      _id: req.params.id,
      ...buildRecipientFilter(req.user),
    };

    const updated = await Notification.findOneAndUpdate(
      filter,
      { read: true },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

router.patch('/read-all', verifyUser, async (req, res, next) => {
  try {
    const filter = {
      ...buildRecipientFilter(req.user),
      read: false,
    };

    const result = await Notification.updateMany(filter, { read: true });

    res.json({
      message: 'All notifications marked as read',
      modifiedCount: result.modifiedCount || 0,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
