import z from 'zod';

export const CreateProjectRequest = z.object({
  name: z.string().min(1, 'Project name is required'),
  description: z.string().min(1, 'Project description is required')
});
export type CreateProjectRequest = z.infer<typeof CreateProjectRequest>;
