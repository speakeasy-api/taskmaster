import z from 'zod';
import { taskStatusEnum } from '$lib/db/schemas/schema';

// Project schemas
export const CreateProjectRequest = z.object({
  name: z.string().min(1, 'Project name is required'),
  description: z.string().min(1, 'Project description is required')
});
export type CreateProjectRequest = z.infer<typeof CreateProjectRequest>;

export const DeleteProjectRequest = z.object({
  id: z.string().uuid('Valid project ID is required')
});
export type DeleteProjectRequest = z.infer<typeof DeleteProjectRequest>;

// Task schemas
export const CreateTaskRequest = z.object({
  title: z.string().min(1, 'Task title is required'),
  description: z.string().min(1, 'Task description is required'),
  project_id: z.string().uuid('Valid project ID is required')
});
export type CreateTaskRequest = z.infer<typeof CreateTaskRequest>;

export const DeleteTaskRequest = z.object({
  id: z.string().uuid('Valid task ID is required')
});
export type DeleteTaskRequest = z.infer<typeof DeleteTaskRequest>;

export const UpdateTaskStatusRequest = z.object({
  id: z.string().uuid(),
  status: z.enum(taskStatusEnum.enumValues).or(z.literal('').transform(() => null))
});
export type UpdateTaskStatusRequest = z.infer<typeof UpdateTaskStatusRequest>;
