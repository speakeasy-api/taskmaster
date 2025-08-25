import { getRequestEvent, query } from '$app/server';
import { db } from '$lib/db';
import z from 'zod';

const GetTasksRequest = z.object({
  projectId: z.string().uuid(),
  excludeTaskId: z.string().uuid().optional()
});

export const getTasks = query(GetTasksRequest, async ({ projectId, excludeTaskId }) => {
  const { locals } = getRequestEvent();
  const { user } = await locals.validateSession();

  const result = await db.query.tasks.findMany({
    where: (table, { eq, and, not }) =>
      and(
        eq(table.created_by, user.id),
        eq(table.project_id, projectId),
        excludeTaskId ? not(eq(table.id, excludeTaskId)) : undefined
      )
  });

  return result;
});
