import { z } from 'zod';

export const forumTags = [
  '学习',
  '吐槽',
  '活动',
  '比赛',
  '旅游',
  '情感',
  '美食',
  '求助',
  '失物招领',
  '校园生活',
  '经验分享',
  '闲聊',
];

export const registerSchema = z.object({
  username: z.string().trim().min(2).max(30),
  email: z.string().trim().email().max(120),
  password: z.string().min(6).max(80),
});

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

const optionalUniversity = z
  .union([z.literal(''), z.string().trim().min(2).max(80)])
  .optional()
  .transform((value) => value || undefined);

const optionalImageUrl = z
  .union([z.literal(''), z.string().trim().url().max(500)])
  .optional()
  .transform((value) => value || undefined);

export const postSchema = z.object({
  title: z.string().trim().min(2).max(80),
  content: z.string().trim().min(2).max(3000),
  tag: z.enum(forumTags),
  university: optionalUniversity,
  imageUrl: optionalImageUrl,
});

export const universityAreaSchema = z.object({
  name: z.string().trim().min(2).max(80),
  city: z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? '' : value),
    z.string().trim().max(40).default(''),
  ),
  description: z.string().trim().min(6).max(600),
});

export const commentSchema = z.object({
  content: z.string().trim().min(1).max(1000),
});

export const reportSchema = z.object({
  targetType: z.enum(['POST', 'COMMENT']),
  targetId: z.coerce.number().int().positive(),
  reason: z.string().trim().min(2).max(500),
});

export const feedbackSchema = z.object({
  name: z.string().trim().max(40).default(''),
  contact: z.string().trim().max(120).default(''),
  content: z.string().trim().min(4).max(1200),
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
