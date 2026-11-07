import { z } from 'zod';
import { contentStatusSchema } from './chapter';

export const reactionComponentSchema = z.object({
  moleculeId: z.coerce.number().int().positive('Please select a molecule'),
  coefficient: z.coerce.number().int('Coefficient must be an integer').min(1, 'Minimum coefficient is 1').max(20, 'Maximum coefficient is 20').default(1),
});

export const reactionInputSchema = z.object({
  name: z.string().trim().min(2, 'Reaction name must be at least 2 characters').max(150, 'Name too long'),
  category: z.enum(['organic', 'inorganic']),
  description: z.string().max(2000, 'Description too long').default(''),
  conditions: z.string().max(255, 'Conditions too long').default(''),
  reactants: z.array(reactionComponentSchema).min(1, 'Add at least one reactant'),
  products: z.array(reactionComponentSchema).min(1, 'Add at least one product'),
  status: contentStatusSchema.default('draft'),
});

export type ReactionFormValues = z.infer<typeof reactionInputSchema>;
