import { z } from 'zod';

export const contentStatusSchema = z.enum(['draft', 'published', 'archived']);
export const classLevelSchema = z.union([
  z.literal(9),
  z.literal(10),
  z.literal(11),
  z.literal(12),
]);

export const chapterInputSchema = z.object({
  classLevel: z.coerce.number().pipe(classLevelSchema),
  title: z.string().trim().min(2, 'Title must be at least 2 characters').max(150, 'Title cannot exceed 150 characters'),
  order: z.coerce.number().int().min(1, 'Order must be at least 1').optional(),
  status: contentStatusSchema.default('draft'),
});

export const chapterStatusSchema = z.object({
  status: contentStatusSchema,
});

export const chapterReorderSchema = z.object({
  classLevel: classLevelSchema,
  orderedIds: z.array(z.number().int()).min(1, 'At least one chapter ID required'),
});

export type ChapterFormValues = z.infer<typeof chapterInputSchema>;
