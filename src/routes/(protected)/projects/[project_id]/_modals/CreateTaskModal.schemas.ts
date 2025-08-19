import z from 'zod';

export const CreateTaskRequest = z.object({
  title: z.string().min(1, 'Task title is required'),
  description: z.string().min(1, 'Task description is required'),
  project_id: z.string().uuid('Valid project ID is required')
});
export type CreateTaskRequest = z.infer<typeof CreateTaskRequest>;
