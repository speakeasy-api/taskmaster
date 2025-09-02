import { projects } from '$lib/db/schemas/schema.js';
import { eq, and } from 'drizzle-orm';
import type { RequestHandler } from './$types.js';
import { validateRequest } from '$lib/server/event-utilities/validation.js';
import z from 'zod';

export const DELETE: RequestHandler = async ({ locals }) => {
  const { params } = await validateRequest({
    paramsSchema: z.object({ id: z.string().uuid() })
  });

  const userId = await locals.getUserId();
  const result = await locals.db
    .delete(projects)
    .where(and(eq(projects.created_by, userId), eq(projects.id, params.id)));

  if (result.rowCount === 0) return new Response('Not Found', { status: 404 });

  return new Response(null, { status: 204 });
};
