import { form, getRequestEvent } from '$app/server';
import { SQL_NOW } from '$lib/db/helpers';
import { taskDependencyTypeEnum, taskDependencies } from '$lib/db/schemas/schema';
import { and, eq, type InferEnum } from 'drizzle-orm';
import {
  DeleteTaskDependencyRequest,
  UpdateTaskDependencyTypeRequest
} from './RelationDropdownMenu.schemas';

// Single function to parse dependency type
function parseDependencyType(type: string) {
  const isInverted = type.endsWith(':invert');
  const baseType = type.replace(':invert', '') as InferEnum<typeof taskDependencyTypeEnum>;

  return { isInverted, baseType };
}

export const updateDependencyTypeForm = form(UpdateTaskDependencyTypeRequest, async (data) => {
  const { locals } = getRequestEvent();
  const { user } = await locals.validateSession();

  const { id, original_task_id, dependency_type } = data;

  // Fetch existing dependency
  const existingDependency = await locals.db.query.taskDependencies.findFirst({
    where: eq(taskDependencies.id, id)
  });

  if (!existingDependency) {
    return {
      success: false,
      errors: { id: ['Dependency not found or no permission to update.'] }
    };
  }

  // Determine if we need to swap task relationships
  const { isInverted, baseType } = parseDependencyType(dependency_type);
  const currentlyInverted = existingDependency.depends_on_task_id === original_task_id;
  const shouldSwap = isInverted !== currentlyInverted;

  // Set up the new relationship
  const updates = {
    dependency_type: baseType,
    task_id: shouldSwap ? existingDependency.depends_on_task_id : existingDependency.task_id,
    depends_on_task_id: shouldSwap
      ? existingDependency.task_id
      : existingDependency.depends_on_task_id
  };

  // Update the dependency
  const result = await locals.db
    .update(taskDependencies)
    .set({ ...updates, updated_at: SQL_NOW })
    .where(and(eq(taskDependencies.created_by, user.id), eq(taskDependencies.id, id)));

  // Handle result
  if (result.rowCount === 0) {
    locals.sendFlashMessage({
      title: 'Error',
      description: 'There was an error updating the dependency type.'
    });
    return {
      success: false,
      errors: { id: ['Failed to update the dependency type.'] }
    };
  }

  locals.sendFlashMessage({
    title: 'Dependency updated',
    description: 'The dependency type has been updated.'
  });

  return { success: true };
});

export const deleteTaskDependencyForm = form(DeleteTaskDependencyRequest, async (data) => {
  const { locals } = getRequestEvent();
  const { user } = await locals.validateSession();

  const { id } = data;

  const result = await locals.db
    .delete(taskDependencies)
    .where(and(eq(taskDependencies.created_by, user.id), eq(taskDependencies.id, id)));

  if (result.rowCount === 0) {
    return {
      success: false,
      errors: { taskId: ['Task not found or you do not have permission to delete it.'] }
    };
  }

  locals.sendFlashMessage({
    title: 'Relation deleted',
    description: 'The relation has been deleted.'
  });

  return { success: true };
});
