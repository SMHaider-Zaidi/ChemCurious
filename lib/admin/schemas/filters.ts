import { z } from 'zod';
import { classLevelSchema, contentStatusSchema } from './chapter';
import { difficultySchema } from './question';
import { roleSchema, accountStatusSchema } from './user';

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const chapterFilterSchema = z.object({
  classLevel: classLevelSchema.optional(),
  status: contentStatusSchema.optional(),
  q: z.string().optional(),
});

export const questionFilterSchema = paginationQuerySchema.extend({
  chapterId: z.coerce.number().int().optional(),
  status: contentStatusSchema.optional(),
  difficulty: difficultySchema.optional(),
  topic: z.string().optional(),
  q: z.string().optional(),
});

export const reactionFilterSchema = paginationQuerySchema.extend({
  category: z.enum(['organic', 'inorganic']).optional(),
  status: contentStatusSchema.optional(),
  q: z.string().optional(),
});

export const moleculeFilterSchema = paginationQuerySchema.extend({
  category: z.string().optional(),
  status: contentStatusSchema.optional(),
  q: z.string().optional(),
});

export const studentFilterSchema = paginationQuerySchema.extend({
  classLevel: classLevelSchema.optional(),
  institution: z.string().optional(),
  activeWithin: z.union([z.literal(7), z.literal(30)]).optional(),
  sort: z.string().optional(),
  q: z.string().optional(),
});

export const leaderboardFilterSchema = z.object({
  metric: z.enum(['points', 'average', 'attempts']).default('points'),
  classLevel: classLevelSchema.optional(),
  chapterId: z.coerce.number().int().optional(),
  period: z.enum(['7d', '30d', 'all']).default('all'),
  institution: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

export const analyticsFilterSchema = z.object({
  classLevel: classLevelSchema.optional(),
  chapterId: z.coerce.number().int().optional(),
  period: z.enum(['7d', '30d', 'all']).default('30d'),
});

export const userFilterSchema = paginationQuerySchema.extend({
  role: roleSchema.optional(),
  status: accountStatusSchema.optional(),
  q: z.string().optional(),
});

export const auditLogFilterSchema = paginationQuerySchema.extend({
  entityType: z.string().optional(),
  action: z.string().optional(),
  actorId: z.coerce.number().int().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  q: z.string().optional(),
});
