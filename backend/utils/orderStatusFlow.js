export const UNIFIED_FLOW_STATUSES = [
  'awaiting_admin_quote',
  'awaiting_user_confirmation',
  'awaiting_user_acceptance',
  'awaiting_user_payment',
  'in_progress',
  'ready',
  'out_for_delivery',
  'delivered',
  'rejected',
];

const NORMAL_STATUS_ALIASES = {
  packed: 'ready',
};

const CUSTOM_STATUS_ALIASES = {
  packed: 'ready',
};

export const normalizeNormalOrderStatus = (status) => {
  const normalized = String(status || 'pending').toLowerCase();
  return NORMAL_STATUS_ALIASES[normalized] || normalized;
};

export const normalizeCustomOrderStatus = (status) => {
  const normalized = String(status || 'awaiting_user_confirmation').toLowerCase();
  return CUSTOM_STATUS_ALIASES[normalized] || normalized;
};

export const formatFlowStatusLabel = (status) => {
  return String(status || 'unknown')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

export const NORMAL_ORDER_STATUS_TRANSITIONS = {
  pending: ['in_progress', 'ready', 'cancelled'],
  in_progress: ['ready', 'cancelled'],
  ready: ['out_for_delivery', 'cancelled'],
  out_for_delivery: ['delivered'],
  delivered: [],
  cancelled: [],
};

export const CUSTOM_ORDER_STATUS_TRANSITIONS = {
  awaiting_admin_quote: ['awaiting_user_acceptance', 'rejected'],
  awaiting_user_confirmation: ['awaiting_admin_quote', 'rejected'],
  awaiting_user_acceptance: ['awaiting_user_payment', 'rejected'],
  awaiting_user_payment: ['rejected'],
  price_accepted: ['awaiting_user_payment', 'rejected'],
  in_progress: ['ready', 'rejected'],
  ready: ['out_for_delivery', 'rejected'],
  out_for_delivery: ['delivered'],
  delivered: [],
  rejected: [],
  cancelled: [],
};

export const canTransitionStatus = ({
  currentStatus,
  nextStatus,
  transitions,
  normalize = (value) => String(value || '').toLowerCase(),
}) => {
  const current = normalize(currentStatus);
  const next = normalize(nextStatus);

  if (!current || !next) return false;
  if (current === next) return true;

  const allowed = transitions[current] || [];
  return allowed.includes(next);
};

export const NORMAL_ORDER_PROGRESS_STEPS = [
  'awaiting_user_confirmation',
  'in_progress',
  'ready',
  'out_for_delivery',
  'delivered',
];

export const normalizeNormalStatusForProgress = (status) => {
  const normalized = normalizeNormalOrderStatus(status);
  if (normalized === 'pending') return 'awaiting_user_confirmation';
  return normalized;
};

export const buildProgressState = ({
  status,
  progressSteps,
  normalizeForProgress = (value) => String(value || '').toLowerCase(),
  cancelledStatuses = ['cancelled', 'rejected'],
}) => {
  const currentStatus = normalizeForProgress(status);
  const currentStepIndex = Math.max(progressSteps.indexOf(currentStatus), 0);
  const isCancelled = cancelledStatuses.includes(currentStatus);

  return {
    currentStatus,
    currentStepIndex,
    isCancelled,
    steps: progressSteps.map((step, index) => ({
      key: step,
      label: formatFlowStatusLabel(step),
      completed: !isCancelled && index <= currentStepIndex,
      active: !isCancelled && index === currentStepIndex,
    })),
  };
};
