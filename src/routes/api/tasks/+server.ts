import { db } from '$lib/db/index.js';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { validateAuthHeader } from './_helpers.js';
import { task } from '$lib/db/schemas/schema.js';
import z from 'zod';

const QueryParamsSchema = z.object({
  project_id: z.string().uuid('project_id must be a valid UUID').optional()
});

const CreateTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title must be 255 characters or less'),
  description: z
    .string()
    .min(1, 'Description is required')
    .max(500, 'Description must be 500 characters or less'),
  project_id: z.string().uuid('project_id must be a valid UUID').optional(),
  status: z
    .enum(['backlog', 'triage', 'todo', 'in_progress', 'done', 'canceled'])
    .optional()
    .default('todo')
});

export const GET: RequestHandler = async ({ request, url }) => {
  const validToken = await validateAuthHeader(request.headers.get('Authorization'));
  if (!validToken) return new Response('Unauthorized', { status: 401 });

  const authedUserId = validToken.userId;
  if (!authedUserId) {
    return new Response('Invalid token', { status: 400 });
  }

  // Validate query parameters
  const queryParams = Object.fromEntries(url.searchParams.entries());
  const validation = QueryParamsSchema.safeParse(queryParams);

  if (!validation.success) {
    const errors = validation.error.flatten().fieldErrors;
    return json({ message: 'Invalid query parameters', errors }, { status: 400 });
  }

  const { project_id: projectId } = validation.data;

  const result = await db.query.task.findMany({
    where: (table, { eq, and }) => {
      const conditions = [eq(table.created_by, authedUserId)];
      if (projectId) {
        conditions.push(eq(table.project_id, projectId));
      }
      return and(...conditions);
    }
  });

  return json(result);
};

export const POST: RequestHandler = async ({ request }) => {
  const validToken = await validateAuthHeader(request.headers.get('Authorization'));
  if (!validToken) return new Response('Unauthorized', { status: 401 });

  const authedUserId = validToken.userId;
  if (!authedUserId) {
    return new Response('Invalid token', { status: 400 });
  }

  let requestBody;
  try {
    requestBody = await request.json();
  } catch {
    return json({ message: 'Invalid JSON in request body' }, { status: 400 });
  }

  const validation = CreateTaskSchema.safeParse(requestBody);
  if (!validation.success) {
    const errors = validation.error.flatten().fieldErrors;
    return json({ message: 'Invalid request data', errors }, { status: 400 });
  }

  const { title, description, project_id, status } = validation.data;

  const insertResult = await db
    .insert(task)
    .values({
      title,
      description,
      created_by: authedUserId,
      project_id: project_id || null,
      status
    })
    .returning();

  if (insertResult.length === 0) {
    return json({ message: 'Failed to create task' }, { status: 500 });
  }

  return json(insertResult[0], { status: 201 });
};
