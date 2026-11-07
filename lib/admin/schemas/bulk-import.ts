import { z } from 'zod';
import { difficultySchema, optionKeySchema } from './question';

export const bulkImportRowSchema = z.object({
  text: z.string().trim().min(3, 'Question text must have at least 3 characters'),
  options: z.object({
    A: z.string().trim().min(1, 'Option A is required'),
    B: z.string().trim().min(1, 'Option B is required'),
    C: z.string().trim().min(1, 'Option C is required'),
    D: z.string().trim().min(1, 'Option D is required'),
  }),
  correct: optionKeySchema,
  explanation: z.string().trim().optional(),
  difficulty: difficultySchema.optional(),
  topic: z.string().trim().optional(),
  marks: z.coerce.number().int().min(1).max(20).optional(),
});

export const bulkImportRequestSchema = z.object({
  chapterId: z.coerce.number().int().positive('Valid chapter ID required'),
  rows: z.array(bulkImportRowSchema).min(1, 'At least 1 row required').max(500, 'Maximum 500 rows allowed per import'),
});

export type BulkImportFormValues = z.infer<typeof bulkImportRequestSchema>;
