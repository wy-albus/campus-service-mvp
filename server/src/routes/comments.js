import { Router } from 'express';
import { prisma } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/requireAdmin.js';

export const commentsRouter = Router();

commentsRouter.delete('/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const comment = await prisma.comment.findUnique({ where: { id } });
    if (!comment || comment.isDeleted) return res.status(404).json({ error: 'Comment not found.' });
    await prisma.$transaction([
      prisma.comment.update({ where: { id }, data: { isDeleted: true } }),
      prisma.post.update({ where: { id: comment.postId }, data: { commentCount: { decrement: 1 } } }),
    ]);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});
