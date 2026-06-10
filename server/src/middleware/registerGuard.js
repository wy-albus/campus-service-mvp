const ipAttempts = new Map();
const emailAttempts = new Map();

const WINDOW_MS = 60 * 60 * 1000;
const IP_LIMIT = 5;
const EMAIL_LIMIT = 3;

function cleanup(store, now) {
  for (const [key, value] of store.entries()) {
    if (now - value.firstAt > WINDOW_MS) {
      store.delete(key);
    }
  }
}

function hit(store, key, limit, now) {
  const existing = store.get(key);
  if (!existing || now - existing.firstAt > WINDOW_MS) {
    store.set(key, { count: 1, firstAt: now });
    return false;
  }
  existing.count += 1;
  return existing.count > limit;
}

function getClientIp(req) {
  const forwarded = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return forwarded || req.ip || req.socket?.remoteAddress || 'unknown';
}

export function registerGuard(req, res, next) {
  const now = Date.now();
  cleanup(ipAttempts, now);
  cleanup(emailAttempts, now);

  const ip = getClientIp(req);
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';

  if (hit(ipAttempts, ip, IP_LIMIT, now)) {
    return res.status(429).json({ error: 'Too many registrations from this network. Please try again later.' });
  }
  if (email && hit(emailAttempts, email, EMAIL_LIMIT, now)) {
    return res.status(429).json({ error: 'Too many registration attempts for this email. Please try again later.' });
  }

  return next();
}
