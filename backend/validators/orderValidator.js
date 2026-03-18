import { body } from 'express-validator';

export const createOrderRules = [
  body('paymentMethod')
    .trim()
    .isIn(['online', 'cash_on_delivery'])
    .withMessage('Payment method must be online or cash_on_delivery'),
  body('deliveryType')
    .optional()
    .isIn(['delivery', 'takeaway'])
    .withMessage('Delivery type must be delivery or takeaway'),
  body('addressId')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Address ID cannot be empty'),
  body('address')
    .optional()
    .isObject()
    .withMessage('Address must be an object'),
  body('address.street')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Street is required when using a new address'),
  body('address.city')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('City is required when using a new address'),
  body('address.state')
    .optional()
    .trim(),
  body('address.zipCode')
    .optional()
    .trim(),
  body('address.country')
    .optional()
    .trim(),
  body('address.label')
    .optional()
    .trim(),
  body('saveAddress')
    .optional()
    .isBoolean()
    .withMessage('saveAddress must be a boolean'),
  body('deliveryDate')
    .optional({ values: 'falsy' })
    .isISO8601()
    .withMessage('deliveryDate must be a valid date'),
  body('deliverySlot')
    .optional({ values: 'falsy' })
    .trim()
    .notEmpty()
    .withMessage('deliverySlot cannot be empty'),
  body('tax')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Tax must be a non-negative number'),
  body('shipping')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Shipping must be a non-negative number'),
  body('notes')
    .optional()
    .isString()
    .withMessage('Notes must be text'),
];

export const createBulkOrderRules = [
  body('items')
    .isArray({ min: 1 })
    .withMessage('Bulk order must contain at least one item'),
  body('items.*')
    .custom((item) => Boolean(item?.name || item?.productName))
    .withMessage('Item name is required'),
  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Item quantity must be at least 1'),
  body('customer.name')
    .trim()
    .notEmpty()
    .withMessage('Customer name is required'),
  body('customer.email')
    .trim()
    .isEmail()
    .withMessage('Valid customer email is required'),
  body('customer.phone')
    .optional()
    .trim(),
  body('preferredDate')
    .isISO8601()
    .withMessage('Preferred date must be a valid date'),
  body('preferredTime')
    .optional({ values: 'falsy' })
    .trim()
    .notEmpty()
    .withMessage('preferredTime cannot be empty'),
];

export const updateOrderStatusRules = [
  body('status')
    .trim()
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['pending', 'in_progress', 'ready', 'packed', 'out_for_delivery', 'delivered', 'cancelled'])
    .withMessage('Invalid order status'),
];

export const createChatbotOrderRules = [
  body('productId')
    .trim()
    .notEmpty()
    .withMessage('productId is required'),
  body('quantity')
    .isInt({ min: 1 })
    .withMessage('quantity must be at least 1'),
  body('paymentMethod')
    .trim()
    .isIn(['online', 'cash_on_delivery'])
    .withMessage('Payment method must be online or cash_on_delivery'),
  body('deliveryDate')
    .isISO8601()
    .withMessage('deliveryDate must be a valid date'),
  body('deliverySlot')
    .optional({ values: 'falsy' })
    .trim(),
  body('address')
    .isObject()
    .withMessage('address is required'),
  body('address.street')
    .trim()
    .notEmpty()
    .withMessage('Address street is required'),
  body('address.city')
    .trim()
    .notEmpty()
    .withMessage('Address city is required'),
  body('address.state')
    .optional({ values: 'falsy' })
    .trim(),
  body('address.zipCode')
    .optional({ values: 'falsy' })
    .trim(),
  body('address.country')
    .optional({ values: 'falsy' })
    .trim(),
  body('notes')
    .optional({ values: 'falsy' })
    .isString()
    .withMessage('Notes must be text'),
];
