import { db } from '$lib/db';
import type { oauthAccessTokens } from '$lib/db/schemas/auth';
import type { InferSelectModel } from 'drizzle-orm';
import { tasks, taskDependencies } from '$lib/db/schemas/schema.js';
import { eq, and } from 'drizzle-orm';

export async function validateAuthHeader(
  authHeader: string | null
): Promise<InferSelectModel<typeof oauthAccessTokens> | false> {
  if (!authHeader) return false;
  if (!authHeader.startsWith('Bearer ')) return false;

  const parts = authHeader.split(' ');

  if (parts.length !== 2) return false;
  const providedToken = parts[1];

  const storedToken = await db.query.oauthAccessTokens.findFirst({
    where: (table, { eq }) => eq(table.accessToken, providedToken)
  });
  if (!storedToken) return false;

  return storedToken;
}

export async function validateTaskOwnership(
  taskId: string,
  userId: string
): Promise<InferSelectModel<typeof tasks> | null> {
  const task = await db.query.tasks.findFirst({
    where: and(eq(tasks.id, taskId), eq(tasks.created_by, userId))
  });
  return task || null;
}

export async function validateDependencyOwnership(
  dependencyId: string,
  taskId: string
): Promise<InferSelectModel<typeof taskDependencies> | null> {
  const dependency = await db.query.taskDependencies.findFirst({
    where: and(eq(taskDependencies.id, dependencyId), eq(taskDependencies.task_id, taskId))
  });
  return dependency || null;
}

export async function checkDependencyExists(
  taskId: string,
  dependsOnTaskId: string
): Promise<boolean> {
  const existing = await db.query.taskDependencies.findFirst({
    where: and(
      eq(taskDependencies.task_id, taskId),
      eq(taskDependencies.depends_on_task_id, dependsOnTaskId)
    )
  });
  return !!existing;
}

export async function validateBothTasksExistAndOwned(
  taskId: string,
  dependsOnTaskId: string,
  userId: string
): Promise<{
  sourceTask: InferSelectModel<typeof tasks> | null;
  targetTask: InferSelectModel<typeof tasks> | null;
}> {
  const [sourceTask, targetTask] = await Promise.all([
    validateTaskOwnership(taskId, userId),
    validateTaskOwnership(dependsOnTaskId, userId)
  ]);

  return { sourceTask, targetTask };
}
