import jwt from 'jsonwebtoken';

let wss = null;
const clientsByEmail = new Map();
const clientsByUserId = new Map();

const addClient = (map, key, ws) => {
  if (!key) return;
  const normalized = String(key).toLowerCase();
  if (!map.has(normalized)) map.set(normalized, new Set());
  map.get(normalized).add(ws);
};

const removeClient = (map, key, ws) => {
  if (!key) return;
  const normalized = String(key).toLowerCase();
  const set = map.get(normalized);
  if (!set) return;
  set.delete(ws);
  if (set.size === 0) map.delete(normalized);
};

const safeSend = (ws, payload) => {
  if (!ws || ws.readyState !== 1) return;
  try {
    ws.send(payload);
  } catch {
    // Ignore send failures on closed sockets
  }
};

export const initNotificationRealtime = async (server) => {
  try {
    const wsModule = await import('ws');
    const { WebSocketServer } = wsModule;

    wss = new WebSocketServer({ server, path: '/ws/notifications' });

    wss.on('connection', (ws, req) => {
      try {
        const url = new URL(req.url, 'http://localhost');
        const token = url.searchParams.get('token');
        if (!token) {
          ws.close(1008, 'Missing token');
          return;
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const email = decoded?.email ? String(decoded.email).toLowerCase() : '';
        const userId = decoded?.id ? String(decoded.id) : '';

        addClient(clientsByEmail, email, ws);
        addClient(clientsByUserId, userId, ws);

        safeSend(ws, JSON.stringify({ type: 'connected' }));

        ws.on('close', () => {
          removeClient(clientsByEmail, email, ws);
          removeClient(clientsByUserId, userId, ws);
        });
      } catch {
        ws.close(1008, 'Invalid token');
      }
    });

    console.log('Realtime notifications enabled on /ws/notifications');
  } catch (err) {
    console.warn(`Realtime notifications disabled (${err.message}). Polling fallback remains available.`);
  }
};

export const publishNotification = (notification) => {
  if (!wss || !notification) return;

  const payload = JSON.stringify({
    type: 'notification',
    notification,
  });

  const email = notification.customerEmail ? String(notification.customerEmail).toLowerCase() : '';
  const userId = notification.userId ? String(notification.userId).toLowerCase() : '';

  const emailClients = clientsByEmail.get(email) || new Set();
  const userClients = clientsByUserId.get(userId) || new Set();

  const targets = new Set([...emailClients, ...userClients]);
  targets.forEach((ws) => safeSend(ws, payload));
};
