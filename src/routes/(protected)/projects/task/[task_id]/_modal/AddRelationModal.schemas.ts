import z from 'zod';

export const GetTasksRequest = z.object({
  projectId: z.string().uuid(),
  excludeTaskIds: z.string().uuid().array().optional()
});
export type GetTasksRequest = z.infer<typeof GetTasksRequest>;

export const AddRelationForm = z.object({
  task_id: z.string().uuid(),
  related_task_id: z.string().uuid(),
  dependency_type: z.enum([
    'blocks',
    'duplicates',
    'duplicates',
    'blocks:invert',
    'relates_to:invert'
  ])
});
export type AddRelationForm = z.infer<typeof AddRelationForm>;
