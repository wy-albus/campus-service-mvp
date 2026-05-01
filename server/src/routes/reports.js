import { Router } from 'express';
import { prisma } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { parseBody, reportSchema } from '../utils/validators.js';

export const reportsRouter = Router();

reportsRouter.post('/', requireAuth, async (req, res, next) => {
  try {
    const data = parseBody(reportSchema, req.body);
    if (data.targetType === 'POST') {
      const post = await prisma.post.findFirst({ where: { id: data.targetId, isDeleted: false } });
      if (!post) return res.status(404).json({ error: 'Post not found.' });
    } else {
      const comment = await prisma.comment.findFirst({ where: { id: data.targetId, isDeleted: false } });
      if (!comment) return res.status(404).json({ error: 'Comment not found.' });
    }
    const report = await prisma.$transaction(async (tx) => {
      const created = await tx.report.create({
        data: { ...data, reporterId: req.user.id },
      });
      if (data.targetType === 'POST') {
        await tx.post.update({ where: { id: data.targetId }, data: { reportCount: { increment: 1 } } });
      }
      return created;
    });
    res.status(201).json({ report });
  } catch (error) {
    next(error);
  }
});
