import z from 'zod';

export const DeleteApplicationRequest = z.object({
  id: z.string().min(1, 'ID is required')
});
export type DeleteApplicationRequest = z.infer<typeof DeleteApplicationRequest>;
