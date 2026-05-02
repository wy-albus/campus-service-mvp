import { Router } from 'express';
import { prisma } from '../db.js';

export const usersRouter = Router();

const publicPostSelect = {
  id: true,
  title: true,
  content: true,
  tag: true,
  imageUrl: true,
  university: true,
  viewCount: true,
  likeCount: true,
  commentCount: true,
  createdAt: true,
  updatedAt: true,
};

usersRouter.get('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            posts: { where: { isDeleted: false } },
            comments: { where: { isDeleted: false } },
          },
        },
        posts: {
          where: { isDeleted: false },
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: publicPostSelect,
        },
      },
    });

    if (!user) return res.status(404).json({ error: 'User not found.' });

    return res.json({
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        createdAt: user.createdAt,
        bio: '这个人还没有填写简介',
        postCount: user._count.posts,
        replyCount: user._count.comments,
        recentPosts: user.posts,
      },
    });
  } catch (error) {
    return next(error);
  }
});

usersRouter.get('/:id/posts', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const posts = await prisma.post.findMany({
      where: { authorId: id, isDeleted: false },
      orderBy: { createdAt: 'desc' },
      select: publicPostSelect,
    });
    return res.json({ posts });
  } catch (error) {
    return next(error);
  }
});
