const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const CHAT_API_BASE = import.meta.env.VITE_CHAT_API_URL || 'http://localhost:8001/chat-api/v1';
const GET_REQUEST_DEDUPE_TTL_MS = 1200;
const inflightGetRequests = new Map();
const LEGACY_CHAT_CDN_PREFIX = 'https://cdn.example.com/uploads';

const getChatUploadBase = () => {
  try {
    const baseUrl = new URL(CHAT_API_BASE);
    return `${baseUrl.origin}/chat-api/uploads`;
  } catch {
    return 'http://localhost:8001/chat-api/uploads';
  }
};

const CHAT_UPLOAD_BASE = getChatUploadBase();

const normalizeLegacyChatImageUrl = (value) => {
  const raw = String(value || '');
  if (!raw) return raw;
  if (raw.startsWith('blob:') || raw.startsWith('data:')) return raw;

  if (raw.startsWith(LEGACY_CHAT_CDN_PREFIX)) {
    return `${CHAT_UPLOAD_BASE}${raw.slice(LEGACY_CHAT_CDN_PREFIX.length)}`;
  }

  return raw;
};

const normalizeChatPayloadUrls = (payload) => {
  if (payload === null || payload === undefined) return payload;

  if (Array.isArray(payload)) {
    return payload.map((item) => normalizeChatPayloadUrls(item));
  }

  if (typeof payload === 'object') {
    const next = {};
    Object.entries(payload).forEach(([key, value]) => {
      next[key] = normalizeChatPayloadUrls(value);
    });
    return next;
  }

  if (typeof payload === 'string') {
    return normalizeLegacyChatImageUrl(payload);
  }

  return payload;
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const fetchApi = async (path, options = {}) => {
  const method = String(options.method || 'GET').toUpperCase();

  let token = null;
  if (path.startsWith('/admin') || path.startsWith('/analytics') || window.location.pathname.startsWith('/admin')) {
    const adminAuth = JSON.parse(localStorage.getItem('adminAuth') || 'null');
    if (adminAuth?.token) token = adminAuth.token;
  } else {
    const userAuth = JSON.parse(localStorage.getItem('userAuth') || 'null');
    if (userAuth?.token) token = userAuth.token;
  }

  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const requestKey = method === 'GET' ? `${path}::${token || 'guest'}` : '';
  if (requestKey && inflightGetRequests.has(requestKey)) {
    return inflightGetRequests.get(requestKey);
  }

  const execute = async () => {
    const requestOptions = {
      ...options,
      method,
      headers,
    };

    let res = await fetch(`${API_BASE}${path}`, requestOptions);

    if (res.status === 429 && method === 'GET') {
      const retryAfterHeader = Number(res.headers.get('retry-after'));
      const retryDelay = Number.isFinite(retryAfterHeader) && retryAfterHeader > 0
        ? retryAfterHeader * 1000
        : 1200;
      await sleep(retryDelay);
      res = await fetch(`${API_BASE}${path}`, requestOptions);
    }

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const error = new Error(data.error || data.message || 'Request failed');
      error.status = res.status;
      error.data = data;
      throw error;
    }

    return data;
  };

  const promise = execute();
  if (requestKey) {
    inflightGetRequests.set(requestKey, promise);
    promise.finally(() => {
      setTimeout(() => {
        if (inflightGetRequests.get(requestKey) === promise) {
          inflightGetRequests.delete(requestKey);
        }
      }, GET_REQUEST_DEDUPE_TTL_MS);
    });
  }

  return promise;
};

