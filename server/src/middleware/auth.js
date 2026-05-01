import jwt from 'jsonwebtoken';
import { prisma } from '../db.js';

export async function optionalAuth(req, _res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return next();

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, username: true, email: true, role: true, createdAt: true },
    });
    req.user = user || undefined;
    return next();
  } catch {
    return next();
  }
}

export async function requireAuth(req, res, next) {
  await optionalAuth(req, res, () => undefined);
  if (!req.user) {
    return res.status(401).json({ error: 'Please login first.' });
  }
  return next();
}
