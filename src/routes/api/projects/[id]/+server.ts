import { db } from '$lib/db/index.js';
import { project } from '$lib/db/schemas/schema.js';
import { and, eq } from 'drizzle-orm';
import { validateAuthHeader } from '../../tasks/_helpers.js';
import type { RequestHandler } from './$types.js';

export const DELETE: RequestHandler = async ({ request, params }) => {
  const validToken = await validateAuthHeader(request.headers.get('Authorization'));
  if (!validToken) return new Response('Unauthorized', { status: 401 });

  const authedUserId = validToken.userId;
  if (!authedUserId) {
    return new Response('Invalid token', { status: 400 });
  }

  const result = await db
    .delete(project)
    .where(and(eq(project.created_by, authedUserId), eq(project.id, params.id)));

  if (result.rowCount === 0) return new Response('Not Found', { status: 404 });

  return new Response(null, { status: 204 });
};
