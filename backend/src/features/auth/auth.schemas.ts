import { z } from 'zod';

export const sessionSchema = z.object({
  displayName: z.string().trim().min(1).max(120).optional()
});

export type SessionInput = z.infer<typeof sessionSchema>;
