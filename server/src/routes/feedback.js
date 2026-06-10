import { Router } from 'express';
import { prisma } from '../db.js';
import { optionalAuth } from '../middleware/auth.js';
import { feedbackSchema, parseBody } from '../utils/validators.js';

export const feedbackRouter = Router();

feedbackRouter.post('/', optionalAuth, async (req, res, next) => {
  try {
    const data = parseBody(feedbackSchema, req.body);
    const feedback = await prisma.feedback.create({
      data: {
        ...data,
        submitterId: req.user?.id,
      },
      select: { id: true, createdAt: true },
    });
    res.status(201).json({ feedback });
  } catch (error) {
    next(error);
  }
});
