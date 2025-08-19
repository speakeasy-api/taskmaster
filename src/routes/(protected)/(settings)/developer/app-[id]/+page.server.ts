import { db } from '$lib/db';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
  const { user } = await locals.validateSession();

  const app = await db.query.oauthApplication.findFirst({
    where: (table, { eq, and }) => and(eq(table.userId, user.id), eq(table.id, params.id))
  });

  if (!app) {
    error(404, 'Not found');
  }

  return { app };
};
