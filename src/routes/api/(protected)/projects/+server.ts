import { projects } from '$lib/db/schemas/schema.js';
import { validateRequest } from '$lib/server/event-utilities/validation.js';
import { json } from '@sveltejs/kit';
import z from 'zod';
import type { RequestHandler } from './$types.js';

export const GET: RequestHandler = async ({ locals }) => {
  const userId = await locals.getUserId();

  const result = await locals.db.query.projects.findMany({
    where: (table, { eq }) => eq(table.created_by, userId)
  });

  return json(result);
};

const CreateProjectSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name must be 255 characters or less'),
  description: z
    .string()
    .min(1, 'Description is required')
    .max(500, 'Description must be 500 characters or less')
});

export const POST: RequestHandler = async ({ locals }) => {
  const { body } = await validateRequest({
    bodySchema: CreateProjectSchema
  });

  const { name, description } = body;

  const insertResult = await locals.db
    .insert(projects)
    .values({
      name,
      description
    })
    .returning();

  if (insertResult.length === 0) {
    return json({ message: 'Failed to create project' }, { status: 500 });
  }

  return json(insertResult[0], { status: 201 });
};
