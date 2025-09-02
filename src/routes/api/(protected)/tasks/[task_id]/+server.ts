import { tasks, taskStatusEnum } from '$lib/db/schemas/schema.js';
import { validateRequest } from '$lib/server/event-utilities/validation.js';
import { json } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import z from 'zod';
import type { RequestHandler } from './$types.js';

export const PUT: RequestHandler = async ({ locals }) => {
  const { body, params } = await validateRequest({
    paramsSchema: z.object({ task_id: z.string().uuid() }),
    bodySchema: z.object({
      title: z.string().max(255).optional(),
      description: z.string().max(500).optional(),
      status: z.enum(taskStatusEnum.enumValues).optional(),
      project_id: z.string().uuid().optional()
    })
  });

  // Check if there are any fields to update
  if (Object.keys(body).length === 0) {
    return json({ message: 'No fields provided for update' }, { status: 400 });
  }

  // Update the task
  try {
    const userId = await locals.getUserId();
    const result = await locals.db
      .update(tasks)
      .set(body)
      .where(and(eq(tasks.created_by, userId), eq(tasks.id, params.task_id)))
      .returning();
    if (result.length === 0) {
      return new Response('Not Found', { status: 404 });
    }
    return json(result[0]);
  } catch (e) {
    locals.logError(e);
    return json({ message: 'Database error', error: (e as Error).message }, { status: 500 });
  }
};

export const DELETE: RequestHandler = async ({ locals }) => {
  const { params } = await validateRequest({
    paramsSchema: z.object({ task_id: z.string().uuid() })
  });

  const userId = await locals.getUserId();
  const result = await locals.db
    .delete(tasks)
    .where(and(eq(tasks.id, params.task_id), eq(tasks.created_by, userId)));

  if (result.rowCount === 0) return new Response('Not found', { status: 404 });

  return new Response(null, { status: 204 });
};
