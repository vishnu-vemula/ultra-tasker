import { z } from 'zod';

export const listTagsQuerySchema = z.object({});

export const createTagSchema = z.object({
  name: z.string().trim().min(1).max(40),
  color: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Color must be a hex value like #6366f1')
    .optional()
});

export const updateTagSchema = createTagSchema.partial();

export type CreateTagInput = z.infer<typeof createTagSchema>;
export type UpdateTagInput = z.infer<typeof updateTagSchema>;
