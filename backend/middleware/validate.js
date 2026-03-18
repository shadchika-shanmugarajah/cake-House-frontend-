import { validationResult } from 'express-validator';

/**
 * Validation runner middleware.
 * Place after express-validator check chains to collect and return errors.
 *
 * Usage:
 *   router.post('/', [...validationRules], validate, handler);
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map((e) => e.msg);
    return res.status(400).json({
      status: 'fail',
      errors: errors.array(),
      error: messages.join('. '),
    });
  }
  next();
};

export default validate;
