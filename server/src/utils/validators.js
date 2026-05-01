import { z } from 'zod';

export const registerSchema = z.object({
  username: z.string().trim().min(2).max(30),
  email: z.string().trim().email().max(120),
  password: z.string().min(6).max(80),
});

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

export const postSchema = z.object({
  title: z.string().trim().min(2).max(80),
  content: z.string().trim().min(2).max(3000),
});

export const commentSchema = z.object({
  content: z.string().trim().min(1).max(1000),
});

export const reportSchema = z.object({
  targetType: z.enum(['POST', 'COMMENT']),
  targetId: z.coerce.number().int().positive(),
  reason: z.string().trim().min(2).max(500),
});

export function parseBody(schema, body) {
  const result = schema.safeParse(body);
  if (!result.success) {
    const message = result.error.issues.map((issue) => issue.message).join('; ');
    const error = new Error(message || 'Invalid request body');
    error.status = 400;
    throw error;
  }
  return result.data;
}
