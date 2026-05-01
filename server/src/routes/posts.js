import { Router } from 'express';
import { prisma } from '../db.js';
import { optionalAuth, requireAuth } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/requireAdmin.js';
import { commentSchema, parseBody, postSchema } from '../utils/validators.js';

export const postsRouter = Router();

const postSelect = {
  id: true,
  title: true,
  content: true,
  likeCount: true,
  commentCount: true,
  reportCount: true,
  createdAt: true,
  updatedAt: true,
  author: { select: { id: true, username: true, role: true } },
};

postsRouter.get('/', async (req, res, next) => {
  try {
    const page = Math.max(Number(req.query.page || 1), 1);
    const pageSize = Math.min(Math.max(Number(req.query.pageSize || 10), 1), 50);
    const q = String(req.query.q || '').trim();
    const where = {
      isDeleted: false,
      ...(q ? { OR: [{ title: { contains: q } }, { content: { contains: q } }] } : {}),
    };
    const [items, total] = await Promise.all([
      prisma.post.findMany({
        where,
        select: postSelect,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.post.count({ where }),
    ]);
    res.json({ items, total, page, pageSize });
  } catch (error) {
    next(error);
  }
});

postsRouter.post('/', requireAuth, async (req, res, next) => {
  try {
    const data = parseBody(postSchema, req.body);
    const post = await prisma.post.create({
      data: { ...data, authorId: req.user.id },
      select: postSelect,
    });
    res.status(201).json({ post });
  } catch (error) {
    next(error);
  }
});

postsRouter.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const post = await prisma.post.findFirst({
      where: { id, isDeleted: false },
      select: {
        ...postSelect,
        comments: {
          where: { isDeleted: false },
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            content: true,
            createdAt: true,
            author: { select: { id: true, username: true, role: true } },
          },
        },
      },
    });
    if (!post) return res.status(404).json({ error: 'Post not found.' });
    const liked = req.user
      ? Boolean(await prisma.like.findUnique({ where: { userId_postId: { userId: req.user.id, postId: id } } }))
      : false;
    return res.json({ post, liked });
  } catch (error) {
    return next(error);
  }
});

postsRouter.post('/:id/comments', requireAuth, async (req, res, next) => {
  try {
    const postId = Number(req.params.id);
    const data = parseBody(commentSchema, req.body);
    const post = await prisma.post.findFirst({ where: { id: postId, isDeleted: false } });
    if (!post) return res.status(404).json({ error: 'Post not found.' });
    const comment = await prisma.$transaction(async (tx) => {
      const created = await tx.comment.create({
        data: { content: data.content, postId, authorId: req.user.id },
        select: {
          id: true,
          content: true,
          createdAt: true,
          author: { select: { id: true, username: true, role: true } },
        },
      });
      await tx.post.update({ where: { id: postId }, data: { commentCount: { increment: 1 } } });
      return created;
    });
    return res.status(201).json({ comment });
  } catch (error) {
    return next(error);
  }
});

postsRouter.post('/:id/like', requireAuth, async (req, res, next) => {
  try {
    const postId = Number(req.params.id);
    const post = await prisma.post.findFirst({ where: { id: postId, isDeleted: false } });
    if (!post) return res.status(404).json({ error: 'Post not found.' });
    const existing = await prisma.like.findUnique({ where: { userId_postId: { userId: req.user.id, postId } } });
    const result = await prisma.$transaction(async (tx) => {
      if (existing) {
        await tx.like.delete({ where: { id: existing.id } });
        const updated = await tx.post.update({ where: { id: postId }, data: { likeCount: { decrement: 1 } } });
        return { liked: false, likeCount: updated.likeCount };
      }
      await tx.like.create({ data: { userId: req.user.id, postId } });
      const updated = await tx.post.update({ where: { id: postId }, data: { likeCount: { increment: 1 } } });
      return { liked: true, likeCount: updated.likeCount };
    });
    return res.json(result);
  } catch (error) {
    return next(error);
  }
});

postsRouter.delete('/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    await prisma.post.update({ where: { id: Number(req.params.id) }, data: { isDeleted: true } });
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});
