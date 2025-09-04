import { users } from '$lib/db/schemas/auth.js';
import { validateRequest } from '$lib/server/event-utilities/validation.js';
import { json } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import type { RequestHandler } from './$types.js';

export const GET: RequestHandler = async ({ locals }) => {
  const userId = await locals.session.getUserId();
  const { query } = await validateRequest({
    querySchema: z.object({
      search: z.string().optional(),
      user_id: z.string().optional()
    })
  });
  const { search, user_id } = query;

  // Check if user has @speakeasy.com email domain
  const user = await locals.session.useDb((db) =>
    db.select().from(users).where(eq(users.id, userId)).limit(1)
  );
  if (!user[0] || !user[0].email.endsWith('@speakeasy.com')) {
    return new Response('Forbidden', { status: 403 });
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
