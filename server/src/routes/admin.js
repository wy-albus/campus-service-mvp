import { Router } from 'express';
import { prisma } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/requireAdmin.js';

export const adminRouter = Router();

adminRouter.use(requireAuth, requireAdmin);

function excerpt(value, length = 120) {
  if (!value) return '';
  return value.length > length ? `${value.slice(0, length)}...` : value;
}

adminRouter.get('/reports', async (_req, res, next) => {
  try {
    const reports = await prisma.report.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        reporter: { select: { id: true, username: true, email: true } },
        handledBy: { select: { id: true, username: true } },
      },
    });
    const postIds = reports.filter((report) => report.targetType === 'POST').map((report) => report.targetId);
    const commentIds = reports.filter((report) => report.targetType === 'COMMENT').map((report) => report.targetId);
    const [posts, comments] = await Promise.all([
      prisma.post.findMany({
        where: { id: { in: postIds } },
        select: { id: true, title: true, content: true, isDeleted: true, author: { select: { username: true } } },
      }),
      prisma.comment.findMany({
        where: { id: { in: commentIds } },
        select: { id: true, content: true, postId: true, isDeleted: true, author: { select: { username: true } } },
      }),
    ]);
    const postMap = new Map(posts.map((post) => [post.id, post]));
    const commentMap = new Map(comments.map((comment) => [comment.id, comment]));
    const enriched = reports.map((report) => {
      const target = report.targetType === 'POST' ? postMap.get(report.targetId) : commentMap.get(report.targetId);
      return {
        ...report,
        target: target
          ? {
              id: target.id,
              postId: 'postId' in target ? target.postId : target.id,
              title: 'title' in target ? target.title : '',
              excerpt: excerpt(target.content),
              isDeleted: target.isDeleted,
              author: target.author,
            }
          : null,
      };
    });
    res.json({ reports: enriched });
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

adminRouter.post('/reports/:id/delete-target', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const report = await prisma.report.findUnique({ where: { id } });
    if (!report) return res.status(404).json({ error: 'Report not found.' });

    await prisma.$transaction(async (tx) => {
      if (report.targetType === 'POST') {
        await tx.post.update({ where: { id: report.targetId }, data: { isDeleted: true } });
      } else {
        const comment = await tx.comment.findUnique({ where: { id: report.targetId } });
        if (!comment || comment.isDeleted) throw Object.assign(new Error('Comment not found.'), { status: 404 });
        await tx.comment.update({ where: { id: report.targetId }, data: { isDeleted: true } });
        await tx.post.update({ where: { id: comment.postId }, data: { commentCount: { decrement: 1 } } });
      }
      await tx.report.update({
        where: { id },
        data: { handled: true, handledById: req.user.id, handledAt: new Date() },
      });
    });
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

adminRouter.get('/feedback', async (_req, res, next) => {
  try {
    const feedback = await prisma.feedback.findMany({
      orderBy: { createdAt: 'desc' },
      include: { submitter: { select: { id: true, username: true, email: true } } },
    });
    res.json({ feedback });
  } catch (error) {
    next(error);
  }
});

adminRouter.post('/feedback/:id/handle', async (req, res, next) => {
  try {
    const feedback = await prisma.feedback.update({
      where: { id: Number(req.params.id) },
      data: { handled: true, handledAt: new Date() },
    });
    res.json({ feedback });
  } catch (error) {
    next(error);
  }
});
