import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { loginSchema, parseBody, registerSchema } from '../utils/validators.js';

export const authRouter = Router();

function signToken(user) {
  return jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

function publicUser(user) {
  return { id: user.id, username: user.username, email: user.email, role: user.role, createdAt: user.createdAt };
}

authRouter.post('/register', async (req, res, next) => {
  try {
    const data = parseBody(registerSchema, req.body);
    const passwordHash = await bcrypt.hash(data.password, 12);
    const user = await prisma.user.create({
      data: { username: data.username, email: data.email.toLowerCase(), passwordHash },
    });
    res.status(201).json({ token: signToken(user), user: publicUser(user) });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Username or email already exists.' });
    }
    return next(error);
  }
});

authRouter.post('/login', async (req, res, next) => {
  try {
    const data = parseBody(loginSchema, req.body);
    const user = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() } });
    if (!user || !(await bcrypt.compare(data.password, user.passwordHash))) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }
    return res.json({ token: signToken(user), user: publicUser(user) });
  } catch (error) {
    return next(error);
  }
});

authRouter.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});