// ──────────────────────────────────────────────
// Authentication
// ──────────────────────────────────────────────
export const authApi = {
  register: (body) => fetchApi('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  userLogin: (body) => fetchApi('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  adminLogin: (body) => fetchApi('/auth/admin/login', { method: 'POST', body: JSON.stringify(body) }),
};

// ──────────────────────────────────────────────
// Users
// ──────────────────────────────────────────────
export const usersApi = {
  getAll: () => fetchApi('/users'),
  getByEmail: (email) => fetchApi(`/users/${encodeURIComponent(email)}`),
  update: (email, body) => fetchApi(`/users/${encodeURIComponent(email)}`, { method: 'PUT', body: JSON.stringify(body) }),
};

// ──────────────────────────────────────────────
// Products
// ──────────────────────────────────────────────
export const productsApi = {
  getAll: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return fetchApi(q ? `/products?${q}` : '/products');
  },
  getById: (id) => fetchApi(`/products/${id}`),
  getRelated: (id) => fetchApi(`/products/${id}/related`),
  getReviews: (id) => fetchApi(`/products/${id}/reviews`),
  create: (body) => fetchApi('/products', { method: 'POST', body: JSON.stringify(body) }),
  update: (id, body) => fetchApi(`/products/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (id) => fetchApi(`/products/${id}`, { method: 'DELETE' }),
  addReview: (id, body) => fetchApi(`/products/${id}/reviews`, { method: 'POST', body: JSON.stringify(body) }),
};

// Reviews (Admin moderation)
export const reviewsApi = {
  getAll: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return fetchApi(q ? `/reviews?${q}` : '/reviews');
  },
  delete: (id) => fetchApi(`/reviews/${id}`, { method: 'DELETE' }),
};

// ──────────────────────────────────────────────
// Categories
// ──────────────────────────────────────────────
export const categoriesApi = {
  getAll: () => fetchApi('/categories'),
  getById: (id) => fetchApi(`/categories/${id}`),
  create: (body) => fetchApi('/categories', { method: 'POST', body: JSON.stringify(body) }),
  update: (id, body) => fetchApi(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (id) => fetchApi(`/categories/${id}`, { method: 'DELETE' }),
  forceDelete: (id) => fetchApi(`/categories/${id}?force=true`, { method: 'DELETE' }),
};

// ──────────────────────────────────────────────
// Orders
// ──────────────────────────────────────────────
export const ordersApi = {
  getAll: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return fetchApi(q ? `/orders?${q}` : '/orders');
  },
  getById: (id) => fetchApi(`/orders/${id}`),
  getTracking: (id) => fetchApi(`/orders/${id}/tracking`),
  create: (body) => fetchApi('/orders', { method: 'POST', body: JSON.stringify(body) }),
  cancel: (id, reason = '') => fetchApi(`/orders/${id}/cancel`, { method: 'PATCH', body: JSON.stringify({ reason }) }),
  updateStatus: (id, status) => fetchApi(`/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  markViewed: () => fetchApi('/orders/mark-viewed', { method: 'PATCH' }),
};

// ──────────────────────────────────────────────
// Bulk Orders
// ──────────────────────────────────────────────
export const bulkOrdersApi = {
  getAll: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return fetchApi(q ? `/bulk-orders?${q}` : '/bulk-orders');
  },
  create: (body) => fetchApi('/bulk-orders', { method: 'POST', body: JSON.stringify(body) }),
  getTracking: (id) => fetchApi(`/bulk-orders/${id}/tracking`),
  setPaymentMethod: (id, paymentMethod) => fetchApi(`/bulk-orders/${id}/payment-method`, { method: 'PATCH', body: JSON.stringify({ paymentMethod }) }),
  updateStatus: (id, status) => fetchApi(`/bulk-orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  approve: (id) => fetchApi(`/bulk-orders/${id}/approve`, { method: 'PATCH' }),
  reject: (id) => fetchApi(`/bulk-orders/${id}/reject`, { method: 'PATCH' }),
  complete: (id) => fetchApi(`/bulk-orders/${id}/complete`, { method: 'PATCH' }),
  // Legacy aliases
  confirm: (id) => fetchApi(`/bulk-orders/${id}/approve`, { method: 'PATCH' }),
  cancel: (id) => fetchApi(`/bulk-orders/${id}/reject`, { method: 'PATCH' }),
};

// Custom Orders (Admin + User quote flow)
export const customOrdersApi = {
  getMine: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return fetchApi(q ? `/custom-orders?${q}` : '/custom-orders');
  },
  getMineById: (id) => fetchApi(`/custom-orders/${encodeURIComponent(id)}`),
  getAdminAll: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return fetchApi(q ? `/custom-orders/admin?${q}` : '/custom-orders/admin');
  },
  getAdminById: (id) => fetchApi(`/custom-orders/admin/${encodeURIComponent(id)}`),
  review: (id, body) => fetchApi(`/custom-orders/admin/${encodeURIComponent(id)}/review`, { method: 'PATCH', body: JSON.stringify(body) }),
  approve: (id, body) => fetchApi(`/custom-orders/admin/${encodeURIComponent(id)}/approve`, { method: 'PATCH', body: JSON.stringify(body || {}) }),
  reject: (id, body) => fetchApi(`/custom-orders/admin/${encodeURIComponent(id)}/reject`, { method: 'PATCH', body: JSON.stringify(body || {}) }),
  updateStatus: (id, status) => fetchApi(`/custom-orders/admin/${encodeURIComponent(id)}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  sendMessage: (id, body) => fetchApi(`/custom-orders/admin/${encodeURIComponent(id)}/message`, { method: 'POST', body: JSON.stringify(body) }),
  // Existing customer actions
  quote: (id, body) => fetchApi(`/custom-orders/${encodeURIComponent(id)}/quote`, { method: 'PATCH', body: JSON.stringify(body) }),
  accept: (id, body) => fetchApi(`/custom-orders/${encodeURIComponent(id)}/accept`, { method: 'PATCH', body: JSON.stringify(body) }),
  rejectQuote: (id, body) => fetchApi(`/custom-orders/${encodeURIComponent(id)}/reject`, { method: 'PATCH', body: JSON.stringify(body) }),
  confirmPayment: (id, body) => fetchApi(`/custom-orders/${encodeURIComponent(id)}/payment/confirm`, { method: 'POST', body: JSON.stringify(body || {}) }),
  createOrder: (id, body) => fetchApi(`/custom-orders/${encodeURIComponent(id)}/create-order`, { method: 'POST', body: JSON.stringify(body || {}) }),
};

// ──────────────────────────────────────────────
// Inventory
// ──────────────────────────────────────────────
export const inventoryApi = {
  // Product inventory management
  getProductInventory: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return fetchApi(q ? `/inventory/products?${q}` : '/inventory/products');
  },
  getLowStockProducts: () => fetchApi('/inventory/products/low-stock'),
  updateProductStock: (id, body) => fetchApi(`/inventory/products/${id}/stock`, { method: 'PATCH', body: JSON.stringify(body) }),

  // Raw inventory (legacy)
  getAll: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return fetchApi(q ? `/inventory?${q}` : '/inventory');
  },
  getById: (id) => fetchApi(`/inventory/${id}`),
  create: (body) => fetchApi('/inventory', { method: 'POST', body: JSON.stringify(body) }),
  update: (id, body) => fetchApi(`/inventory/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (id) => fetchApi(`/inventory/${id}`, { method: 'DELETE' }),
};

// ──────────────────────────────────────────────
// Notifications
// ──────────────────────────────────────────────
export const notificationsApi = {
  getAll: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return fetchApi(q ? `/notifications?${q}` : '/notifications');
  },
  markRead: (id) => fetchApi(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllRead: () => fetchApi('/notifications/read-all', { method: 'PATCH' }),
};

// ──────────────────────────────────────────────
// Analytics (Admin Dashboard)
// ──────────────────────────────────────────────
export const analyticsApi = {
  getDashboard: () => fetchApi('/analytics/dashboard'),
  getOverview: () => fetchApi('/analytics/overview'),
  getRevenue: (days = 30) => fetchApi(`/analytics/revenue?days=${days}`),
  getTopProducts: (limit = 10) => fetchApi(`/analytics/top-products?limit=${limit}`),
  getOrdersByStatus: () => fetchApi('/analytics/orders-by-status'),
  getCustomerGrowth: (days = 30) => fetchApi(`/analytics/customers?days=${days}`),
  getInventoryStatus: () => fetchApi('/analytics/inventory-status'),
};

// ──────────────────────────────────────────────
// Cart
// ──────────────────────────────────────────────
export const cartApi = {
  getCart: () => fetchApi('/cart'),
  addItem: (productId, quantity = 1) => fetchApi('/cart/items', { method: 'POST', body: JSON.stringify({ productId, quantity }) }),
  updateItem: (itemId, quantity) => fetchApi(`/cart/items/${itemId}`, { method: 'PUT', body: JSON.stringify({ quantity }) }),
  removeItem: (itemId) => fetchApi(`/cart/items/${itemId}`, { method: 'DELETE' }),
  clearCart: () => fetchApi('/cart', { method: 'DELETE' }),
};

const getChatGuestId = () => {
  if (typeof window === 'undefined') return 'guest-server';
  let guestId = localStorage.getItem('chatGuestId');
  if (!guestId) {
    guestId = `guest-${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem('chatGuestId', guestId);
  }
  return guestId;
};

