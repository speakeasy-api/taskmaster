import { form, getRequestEvent, query } from '$app/server';
import { db } from '$lib/db';
import { taskDepedencyTypeEnum, taskDependencies } from '$lib/db/schemas/schema';
import { validateForm } from '$lib/util.server';
import z from 'zod';

const GetTasksRequest = z.object({
  projectId: z.string().uuid(),
  excludeTaskIds: z.string().uuid().array().optional()
});

export const getTasks = query(GetTasksRequest, async (params) => {
  const { locals } = getRequestEvent();
  const { user } = await locals.validateSession();
  const { projectId, excludeTaskIds = [] } = params;

  const result = await db.query.tasks.findMany({
    where: (table, { eq, and, not }) =>
      and(
        eq(table.created_by, user.id),
        eq(table.project_id, projectId),
        ...excludeTaskIds.map((id) => not(eq(table.id, id)))
      )
  });

  return result;
});

const AddRelationForm = z.object({
  task_id: z.string().uuid(),
  related_task_id: z.string().uuid(),
  dependency_type: z.enum(taskDepedencyTypeEnum.enumValues)
});

export const addRelationForm = form(async (formData) => {
  const { locals } = getRequestEvent();
  const { user } = await locals.validateSession();

  const validatedReq = validateForm(formData, AddRelationForm);

  if (!validatedReq.success) {
    return { success: false, errors: validatedReq.error.formErrors };
  }

  const {
    related_task_id: relatedTaskId,
    task_id: taskId,
    dependency_type: dependencyType
  } = validatedReq.data;

  await db.insert(taskDependencies).values({
    task_id: taskId,
    depends_on_task_id: relatedTaskId,
    dependency_type: dependencyType,
    created_by: user.id
  });

  return { success: true };
});
