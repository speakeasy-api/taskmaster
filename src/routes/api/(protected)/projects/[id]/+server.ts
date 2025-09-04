import { validateRequest } from '$lib/server/event-utilities/validation.js';
import z from 'zod';
import type { RequestHandler } from './$types.js';
import { error } from '@sveltejs/kit';

export const DELETE: RequestHandler = async ({ locals }) => {
  const { params } = await validateRequest({
    paramsSchema: z.object({ id: z.string().uuid() })
  });

  const userId = await locals.session.getUserId();
  if (userId.isErr()) {
    locals.logError('Error getting user ID from session', userId.error);
    switch (userId.error._tag) {
      case 'InvalidCredentialError':
        error(401, userId.error.message);
    }
  }

  const result = await locals.services.projects.delete({
    id: params.id,
    created_by: userId.value
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
