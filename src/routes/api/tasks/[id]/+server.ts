import { db } from '$lib/db/index.js';
import { tasks } from '$lib/db/schemas/schema.js';
import { and, eq } from 'drizzle-orm';
import { json } from '@sveltejs/kit';
import { validateAuthHeader } from '../_helpers.js';
import type { RequestHandler } from './$types.js';
import z from 'zod';

const UpdateTaskSchema = z.object({
  title: z.string().max(255).optional(),
  description: z.string().max(500).optional(),
  status: z.enum(['backlog', 'triage', 'todo', 'in_progress', 'done', 'canceled']).optional(),
  project_id: z.string().uuid().optional()
});

export const PUT: RequestHandler = async ({ request, params }) => {
  const validToken = await validateAuthHeader(request.headers.get('Authorization'));
  if (!validToken) return new Response('Unauthorized', { status: 401 });

  const authedUserId = validToken.userId;
  if (!authedUserId) {
    return new Response('Invalid token', { status: 400 });
  }

  // Validate request body
  let requestBody;
  try {
    requestBody = await request.json();
  } catch {
    return json({ message: 'Invalid JSON' }, { status: 400 });
  }

  const validation = UpdateTaskSchema.safeParse(requestBody);
  if (!validation.success) {
    const errors = validation.error.flatten().fieldErrors;
    return json({ message: 'Invalid request data', errors }, { status: 400 });
  }

  const updates = validation.data;

  // Check if there are any fields to update
  if (Object.keys(updates).length === 0) {
    return json({ message: 'No fields provided for update' }, { status: 400 });
  }

  // Update the task
  const result = await db
    .update(tasks)
    .set(updates)
    .where(and(eq(tasks.created_by, authedUserId), eq(tasks.id, params.id)))
    .returning();

  if (result.length === 0) {
    return new Response('Not Found', { status: 404 });
  }

  return json(result[0]);
};

export const DELETE: RequestHandler = async ({ request, params }) => {
  const validToken = await validateAuthHeader(request.headers.get('Authorization'));
  if (!validToken) return new Response('Unauthorized', { status: 401 });

  const authedUserId = validToken.userId;
  if (!authedUserId) {
    return new Response('Invalid token', { status: 400 });
  }

  const result = await db
    .delete(tasks)
    .where(and(eq(tasks.created_by, authedUserId), eq(tasks.id, params.id)));

  if (result.rowCount === 0) return new Response('Not Found', { status: 404 });

  return new Response(null, { status: 204 });
};
