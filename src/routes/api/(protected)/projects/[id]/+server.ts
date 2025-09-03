import { validateRequest } from '$lib/server/event-utilities/validation.js';
import z from 'zod';
import type { RequestHandler } from './$types.js';

export const DELETE: RequestHandler = async ({ locals }) => {
  const { params } = await validateRequest({
    paramsSchema: z.object({ id: z.string().uuid() })
  });

  const result = await locals.services.projects.delete({
    id: params.id,
    created_by: await locals.getUserId()
  });

  if (result.isOk()) return new Response(null, { status: 204 });

  switch (result.error._tag) {
    case 'ProjectNotFoundError':
      return new Response('Not Found', { status: 404 });
    case 'DatabaseError':
      locals.logError('Database error deleting project', result.error);
      return new Response('There was an error deleting the project.', { status: 500 });
  }
};
