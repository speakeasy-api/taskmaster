import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { db } from '$lib/db/index.js';
import { z } from 'zod';
import { validateRequest } from '$lib/server/event-utilities/validation.js';
import { users } from '$lib/db/schemas/auth.js';
import { eq, and } from 'drizzle-orm';

export const GET: RequestHandler = async ({ locals }) => {
  const userId = await locals.getUserId();
  const { query } = await validateRequest({
    querySchema: z.object({
      search: z.string().optional(),
      user_id: z.string().optional()
    })
  });
  const { search, user_id } = query;

  // Check if user has @speakeasy.com email domain
  const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user[0] || !user[0].email.endsWith('@speakeasy.com')) {
    return new Response('Forbidden', { status: 403 });
  }

  const result = await db.query.projects.findMany({
    where: (table, { ilike }) =>
      and(
        search ? ilike(table.name, `%${search}%`) : undefined,
        user_id ? eq(table.created_by, user_id) : undefined
      )
  });

  return json(result);
};
