const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const fetchApi = async (path, options = {}) => {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
};

export const authApi = {
  register: (body) => fetchApi('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => fetchApi('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
};

export const usersApi = {
  getAll: () => fetchApi('/users'),
  getByEmail: (email) => fetchApi(`/users/${encodeURIComponent(email)}`),
  update: (email, body) => fetchApi(`/users/${encodeURIComponent(email)}`, { method: 'PUT', body: JSON.stringify(body) }),
};

export const productsApi = {
  getAll: () => fetchApi('/products'),
  getById: (id) => fetchApi(`/products/${id}`),
  create: (body) => fetchApi('/products', { method: 'POST', body: JSON.stringify(body) }),
  update: (id, body) => fetchApi(`/products/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (id) => fetchApi(`/products/${id}`, { method: 'DELETE' }),
};

export const ordersApi = {
  getAll: () => fetchApi('/orders'),
  create: (body) => fetchApi('/orders', { method: 'POST', body: JSON.stringify(body) }),
  markViewed: () => fetchApi('/orders/mark-viewed', { method: 'PATCH' }),
};

export const bulkOrdersApi = {
  getAll: (status) => fetchApi(status ? `/bulk-orders?status=${status}` : '/bulk-orders'),
  create: (body) => fetchApi('/bulk-orders', { method: 'POST', body: JSON.stringify(body) }),
  confirm: (id) => fetchApi(`/bulk-orders/${id}/confirm`, { method: 'PATCH' }),
  cancel: (id) => fetchApi(`/bulk-orders/${id}/cancel`, { method: 'PATCH' }),
};

export const inventoryApi = {
  getAll: (params) => {
    const q = new URLSearchParams(params).toString();
    return fetchApi(q ? `/inventory?${q}` : '/inventory');
  },
  getById: (id) => fetchApi(`/inventory/${id}`),
  create: (body) => fetchApi('/inventory', { method: 'POST', body: JSON.stringify(body) }),
  update: (id, body) => fetchApi(`/inventory/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (id) => fetchApi(`/inventory/${id}`, { method: 'DELETE' }),
};

export const notificationsApi = {
  getByEmail: (email) => fetchApi(`/notifications/${encodeURIComponent(email)}`),
  markRead: (id) => fetchApi(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllRead: (email) => fetchApi(`/notifications/mark-all-read/${encodeURIComponent(email)}`, { method: 'PATCH' }),
};