const buildQueryString = (params = {}) => {
  const filtered = {};
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    filtered[key] = value;
  });
  return new URLSearchParams(filtered).toString();
};

const fetchChatApi = async (path, options = {}) => {
  const method = String(options.method || 'GET').toUpperCase();
  const userAuth = JSON.parse(localStorage.getItem('userAuth') || 'null');
  const token = userAuth?.token || null;
  const fallbackUserId = userAuth?.email
    ? `user-${String(userAuth.email).toLowerCase()}`
    : getChatGuestId();

  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  } else {
    headers['x-user-id'] = fallbackUserId;
  }

  const response = await fetch(`${CHAT_API_BASE}${path}`, {
    ...options,
    method,
    headers,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || data.message || data.detail || 'Chat request failed');
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return normalizeChatPayloadUrls(data);
};

const fetchChatMultipartApi = async (path, formData) => {
  const userAuth = JSON.parse(localStorage.getItem('userAuth') || 'null');
  const token = userAuth?.token || null;
  const fallbackUserId = userAuth?.email
    ? `user-${String(userAuth.email).toLowerCase()}`
    : getChatGuestId();

  const headers = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  } else {
    headers['x-user-id'] = fallbackUserId;
  }

  const response = await fetch(`${CHAT_API_BASE}${path}`, {
    method: 'POST',
    headers,
    body: formData,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || data.message || data.detail?.message || data.detail || 'Chat upload failed');
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return normalizeChatPayloadUrls(data);
};

