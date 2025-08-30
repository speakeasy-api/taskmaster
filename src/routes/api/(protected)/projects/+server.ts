import { db } from '$lib/db/index.js';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { validateAuthHeader } from '../tasks/_helpers.js';
import { projects } from '$lib/db/schemas/schema.js';
import z from 'zod';

const CreateProjectSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name must be 255 characters or less'),
  description: z
    .string()
    .min(1, 'Description is required')
    .max(500, 'Description must be 500 characters or less')
});

export const GET: RequestHandler = async ({ request }) => {
  const validToken = await validateAuthHeader(request.headers.get('Authorization'));
  if (!validToken) return new Response('Unauthorized', { status: 401 });

  const authedUserId = validToken.userId;
  if (!authedUserId) {
    return new Response('Invalid token', { status: 400 });
  }

  const result = await db.query.projects.findMany({
    where: (table, { eq }) => eq(table.created_by, authedUserId)
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

  const validation = CreateProjectSchema.safeParse(requestBody);
  if (!validation.success) {
    const errors = validation.error.flatten().fieldErrors;
    return json({ message: 'Invalid request data', errors }, { status: 400 });
  }

  const { name, description } = validation.data;

  const insertResult = await db
    .insert(projects)
    .values({
      name,
      description,
      created_by: authedUserId
    })
    .returning();

  if (insertResult.length === 0) {
    return json({ message: 'Failed to create project' }, { status: 500 });
  }

  return json(insertResult[0], { status: 201 });
};
