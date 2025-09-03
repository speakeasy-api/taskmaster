import { tasks, taskStatusEnum } from '$lib/db/schemas/schema.js';
import { json } from '@sveltejs/kit';
import z from 'zod';
import type { RequestHandler } from './$types.js';
import { validateRequest } from '$lib/server/event-utilities/validation.js';

export const GET: RequestHandler = async ({ locals }) => {
  const { query } = await validateRequest({
    querySchema: z.object({ project_id: z.string().uuid().optional() })
  });

  const { project_id } = query;
  const userId = await locals.getUserId();

  const result = await locals.db.query.tasks.findMany({
    where: (table, { eq, and }) => {
      const conditions = [eq(table.created_by, userId)];
      if (project_id) conditions.push(eq(table.project_id, project_id));
      return and(...conditions);
    }
  });

  return json(result);
};

const CreateTaskSchema = z.object({
  title: z.string().min(1).max(255),
  description: z
    .string()
    .min(1, 'Description is required')
    .max(500, 'Description must be 500 characters or less'),
  project_id: z.string().uuid(),
  status: z.enum(taskStatusEnum.enumValues).optional().default('todo')
});

export const POST: RequestHandler = async ({ locals }) => {
  const { body } = await validateRequest({
    bodySchema: CreateTaskSchema
  });

  const result = await locals.db.insert(tasks).values(body).returning();

  if (result.length === 0) {
    return json({ message: 'Failed to create task' }, { status: 500 });
  }

  return json(result[0], { status: 201 });
};
