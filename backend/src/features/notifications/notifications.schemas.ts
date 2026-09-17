import { z } from 'zod';

export const markReadSchema = z
  .object({
    ids: z.array(z.string().min(1)).min(1).max(200).optional(),
    all: z.boolean().optional()
  })
  .refine((input) => Boolean(input.ids?.length) || input.all === true, {
    message: 'Provide ids or all: true'
  });

export type MarkReadInput = z.infer<typeof markReadSchema>;
