import { Router } from 'express';
import { prisma } from '../db.js';
import { optionalAuth, requireAuth } from '../middleware/auth.js';
import { parseBody, universityAreaSchema } from '../utils/validators.js';

export const universitiesRouter = Router();

const areaSelect = {
  id: true,
  name: true,
  city: true,
  description: true,
  creatorId: true,
  createdAt: true,
  updatedAt: true,
};

universitiesRouter.get('/', optionalAuth, async (_req, res, next) => {
  try {
    const areas = await prisma.universityArea.findMany({
      select: areaSelect,
      orderBy: { createdAt: 'asc' },
    });

    const postCounts = await prisma.post.groupBy({
      by: ['university'],
      where: { isDeleted: false, university: { not: null } },
      _count: { _all: true },
    });

    const countMap = new Map(postCounts.map((item) => [item.university, item._count._all]));
    res.json({
      items: areas.map((area) => ({
        ...area,
        postCount: countMap.get(area.name) || 0,
      })),
    });
  } catch (error) {
    next(error);
  }
});

universitiesRouter.post('/', requireAuth, async (req, res, next) => {
  try {
    const data = parseBody(universityAreaSchema, req.body);
    const area = await prisma.universityArea.create({
      data: { ...data, creatorId: req.user.id },
      select: areaSelect,
    });
    res.status(201).json({ area: { ...area, postCount: 0 } });
  } catch (error) {
    if (error.code === 'P2002') {
      error.status = 409;
      error.message = '这个大学话题区已经存在。';
    }
    next(error);
  }
});
