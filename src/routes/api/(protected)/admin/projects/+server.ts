import { validateRequest } from '$lib/server/event-utilities/validation.js';
import { error, json } from '@sveltejs/kit';
import { z } from 'zod';
import type { RequestHandler } from './$types.js';

export const GET: RequestHandler = async ({ locals }) => {
  const { query } = await validateRequest({
    querySchema: z.object({
      search: z.string().optional(),
      user_id: z.string().optional()
    })
  });
  const { search, user_id } = query;

  const userId = await locals.session.getUserId();
  if (userId.isErr()) {
    locals.logError('Error getting user ID from session', userId.error);
    switch (userId.error._tag) {
      case 'InvalidCredentialError':
        error(401, userId.error.message);
    }
  }

  // Check if user has @speakeasy.com email domain
  const user = await locals.services.adminUsers.get({ id: userId.value });

  if (user.isErr()) {
    switch (user.error._tag) {
      case 'DatabaseError':
        locals.logError('Database error fetching user', user.error);
        throw error(500, 'There was a database error fetching the user.');
      case 'UserNotFoundError':
        throw error(401, 'Current user not found');
    }
  }

  const isAdmin = user.value.email.endsWith('@speakeasy.com');
  if (!isAdmin) {
    error(403, 'Forbidden');
  }

  const result = await locals.services.adminProjects.list({
    created_by: user_id,
    search
  });

  if (result.isOk()) return json(result.value);

  switch (result.error._tag) {
    case 'DatabaseError':
      locals.logError('Database error fetching projects', result.error);
      return json(
        { message: 'There was a database error fetching the projects.' },
        { status: 500 }
      );
  }
};
