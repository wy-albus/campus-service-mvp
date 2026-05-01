import { Router } from 'express';
import { prisma } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/requireAdmin.js';

export const adminRouter = Router();

adminRouter.use(requireAuth, requireAdmin);

adminRouter.get('/reports', async (_req, res, next) => {
  try {
    const reports = await prisma.report.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        reporter: { select: { id: true, username: true, email: true } },
        handledBy: { select: { id: true, username: true } },
      },
    });
    res.json({ reports });
  } catch (error) {
    next(error);
  }
});

adminRouter.post('/reports/:id/handle', async (req, res, next) => {
  try {
    const report = await prisma.report.update({
      where: { id: Number(req.params.id) },
      data: { handled: true, handledById: req.user.id, handledAt: new Date() },
    });
    res.json({ report });
  } catch (error) {
    next(error);
  }
});
