import { z } from 'zod';
import { contentStatusSchema, classLevelSchema } from './chapter';
import { htmlToPlainText } from '../chemFormat';

export const difficultySchema = z.enum(['easy', 'medium', 'hard']);
export const optionKeySchema = z.enum(['A', 'B', 'C', 'D']);

const MAX_HTML_PLAIN = 5000;

export const questionInputSchema = z.object({
  chapterId: z.coerce.number().int().positive('Please select a valid chapter'),
  text: z.string().min(1, 'Question text is required').refine((val) => {
    const plain = htmlToPlainText(val);
    return plain.length >= 3;
  }, 'Question text must contain at least 3 characters'),
  options: z.object({
    A: z.string().min(1, 'Option A is required').refine((val) => {
      const plain = htmlToPlainText(val);
      return plain.length > 0 || /<img[\s>]/i.test(val);
    }, 'Option A must have text or an image'),
    B: z.string().min(1, 'Option B is required').refine((val) => {
      const plain = htmlToPlainText(val);
      return plain.length > 0 || /<img[\s>]/i.test(val);
    }, 'Option B must have text or an image'),
    C: z.string().min(1, 'Option C is required').refine((val) => {
      const plain = htmlToPlainText(val);
      return plain.length > 0 || /<img[\s>]/i.test(val);
    }, 'Option C must have text or an image'),
    D: z.string().min(1, 'Option D is required').refine((val) => {
      const plain = htmlToPlainText(val);
      return plain.length > 0 || /<img[\s>]/i.test(val);
    }, 'Option D must have text or an image'),
  }),
  correct: optionKeySchema,
  explanation: z.string().default(''),
  difficulty: difficultySchema.default('easy'),
  topic: z.string().trim().max(100, 'Topic must not exceed 100 characters').default(''),
  marks: z.coerce.number().int().min(1, 'Marks must be at least 1').max(20, 'Marks cannot exceed 20').default(1),
  status: contentStatusSchema.default('draft'),
  questionImageUrl: z.string().nullable().default(null),
});

export type QuestionFormValues = z.infer<typeof questionInputSchema>;
