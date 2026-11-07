import { z } from 'zod';

export const roleSchema = z.enum(['student', 'staff', 'admin']);
export const accountStatusSchema = z.enum(['active', 'suspended']);

export const updateUserRoleSchema = z.object({
  role: roleSchema,
});

export const updateUserStatusSchema = z.object({
  status: accountStatusSchema,
});
