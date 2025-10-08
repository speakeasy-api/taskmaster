import { form, getRequestEvent, query } from '$app/server';
import { taskDependencies, taskDependencyTypeEnum } from '$lib/db/schemas/schema';
import { AddRelationForm, GetTasksRequest } from './AddRelationModal.schemas';

export const getTasks = query(GetTasksRequest, async (params) => {
  const { locals } = getRequestEvent();
  const { projectId, excludeTaskIds = [] } = params;

  const result = await locals.db.query.tasks.findMany({
    where: (table, { eq, and, not }) =>
      and(eq(table.project_id, projectId), ...excludeTaskIds.map((id) => not(eq(table.id, id))))
  });

  return result;
});

export const addRelationForm = form(AddRelationForm, async (data) => {
  const { locals } = getRequestEvent();

  const { related_task_id: relatedTaskId, task_id: taskId, dependency_type: dependencyType } = data;

  let insertObj: typeof taskDependencies.$inferInsert;
  if (dependencyType.endsWith(':invert')) {
    insertObj = {
      task_id: relatedTaskId,
      depends_on_task_id: taskId,
      dependency_type: dependencyType.replace(
        ':invert',
        ''
      ) as (typeof taskDependencyTypeEnum.enumValues)[number]
    };
  } else {
    insertObj = {
      task_id: taskId,
      depends_on_task_id: relatedTaskId,
      dependency_type: dependencyType as (typeof taskDependencyTypeEnum.enumValues)[number]
    };
  }

  // if (data.dependency_type.endsWith(':invert')) {
  //   data.task_id = data.related_task_id;
  //   data.related_task_id = page.params.task_id!;
  //   data.dependency_type = data.dependency_type.replace(
  //     ':invert',
  //     ''
  //   ) as AddRelationForm['dependency_type'];
  // } else {
  //   data.task_id = page.params.task_id!;
  //   console.log(data);
  // }

  try {
    await locals.db.insert(taskDependencies).values(insertObj);
  } catch (error) {
    console.error('Error adding relation:', error);
    return { success: false, errors: { form: ['Failed to add relation. Please try again.'] } };
  }

  return { success: true };
});
