import { auth } from '$lib/auth';
import { db } from '$lib/db';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ request }) => {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) redirect(302, '/sign-in');

  const apps = await db.query.oauthApplication.findMany({
    where: (table, { eq }) => eq(table.userId, session.user.id)
  });

  return { apps };
};
