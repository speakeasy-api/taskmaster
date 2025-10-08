import { taskDependencyTypeEnum } from '$lib/db/schemas/schema';
import z from 'zod';

export const UpdateTaskDependencyTypeRequest = z.object({
  id: z.string().uuid(),
  original_task_id: z.string().uuid(),
  dependency_type: z.string().refine(
    (type) => {
      const baseType = type.replace(':invert', '');
      return (taskDependencyTypeEnum.enumValues as string[]).includes(baseType);
    },
    { message: 'Invalid dependency type' }
  )
});

export const DeleteTaskDependencyRequest = z.object({
  id: z.string().uuid()
});