export const chatApi = {
  startSession: (body) => fetchChatApi('/chat/session/start', { method: 'POST', body: JSON.stringify(body) }),
  sendMessage: (body) => fetchChatApi('/chat/message', { method: 'POST', body: JSON.stringify(body) }),
  searchProducts: (params = {}) => {
    const q = buildQueryString(params);
    return fetchChatApi(q ? `/products/search?${q}` : '/products/search');
  },
  getCategories: (params = {}) => {
    const q = buildQueryString(params);
    return fetchChatApi(q ? `/products/categories?${q}` : '/products/categories');
  },
  uploadCustomImage: (file, sessionId = '') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('session_id', sessionId || '');
    return fetchChatMultipartApi('/custom/upload', formData);
  },
  getUploadUrl: (body) => fetchChatApi('/custom/upload-url', { method: 'POST', body: JSON.stringify(body) }),
  submitCustomOrder: (body) => fetchChatApi('/custom/submit', { method: 'POST', body: JSON.stringify(body) }),
  validateCustomDelivery: (body) => fetchChatApi('/custom/delivery-feasibility', { method: 'POST', body: JSON.stringify(body) }),
  getCustomOrderStatus: (id) => fetchChatApi(`/custom/${id}/status`),
  confirmCustomOrder: (id, body) => fetchChatApi(`/custom/${id}/confirm`, { method: 'POST', body: JSON.stringify(body) }),
  retryCustomOrderAnalysis: (id) => fetchChatApi(`/custom/${id}/retry-analysis`, { method: 'POST' }),
  requestSupportHandoff: (body) => fetchChatApi('/support/handoff', { method: 'POST', body: JSON.stringify(body) }),
};
