import { db } from '$lib/db';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  const { user } = await locals.validateSession();

  const apps = await db.query.oauthApplication.findMany({
    where: (table, { eq }) => eq(table.userId, user.id)
  });

  return { apps };
};
