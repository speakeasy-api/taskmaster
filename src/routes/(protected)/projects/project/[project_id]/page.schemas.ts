import { taskStatusEnum } from '$lib/db/schemas/schema';
import z from 'zod';

export const DeleteProjectRequest = z.object({
  id: z.string().uuid('Valid project ID is required')
});
export type DeleteProjectRequest = z.infer<typeof DeleteProjectRequest>;

export const DeleteTaskRequest = z.object({
  id: z.string().uuid('Valid task ID is required')
});
export type DeleteTaskRequest = z.infer<typeof DeleteTaskRequest>;

export const UpdateTaskStatusRequest = z.object({
  id: z.string().uuid(),
  status: z.enum(taskStatusEnum.enumValues).or(z.literal('').transform(() => null))
});
export type UpdateTaskStatusRequest = z.infer<typeof UpdateTaskStatusRequest>;
